import { ComponentType, ReactNode, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";

interface Canvas3DWrapperProps {
  reduced: boolean;
  className?: string;
  /** Dynamic import returning the scene's default export, e.g. `() => import("./three/GpsPinScene")`. */
  loadScene: () => Promise<{ default: ComponentType }>;
  fallback?: ReactNode;
}

// Shared wrapper for every small 3D scene on the landing page: skips WebGL
// entirely on mobile and under prefers-reduced-motion (renders `fallback`
// instead), only mounts once scrolled near it, and — critically — code-splits
// three.js/@react-three/fiber into their own chunk via dynamic import, so
// visitors who never see a 3D element (mobile, reduced-motion) never download
// that weight as part of the main bundle.
export default function Canvas3DWrapper({ reduced, className = "", loadScene, fallback = null }: Canvas3DWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const shouldRender3D = !reduced && !isMobile && inView;

  const LazyScene = useMemo(() => {
    if (!shouldRender3D) return null;
    return lazy(async () => {
      const [{ Canvas }, sceneModule] = await Promise.all([import("@react-three/fiber"), loadScene()]);
      const Scene = sceneModule.default;
      return {
        default: () => (
          <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0, 5], fov: 40 }}>
            <Scene />
          </Canvas>
        ),
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [shouldRender3D]);

  return (
    <div ref={containerRef} className={className}>
      {LazyScene ? (
        <Suspense fallback={null}>
          <LazyScene />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

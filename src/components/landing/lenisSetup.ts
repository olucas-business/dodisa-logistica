import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsapSetup";

export function createLenis(): { lenis: Lenis; destroy: () => void } {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

  const update = (time: number) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(update);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    },
  };
}

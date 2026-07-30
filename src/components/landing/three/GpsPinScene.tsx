import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

// Abstract, non-figurative 3D GPS marker — geometric primitives only (no
// sourced model), gently bobbing and rotating for depth in the hero.
export default function GpsPinScene() {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.5;
    groupRef.current.position.y = Math.sin(t * 1.1) * 0.15;
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={1.3} />
      <group ref={groupRef}>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.25} />
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.55, 0.85, 32]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.35, 0.32]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
    </>
  );
}

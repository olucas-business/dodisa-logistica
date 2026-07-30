import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const BOX_POSITIONS: [number, number, number][] = [
  [-0.5, 0, -0.3],
  [0.5, 0, -0.3],
  [-0.5, 0, 0.3],
  [0.5, 0, 0.3],
  [0, 0.85, 0],
];

// Abstract stacked pallet/boxes — geometric primitives only, representing
// "Carregamento" without an illustrated/cartoon scene.
export default function CargoScene() {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = 0.5 + Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} />
      <group ref={groupRef} position={[0, -0.4, 0]}>
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[2.2, 0.15, 1.6]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>
        {BOX_POSITIONS.map((pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[0.9, 0.85, 0.85]} />
            <meshStandardMaterial color={i === 4 ? "#3b82f6" : "#60a5fa"} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </>
  );
}

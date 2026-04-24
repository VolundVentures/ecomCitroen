"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";
import type { VehicleConfig } from "./types";

type SceneProps = {
  config: VehicleConfig;
};

function PlaceholderCar({ colorHex }: { colorHex: string }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={[0, -0.2, 0]}>
        <mesh ref={ref} castShadow>
          <boxGeometry args={[2.4, 0.9, 1.1]} />
          <meshStandardMaterial color={colorHex} metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.4, 0.5, 1.0]} />
          <meshStandardMaterial color={colorHex} metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[-0.8, -0.4, 0.55]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh position={[0.8, -0.4, 0.55]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh position={[-0.8, -0.4, -0.55]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh position={[0.8, -0.4, -0.55]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

export function Scene({ config }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 1.4, 4.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0E0E0E"]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Suspense fallback={null}>
        <PlaceholderCar colorHex={config.colorHex} />
        <Environment preset="studio" />
        <ContactShadows
          position={[0, -0.65, 0]}
          opacity={0.6}
          scale={10}
          blur={2.4}
          far={2.4}
        />
      </Suspense>
    </Canvas>
  );
}

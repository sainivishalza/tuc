"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function CenterBlob() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.1}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.35, 6]} />
        <MeshDistortMaterial
          color="#1d4ed8"
          roughness={0.2}
          metalness={0.3}
          distort={0.45}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

function OrbitNode({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={2.2}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.6} />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 4]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#5b9dff" />

      <Suspense fallback={null}>
        <CenterBlob />
        <OrbitNode position={[-1.9, 1.05, -0.5]} scale={0.26} color="#0b2545" />
        <OrbitNode position={[1.95, -0.55, 0.3]} scale={0.18} color="#5b9dff" />
        <OrbitNode position={[1.4, 1.25, -1]} scale={0.14} color="#eef2f7" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

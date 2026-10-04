"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 42;
const CONNECT_DISTANCE = 2.6;
const ACCENT = "#4FD1B5";

function Network({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Deterministic-ish scatter so SSR/CSR don't mismatch meaningfully (this
  // component only ever renders client-side via dynamic(..., { ssr: false })
  // in hero.tsx, but keep the math cheap regardless).
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 4,
        ),
      );
    }
    return pts;
  }, []);

  const lineSegments = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        if (a && b && a.distanceTo(b) < CONNECT_DISTANCE) {
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
    return new Float32Array(positions);
  }, [points]);

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
    groupRef.current.rotation.x += delta * 0.015;
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[lineSegments, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={ACCENT} transparent opacity={0.25} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={ACCENT}
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  );
}

export default function NodeNetworkScene() {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Network reducedMotion={reducedMotion} />
    </Canvas>
  );
}

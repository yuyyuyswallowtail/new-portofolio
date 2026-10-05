"use client";

import { Environment, Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const TEXT = [
  "$ whoami",
  "bintang.mesir",
  "$ stack --list",
  "next react laravel go",
  "$ status",
  "open for work",
].join("\n");

function drawScreen(ctx: CanvasRenderingContext2D, t: number) {
  const W = 320;
  const H = 240;
  ctx.fillStyle = "#04140a";
  ctx.fillRect(0, 0, W, H);

  const cycle = TEXT.length + 24;
  const n = Math.floor(t * 14) % cycle;
  const shown = TEXT.slice(0, Math.min(n, TEXT.length));
  const lines = shown.split("\n");

  ctx.font = '20px "IBM Plex Mono", ui-monospace, monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = "#5dff9a";
  lines.forEach((line, i) => {
    const last = i === lines.length - 1;
    const cursor = last && Math.floor(t * 2) % 2 === 0 ? "█" : "";
    ctx.fillText(line + cursor, 18, 18 + i * 31);
  });

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

function Computer() {
  const group = useRef<THREE.Group>(null);
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);
  const last = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (t - last.current > 0.07) {
      last.current = t;
      const ctx = canvas.getContext("2d");
      if (ctx) drawScreen(ctx, t);
      texture.needsUpdate = true;
    }
    const g = group.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.lerp(
        g.rotation.y,
        state.pointer.x * 0.5,
        0.06,
      );
      g.rotation.x = THREE.MathUtils.lerp(
        g.rotation.x,
        -state.pointer.y * 0.25,
        0.06,
      );
    }
  });

  const BODY = "#d8d1bf";
  return (
    <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.6}>
      <group ref={group} position={[0, 0.2, 0]}>
        <RoundedBox
          args={[2.6, 2.1, 1.5]}
          radius={0.12}
          smoothness={4}
          position={[0, 0.4, 0]}
        >
          <meshStandardMaterial color={BODY} roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.45, 0.755]}>
          <planeGeometry args={[2.1, 1.65]} />
          <meshBasicMaterial color="#14161a" />
        </mesh>
        <mesh position={[0, 0.45, 0.76]}>
          <planeGeometry args={[1.9, 1.45]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <mesh position={[0.95, -0.52, 0.76]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color="#5dff9a" toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <boxGeometry args={[1.1, 0.25, 0.9]} />
          <meshStandardMaterial color={BODY} roughness={0.6} />
        </mesh>
        <RoundedBox
          args={[2.9, 0.14, 1.1]}
          radius={0.05}
          position={[0, -1.0, 0.5]}
        >
          <meshStandardMaterial color="#c9c1ac" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, -0.92, 0.55]}>
          <boxGeometry args={[2.5, 0.04, 0.7]} />
          <meshStandardMaterial color="#2a2d33" roughness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

export default function RetroComputer() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div ref={ref} className="h-52 w-full md:h-64" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.4, 7], fov: 30 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        frameloop={visible ? "always" : "never"}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <Computer />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

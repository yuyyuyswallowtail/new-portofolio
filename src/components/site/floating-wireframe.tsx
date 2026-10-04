"use client";

import dynamic from "next/dynamic";

const FloatingWireframeScene = dynamic(
  () => import("./floating-wireframe-scene"),
  {
    ssr: false,
  },
);

/** A small rotating wireframe icosahedron — brand mark used in the dashboard
 * header and the public Contact section. Second, distinct Three.js element
 * from the hero's node-network, per the "more Three.js" request. */
export function FloatingWireframe({ size = 40 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <FloatingWireframeScene />
    </div>
  );
}

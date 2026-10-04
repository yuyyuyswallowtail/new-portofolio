"use client";

import dynamic from "next/dynamic";

// Three.js/WebGL only ever runs client-side — dynamic import with ssr:false
// keeps it out of the server render and the initial JS the server streams.
const NodeNetworkScene = dynamic(() => import("./node-network-scene"), {
  ssr: false,
});

export function HeroCanvas() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-60"
      aria-hidden="true"
    >
      <NodeNetworkScene />
    </div>
  );
}

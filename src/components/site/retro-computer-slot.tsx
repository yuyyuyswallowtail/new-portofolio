"use client";

import dynamic from "next/dynamic";

// Three.js hanya dimuat di browser.
const RetroComputer = dynamic(() => import("./retro-computer"), { ssr: false });

export function RetroComputerSlot() {
  return <RetroComputer />;
}

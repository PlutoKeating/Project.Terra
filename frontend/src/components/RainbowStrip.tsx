import React from "react";
import { designSystem } from "../designSystem";

interface RainbowStripProps {
  height?: string; // e.g. "12px"
  className?: string;
  id?: string;
}

export default function RainbowStrip({ height = "12px", className = "", id }: RainbowStripProps) {
  return (
    <div
      className={`w-full flex flex-col overflow-hidden ${className}`}
      style={{ height }}
      id={id || "rainbow-strip-container"}
    >
      {designSystem.rainbow.map((color, index) => (
        <div
          key={index}
          className="flex-1 w-full"
          style={{ backgroundColor: color }}
          id={`rainbow-stripe-band-${index}`}
        />
      ))}
    </div>
  );
}

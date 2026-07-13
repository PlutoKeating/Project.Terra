import React from "react";
import { designSystem } from "../designSystem";

export default function LibraryPage() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] w-full px-6 py-10"
      id="library-under-construction"
    >
      <div className="text-center" id="library-message-wrapper">
        <h1
          className="font-courier text-2xl md:text-3xl font-bold tracking-tight text-gray-800"
          style={{ color: designSystem.colors.onSurface }}
        >
          正在开发中
        </h1>
        <p className="font-mono text-xs text-gray-400 mt-2 uppercase tracking-widest">
          Library Page Under Development
        </p>
      </div>
    </div>
  );
}

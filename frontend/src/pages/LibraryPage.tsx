import React from "react";
import { Link } from "react-router-dom";
import { designSystem } from "../designSystem";

export default function LibraryPage() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] w-full px-6 py-10"
      id="library-reference-page"
    >
      <div className="w-full max-w-4xl" id="library-message-wrapper">
        <h1
          className="font-courier text-2xl md:text-3xl font-bold tracking-tight text-gray-800"
          style={{ color: designSystem.colors.onSurface }}
        >
          Architecture Reference Library
        </h1>
        <p className="font-mono text-xs text-gray-400 mt-2 uppercase tracking-widest">
          Terra supported modeling vocabulary
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="border bg-white p-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest">Node Types</h2>
            <p className="mt-3 font-mono text-xs leading-6 text-gray-600">service · database · cache · queue · external · infrastructure</p>
          </section>
          <section className="border bg-white p-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest">Protocols</h2>
            <p className="mt-3 font-mono text-xs leading-6 text-gray-600">HTTP REST · gRPC · GraphQL · WebSocket · AMQP · Kafka · Database · Custom</p>
          </section>
        </div>
        <Link to="/" className="mt-8 inline-block border bg-black px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white">Open Projects</Link>
      </div>
    </div>
  );
}

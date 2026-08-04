import React from "react";
import { Link } from "react-router-dom";
import { designSystem } from "../designSystem";

export default function CommunityPage() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] w-full px-6 py-10"
      id="community-sharing-page"
    >
      <div className="w-full max-w-3xl text-center" id="community-message-wrapper">
        <h1
          className="font-courier text-2xl md:text-3xl font-bold tracking-tight text-gray-800"
          style={{ color: designSystem.colors.onSurface }}
        >
          Share Architecture Safely
        </h1>
        <p className="font-mono text-xs text-gray-400 mt-2 uppercase tracking-widest">
          Projects are private to your account
        </p>
        <div className="mt-8 border bg-white p-8 text-left font-mono text-xs leading-6 text-gray-600">
          使用画布的 Export 功能生成 YAML 或 JSON，再通过 Git、代码评审或团队文档共享。导入副本会获得新的项目 ID，不会覆盖原项目，也不会暴露其他用户的工作区。
        </div>
        <Link to="/" className="mt-8 inline-block border bg-black px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white">Choose a Project</Link>
      </div>
    </div>
  );
}

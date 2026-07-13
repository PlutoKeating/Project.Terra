import React from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HeaderRail from "./components/HeaderRail";
import ProjectsPage from "./pages/ProjectsPage";
import CanvasPage from "./pages/CanvasPage";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import CommunityPage from "./pages/CommunityPage";

// Helper component to redirect /design to the recently entered project
function DesignRedirect() {
  const lastId = localStorage.getItem("lastEnteredProjectId");
  if (lastId) {
    return <Navigate to={`/projects/${lastId}`} replace />;
  }
  return <Navigate to="/" replace />;
}

// Helper component to conditionally render global Header
function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";
  const isCanvasPage = location.pathname.startsWith("/projects/");

  return (
    <div className={`flex flex-col bg-[#fdf7ff] ${isCanvasPage ? "h-screen overflow-hidden" : "min-h-screen"}`} id="app-layout-root">
      {/* Show navigation header on all screens except the sign-in terminal */}
      {!isAuthPage && <HeaderRail />}
      
      <main className={`flex-1 flex flex-col ${!isAuthPage ? "pt-[70px]" : ""} ${isCanvasPage ? "h-[calc(100vh-70px)] overflow-hidden" : ""}`} id="app-main-content">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<CanvasPage />} />
          <Route path="/design" element={<DesignRedirect />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Catch all redirect to main dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}

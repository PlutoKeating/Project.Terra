import React from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HeaderRail from "./components/HeaderRail";
import ProjectsPage from "./pages/ProjectsPage";
import CanvasPage from "./pages/CanvasPage";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import CommunityPage from "./pages/CommunityPage";
import { supabase } from "./lib/supabase";

// Helper component to redirect /design to the recently entered project
function DesignRedirect() {
  const lastId = localStorage.getItem("lastEnteredProjectId");
  if (lastId) {
    return <Navigate to={`/projects/${lastId}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!supabase);
  const [authenticated, setAuthenticated] = React.useState(!supabase);
  const location = useLocation();

  React.useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen flex items-center justify-center font-mono text-xs">AUTHENTICATING...</div>;
  if (sessionStorage.getItem("terra-password-recovery") === "true") return <Navigate to="/login" replace />;
  if (!authenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
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
          <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
          <Route path="/design" element={<ProtectedRoute><DesignRedirect /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
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

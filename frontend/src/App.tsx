import React, { useState, useEffect, createContext, useContext } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HeaderRail from "./components/HeaderRail";
import ProjectsPage from "./pages/ProjectsPage";
import CanvasPage from "./pages/CanvasPage";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import CommunityPage from "./pages/CommunityPage";
import { apiFetch } from "./apiFetch";

// Global Auth Context
interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

// Helper component to redirect /design to the recently entered project
function DesignRedirect() {
  const lastId = localStorage.getItem("lastEnteredProjectId");
  if (lastId) {
    return <Navigate to={`/projects/${lastId}`} replace />;
  }
  return <Navigate to="/" replace />;
}

// Guard Wrapper to protect private routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-widest text-gray-500">
        [ AUTHENTICATING SESSION TERMINAL... ]
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

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
          <Route path="/login" element={<AuthPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
          <Route path="/design" element={<ProtectedRoute><DesignRedirect /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          
          {/* Catch all redirect to main dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await apiFetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setEmail(data.email);
        localStorage.setItem("terra-user-email", data.email);
      } else {
        setIsAuthenticated(false);
        setEmail(null);
        localStorage.removeItem("terra-user-email");
      }
    } catch {
      setIsAuthenticated(false);
      setEmail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (userEmail: string) => {
    setIsAuthenticated(true);
    setEmail(userEmail);
    localStorage.setItem("terra-user-email", userEmail);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setEmail(null);
    localStorage.removeItem("terra-user-email");
    localStorage.removeItem("lastEnteredProjectId");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, loading, login, logout }}>
      <HashRouter>
        <AppLayout />
      </HashRouter>
    </AuthContext.Provider>
  );
}

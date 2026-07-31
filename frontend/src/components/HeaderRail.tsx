import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Settings, User, Search, LogOut } from "lucide-react";
import { designSystem } from "../designSystem";
import RainbowStrip from "./RainbowStrip";
import { apiFetch } from "../apiFetch";
import { supabase } from "../lib/supabase";

export default function HeaderRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [designPath, setDesignPath] = React.useState<string>("/");
  const [profileMenuOpen, setProfileMenuOpen] = React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronize designPath on location change and page loads
  React.useEffect(() => {
    if (location.pathname.startsWith("/projects/")) {
      const id = location.pathname.split("/")[2];
      if (id) {
        localStorage.setItem("lastEnteredProjectId", id);
      }
    }
  }, [location.pathname]);

  React.useEffect(() => {
    const storedId = localStorage.getItem("lastEnteredProjectId");
    if (storedId) {
      setDesignPath(`/projects/${storedId}`);
    } else {
      // Fetch list of projects to find the first one as fallback
      apiFetch("/api/v1/projects")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setDesignPath(`/projects/${data[0].id}`);
          } else {
            setDesignPath("/");
          }
        })
        .catch(() => {
          setDesignPath("/");
        });
    }
  }, [location.pathname]);

  const isTabActive = (tab: "projects" | "design" | "library" | "community") => {
    if (tab === "projects") {
      return location.pathname === "/";
    }
    if (tab === "design") {
      return location.pathname.startsWith("/projects/") || location.pathname === "/design";
    }
    if (tab === "library") {
      return location.pathname === "/library";
    }
    if (tab === "community") {
      return location.pathname === "/community";
    }
    return false;
  };

  return (
    <header
      className="w-full border-b fixed top-0 left-0 right-0 z-50 shadow-sm"
      style={{
        backgroundColor: designSystem.colors.surfaceContainerLowest,
        borderColor: designSystem.colors.borderLight,
      }}
      id="global-header"
    >
      {/* Top Header Rail Brand Band */}
      <RainbowStrip height="6px" id="header-top-rainbow" />

      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between" id="header-content-inner">
        {/* Brand & Tabs */}
        <div className="flex items-center space-x-12" id="header-left">
          <Link
            to="/"
            className="text-2xl font-bold tracking-wider font-courier"
            style={{ color: designSystem.colors.onSurface }}
            id="brand-logo"
          >
            Terra
          </Link>

          <nav className="hidden md:flex items-center space-x-6" id="header-navigation">
            <Link
              to="/"
              className={`font-mono text-xs uppercase tracking-widest pb-1 transition-colors relative ${
                isTabActive("projects")
                  ? "font-bold text-purple-900 border-b-2"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={{
                borderColor: isTabActive("projects") ? designSystem.colors.primary : "transparent",
              }}
              id="nav-link-projects"
            >
              Projects
            </Link>
            <Link
              to={designPath}
              className={`font-mono text-xs uppercase tracking-widest pb-1 transition-colors relative ${
                isTabActive("design")
                  ? "font-bold text-purple-900 border-b-2"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={{
                borderColor: isTabActive("design") ? designSystem.colors.primary : "transparent",
              }}
              id="nav-link-design"
            >
              Design
            </Link>
            <Link
              to="/library"
              className={`font-mono text-xs uppercase tracking-widest pb-1 transition-colors relative ${
                isTabActive("library")
                  ? "font-bold text-purple-900 border-b-2"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={{
                borderColor: isTabActive("library") ? designSystem.colors.primary : "transparent",
              }}
              id="nav-link-library"
            >
              Library
            </Link>
            <Link
              to="/community"
              className={`font-mono text-xs uppercase tracking-widest pb-1 transition-colors relative ${
                isTabActive("community")
                  ? "font-bold text-purple-900 border-b-2"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={{
                borderColor: isTabActive("community") ? designSystem.colors.primary : "transparent",
              }}
              id="nav-link-community"
            >
              Community
            </Link>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-4" id="header-right">
          <div className="relative hidden sm:block" id="header-search-container">
            <input
              type="text"
              placeholder="Search..."
              className="py-1 px-3 pl-8 text-xs font-mono outline-none border focus:border-black transition-colors"
              style={{
                backgroundColor: designSystem.colors.surfaceContainerLow,
                borderColor: designSystem.colors.outlineVariant,
                color: designSystem.colors.onSurface,
              }}
              id="header-search-input"
            />
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              id="header-search-icon"
            />
          </div>

          <button
            className="p-1.5 border transition-colors hover:bg-gray-100"
            style={{
              borderColor: designSystem.colors.borderLight,
              color: designSystem.colors.onSurfaceVariant,
            }}
            id="header-bell-button"
            title="Notifications"
          >
            <Bell size={16} />
          </button>

          <button
            className="p-1.5 border transition-colors hover:bg-gray-100"
            style={{
              borderColor: designSystem.colors.borderLight,
              color: designSystem.colors.onSurfaceVariant,
            }}
            id="header-settings-button"
            title="Settings"
          >
            <Settings size={16} />
          </button>

          <div className="relative" ref={dropdownRef} id="header-profile-dropdown-container">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-8 h-8 flex items-center justify-center border font-mono text-xs font-bold bg-amber-100 cursor-pointer hover:bg-amber-200 transition-colors focus:outline-none"
              style={{
                borderColor: designSystem.colors.borderDark,
                color: designSystem.colors.primary,
              }}
              id="user-profile-avatar"
              title="User Profile"
            >
              TH
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg py-1 z-50 rounded-none animate-in fade-in slide-in-from-top-1 duration-100"
                style={{ borderColor: designSystem.colors.borderDark }}
                id="profile-floating-menu"
              >
                <div className="px-4 py-2 border-b border-gray-100" id="profile-menu-user-info">
                  <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Signed in as</p>
                  <p className="font-sans text-xs font-bold text-gray-800 truncate">
                    {localStorage.getItem("terra-user-email") || "Architect"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (supabase) await supabase.auth.signOut();
                    localStorage.removeItem("terra-user-email");
                    localStorage.removeItem("terra-user-role");
                    setProfileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full text-left px-4 py-2.5 font-mono text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2 cursor-pointer"
                  id="profile-sign-out-button"
                >
                  <LogOut size={14} />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from "react";
import {
  Outlet,
  useParams,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Briefcase,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  Mail,
  Github,
} from "lucide-react";

const MinimalistPortfolioLayout = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    // MINIMALIST: Clean slate-950 background, no glowing orbs
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* --- HEADER (Clean, Flat, Border-bottom) --- */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b
          ${
            scrolled
              ? "bg-slate-950/95 border-slate-800"
              : "bg-slate-950 border-transparent"
          }
        `}
      >
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 md:px-8">
          {/* 1. LEFT: Logo (Simple Text) */}
          <div
            className="flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-orange-500 transition-colors">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight text-white cursor-pointer hidden sm:block">
              Portfoli<span className="text-orange-500">Me</span>
            </span>
          </div>

          {/* 2. CENTER: Navigation (Clean Text Links) */}
          <nav className="hidden lg:flex items-center gap-8">
            <NavItem to={`/${username}/home`} label="Overview" />
            <NavItem to={`/${username}/projects`} label="Projects" />
            <NavItem to={`/${username}/settings`} label="Settings" />
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-6">
            {/* Edit Mode Toggle (Simple Switch) */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <span
                className={`text-xs font-medium uppercase tracking-wider ${
                  isEditMode
                    ? "text-orange-500"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {isEditMode ? "Editing" : "View"}
              </span>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  isEditMode ? "bg-orange-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                    isEditMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className={`relative p-1 transition-colors ${
                  isNotifDropdownOpen
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-950"></span>
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-[60] py-2">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-slate-500">
                      No new notifications
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <div
                className="cursor-pointer flex items-center gap-2"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-4 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-[60] py-1">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="overflow-hidden">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                        Signed in
                      </p>
                      <p
                        className="text-sm font-medium text-white truncate"
                        title={currentUser?.email}
                      >
                        {currentUser?.providerData?.some(
                          (p) => p.providerId === "twitter.com"
                        )
                          ? currentUser?.displayName
                          : currentUser?.email}
                      </p>
                    </div>
                    {/* Provider Icon Logic Preserved */}
                    <div className="text-slate-400">
                      {currentUser?.providerData?.some(
                        (p) => p.providerId === "google.com"
                      ) ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      ) : currentUser?.providerData?.some(
                          (p) => p.providerId === "github.com"
                        ) ? (
                        <Github size={16} />
                      ) : currentUser?.providerData?.some(
                          (p) => p.providerId === "twitter.com"
                        ) ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ) : (
                        <Mail size={16} />
                      )}
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => navigate(`/${username}/home`)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded transition-colors text-left"
                    >
                      <User size={16} />
                      Profile
                    </button>
                    <button
                      onClick={() => navigate(`/${username}/settings`)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded transition-colors text-left"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                  </div>
                  <div className="h-px bg-slate-800 mx-1"></div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              className="lg:hidden text-slate-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-64 bg-slate-950 border-l border-slate-800 shadow-2xl p-6 transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-white text-lg">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <MobileNavItem
                to={`/${username}/home`}
                icon={<User size={18} />}
                label="Overview"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/projects`}
                icon={<Briefcase size={18} />}
                label="Projects"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/settings`}
                icon={<Settings size={18} />}
                label="Settings"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="h-px bg-slate-800 my-4"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded text-red-400 hover:bg-red-950/20 w-full text-left"
              >
                <LogOut size={18} />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative pt-24 px-4 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
            <span>{username}</span>
            <ChevronDown size={14} className="-rotate-90" />
            <span className="text-white font-medium capitalize">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          <Outlet context={{ isEditMode }} />
        </div>
      </main>
    </div>
  );
};

// Sub-components (Minimalist Style)
const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `text-sm font-medium transition-colors duration-200
       ${isActive ? "text-orange-500" : "text-slate-400 hover:text-white"}`
    }
  >
    {label}
  </NavLink>
);

const MobileNavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded transition-colors
       ${
         isActive
           ? "bg-slate-900 text-orange-500"
           : "text-slate-400 hover:bg-slate-900 hover:text-white"
       }`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default MinimalistPortfolioLayout;

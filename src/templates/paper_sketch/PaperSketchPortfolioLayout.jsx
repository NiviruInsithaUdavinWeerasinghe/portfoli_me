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
  PenTool,
} from "lucide-react";

const PaperSketchPortfolioLayout = () => {
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
      setScrolled(window.scrollY > 20);
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
    // DARK PAPER BACKGROUND (Graph Paper Pattern)
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 flex flex-col font-mono selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Blueprint Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300">
        <div
          className={`
            max-w-7xl mx-auto h-20 flex items-center justify-between px-6 transition-all duration-300
            ${
              scrolled
                ? "bg-[#1a1a1a] border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                : "bg-transparent border-2 border-transparent"
            }
          `}
        >
          {/* 1. LEFT: Logo (Sketchy Box) */}
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 border-2 border-dashed border-orange-500 flex items-center justify-center text-orange-500 font-bold text-xl group-hover:rotate-6 transition-transform bg-[#1a1a1a]">
              P
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block relative">
              Portfoli
              <span className="text-orange-500 underline decoration-wavy decoration-2 underline-offset-4">
                Me
              </span>
            </span>
          </div>

          {/* 2. CENTER: Navigation (Hand-drawn feel) */}
          <nav className="hidden lg:flex items-center gap-4 bg-[#1a1a1a]/80 border-2 border-white/10 px-6 py-2 rounded-full backdrop-blur-sm absolute left-1/2 -translate-x-1/2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
            <NavItem
              to={`/${username}/home`}
              icon={<User size={18} />}
              label="Overview"
            />
            <div className="w-px h-6 bg-white/20 -rotate-12"></div>
            <NavItem
              to={`/${username}/projects`}
              icon={<Briefcase size={18} />}
              label="Projects"
            />
            <div className="w-px h-6 bg-white/20 -rotate-12"></div>
            <NavItem
              to={`/${username}/settings`}
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-6">
            {/* Edit Mode Toggle (Scribble Switch) */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isEditMode ? "text-orange-500" : "text-gray-500"
                }`}
              >
                {isEditMode ? "EDITING..." : "VIEWING"}
              </span>
              <div
                className={`w-12 h-6 border-2 border-white/30 rounded-full relative transition-colors ${
                  isEditMode ? "bg-orange-900/20 border-orange-500" : ""
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 border-2 border-white bg-white rounded-full transition-all duration-300 ${
                    isEditMode
                      ? "translate-x-6 bg-orange-500 border-orange-500"
                      : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Notification Bell (Rough Circle) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className={`
                  p-2 border-2 rounded-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_#fff]
                  ${
                    isNotifDropdownOpen
                      ? "bg-white text-black border-white"
                      : "border-white/30 text-gray-400 hover:border-white hover:text-white"
                  }
                `}
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 border-2 border-[#1a1a1a] rounded-full"></span>
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#1a1a1a] border-2 border-dashed border-white/30 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] p-4 z-[60]">
                  <h3 className="text-sm font-bold text-white border-b-2 border-white/10 pb-2 mb-4">
                    // NOTIFICATIONS
                  </h3>
                  <div className="py-8 flex flex-col items-center justify-center text-center text-gray-500">
                    <PenTool size={24} className="mb-2 opacity-50" />
                    <p className="text-xs">No updates sketched yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile (Polaroid Style) */}
            <div className="relative">
              <div
                className="cursor-pointer group relative"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
              >
                <div className="w-10 h-10 bg-white p-1 shadow-md group-hover:rotate-3 transition-transform duration-300">
                  <div className="w-full h-full bg-gray-800 overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="User"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                        {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                </div>
                {/* Tape effect */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-white/30 rotate-45"></div>

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-6 w-72 bg-[#1a1a1a] border-2 border-white shadow-[8px_8px_0px_0px_#ea580c] z-[60]">
                    {/* User Info */}
                    <div className="p-4 border-b-2 border-dashed border-white/20 bg-white/5 flex items-center justify-between gap-4">
                      <div className="overflow-hidden flex-1">
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">
                          CURRENT_USER
                        </p>
                        <p
                          className="text-sm font-bold text-white truncate"
                          title={currentUser?.email}
                        >
                          {/* Check if logged in via Twitter (X), show name instead of email */}
                          {currentUser?.providerData?.some(
                            (p) => p.providerId === "twitter.com"
                          )
                            ? currentUser?.displayName
                            : currentUser?.email}
                        </p>
                      </div>

                      <div className="shrink-0 p-2 border-2 border-white/10 bg-black/20 rounded">
                        {currentUser?.providerData?.some(
                          (p) => p.providerId === "google.com"
                        ) ? (
                          /* Custom Google Icon */
                          <svg
                            width="18"
                            height="18"
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
                          <Github size={18} className="text-white" />
                        ) : currentUser?.providerData?.some(
                            (p) => p.providerId === "twitter.com"
                          ) ? (
                          /* Custom X (Twitter) Icon */
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-white"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ) : (
                          <Mail size={18} className="text-white" />
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="p-2 space-y-2">
                      <button
                        onClick={() => navigate(`/${username}/home`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_#ea580c] transition-all border-2 border-transparent hover:border-black text-left group"
                      >
                        <User size={18} />
                        MY_PROFILE
                      </button>

                      <button
                        onClick={() => navigate(`/${username}/settings`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_#ea580c] transition-all border-2 border-transparent hover:border-black text-left group"
                      >
                        <Settings size={18} />
                        SETTINGS
                      </button>
                    </div>

                    <div className="border-t-2 border-dashed border-white/20 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all border-2 border-transparent hover:border-white text-left group"
                      >
                        <LogOut size={18} />
                        LOGOUT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <button
                className="lg:hidden text-white ml-2 hover:rotate-90 transition-transform duration-300"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-[#1a1a1a]/90 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-3/4 bg-[#1a1a1a] border-l-2 border-dashed border-white/30 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-white/10">
              <span className="font-bold text-xl text-white tracking-widest">
                MENU
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 border-2 border-white hover:bg-white hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              <MobileNavItem
                to={`/${username}/home`}
                icon={<User size={18} />}
                label="OVERVIEW"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/projects`}
                icon={<Briefcase size={18} />}
                label="PROJECTS"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/settings`}
                icon={<Settings size={18} />}
                label="SETTINGS"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <div className="mt-8 pt-8 border-t-2 border-dashed border-white/20">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white w-full text-left font-bold transition-all shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]"
                >
                  <LogOut size={18} />
                  <span>LOGOUT</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative pt-32 px-4 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 flex items-center gap-2 text-sm text-gray-400 font-mono border-b-2 border-dashed border-white/10 pb-2">
            <span className="text-orange-500 font-bold">&gt;</span>
            <span>{username}</span>
            <span className="text-gray-600">/</span>
            <span className="text-white font-bold uppercase decoration-dashed underline underline-offset-4">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          <Outlet context={{ isEditMode }} />
        </div>
      </main>
    </div>
  );
};

// Sub-components (Sketch Style)
const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-3 py-1 transition-all duration-200
       ${
         isActive
           ? "text-orange-500 font-bold border-b-2 border-orange-500 -translate-y-0.5"
           : "text-gray-400 hover:text-white hover:border-b-2 hover:border-white/50"
       }`
    }
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

const MobileNavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-4 border-2 transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]
       ${
         isActive
           ? "bg-orange-500 border-orange-500 text-white"
           : "border-white/20 text-gray-300 hover:border-white hover:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#fff]"
       }`
    }
  >
    {icon}
    <span className="font-bold tracking-wider">{label}</span>
  </NavLink>
);

export default PaperSketchPortfolioLayout;

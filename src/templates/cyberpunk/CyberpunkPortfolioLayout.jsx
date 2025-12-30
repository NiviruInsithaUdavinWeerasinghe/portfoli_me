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

const CyberpunkPortfolioLayout = () => {
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
    <div className="min-h-screen bg-[#050a10] text-blue-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* --- CYBERPUNK BACKGROUND GRID --- */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(90deg, #1e3a8a 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* --- GLOW FX --- */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* --- FLOATING HEADER (ANGULAR & TECH) --- */}
      <header className="fixed top-0 left-0 right-0 z-50 px-0 md:px-4 py-0 md:py-4 transition-all duration-300">
        <div
          className={`
            w-full md:max-w-7xl mx-auto h-20 flex items-center justify-between px-6 border-b md:border
            transition-all duration-300
            ${
              scrolled
                ? "bg-black/90 backdrop-blur-md border-cyan-900/50 shadow-[0_0_20px_rgba(8,145,178,0.2)]"
                : "bg-black/60 backdrop-blur-sm border-white/10"
            }
          `}
        >
          {/* 1. LEFT: Logo */}
          <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-700">
            <div
              className="w-10 h-10 border border-cyan-500 bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-lg hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_cyan] transition-all cursor-pointer"
              onClick={() => navigate("/")}
            >
              P
            </div>
            <div className="flex flex-col leading-none hidden sm:block">
              <span className="text-xs text-gray-500 tracking-[0.2em] uppercase">
                System
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                PORTFOLI<span className="text-orange-500">_ME</span>
              </span>
            </div>
          </div>

          {/* 2. CENTER: Navigation (Terminals) */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <NavItem to={`/${username}/home`} label="OVERVIEW" index="01" />
            <NavItem to={`/${username}/projects`} label="PROJECTS" index="02" />
            <NavItem to={`/${username}/settings`} label="SETTINGS" index="03" />
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-6 animate-in slide-in-from-right-4 duration-700">
            {/* Edit Mode Toggle (Switch Style) */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <span
                className={`
                  text-[10px] font-bold tracking-widest uppercase transition-colors 
                  ${
                    isEditMode
                      ? "text-orange-500 drop-shadow-[0_0_5px_orange]"
                      : "text-gray-500 group-hover:text-gray-300"
                  }
                `}
              >
                {isEditMode ? "EDIT_ON" : "VIEW_ONLY"}
              </span>
              <div
                className={`
                  relative w-10 h-5 border transition-all duration-300
                  ${
                    isEditMode
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-gray-600 bg-black"
                  }
                `}
              >
                <div
                  className={`
                    absolute top-0.5 left-0.5 w-3.5 h-3.5 transition-transform duration-300
                    ${
                      isEditMode
                        ? "translate-x-5 bg-orange-500 shadow-[0_0_10px_orange]"
                        : "translate-x-0 bg-gray-500"
                    }
                  `}
                />
              </div>
            </div>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className={`
                  relative p-2 border transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400
                  ${
                    isNotifDropdownOpen
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                      : "border-transparent text-gray-400"
                  }
                `}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 shadow-[0_0_5px_orange]"></span>
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-6 w-80 bg-[#050a10] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[60] animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-cyan-500 tracking-widest uppercase">
                      // NOTIFICATIONS
                    </h3>
                    <span className="text-[10px] text-gray-500">SYS.READY</span>
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border border-dashed border-gray-600 flex items-center justify-center mb-3">
                      <Bell size={20} className="text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      _NO_NEW_DATA
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative pl-6 border-l border-white/10 flex items-center gap-3">
              <div
                className="relative cursor-pointer group"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
              >
                <div className="w-9 h-9 border border-gray-500 group-hover:border-cyan-400 transition-colors p-0.5">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a202c] flex items-center justify-center text-xs font-bold text-white">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {/* Corner accent */}
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-6 w-72 bg-[#050a10] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[60] animate-in fade-in slide-in-from-top-2">
                    {/* User Info Card */}
                    <div className="bg-cyan-900/10 p-4 border-b border-white/10 flex items-center justify-between gap-4">
                      <div className="overflow-hidden flex-1">
                        <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-1">
                          USER_ID
                        </p>
                        <p
                          className="text-xs font-medium text-white truncate font-mono"
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
                      <div className="shrink-0 text-cyan-500 flex items-center justify-center">
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
                          <Github size={18} />
                        ) : currentUser?.providerData?.some(
                            (p) => p.providerId === "twitter.com"
                          ) ? (
                          /* Custom X (Twitter) Icon */
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ) : (
                          <Mail size={18} /> /* Email/Password Fallback */
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => navigate(`/${username}/home`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-l-2 hover:border-cyan-500 transition-all text-left group uppercase tracking-wider"
                      >
                        <User size={16} />
                        Profile_View
                      </button>

                      <button
                        onClick={() => navigate(`/${username}/settings`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-400 hover:bg-orange-500/10 hover:text-orange-400 hover:border-l-2 hover:border-orange-500 transition-all text-left group uppercase tracking-wider"
                      >
                        <Settings size={16} />
                        Config_Sys
                      </button>
                    </div>
                    <div className="h-px bg-white/10 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-6 py-4 text-xs font-bold text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-all text-left group uppercase tracking-wider"
                    >
                      <LogOut size={16} />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <button
                className="lg:hidden text-white ml-2 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU (Cyberpunk Style) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-3/4 bg-[#050a10] border-l border-cyan-900 p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-4">
              <span className="font-bold text-cyan-500 tracking-widest uppercase">
                // NAV_MENU
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 border border-transparent hover:border-red-500 hover:text-red-500 transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-4 flex-1">
              <MobileNavItem
                to={`/${username}/home`}
                icon={<User size={18} />}
                label="OVERVIEW"
                index="01"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/projects`}
                icon={<Briefcase size={18} />}
                label="PROJECTS"
                index="02"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavItem
                to={`/${username}/settings`}
                icon={<Settings size={18} />}
                label="SETTINGS"
                index="03"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </nav>

            <div className="pt-6 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/30 hover:text-red-300 w-full text-left transition-all uppercase tracking-wider font-bold text-xs"
              >
                <LogOut size={18} />
                <span>TERMINATE_SESSION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative pt-32 px-4 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 flex items-center gap-2 text-xs text-gray-500 font-mono border-b border-white/5 pb-2">
            <span className="text-cyan-600">USR</span>
            <span>: :</span>
            <span className="uppercase">{username}</span>
            <ChevronDown size={10} className="-rotate-90 text-orange-500" />
            <span className="text-white font-bold uppercase tracking-widest">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          <Outlet context={{ isEditMode }} />
        </div>
      </main>
    </div>
  );
};

// Sub-components (Styled for Cyberpunk)

const NavItem = ({ to, label, index }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative group flex items-center gap-2 py-2 transition-all duration-200
       ${isActive ? "text-cyan-400" : "text-gray-500 hover:text-white"}`
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`text-[10px] font-bold ${
            isActive
              ? "text-orange-500"
              : "text-gray-700 group-hover:text-gray-500"
          }`}
        >
          {index}
        </span>
        <span className="text-sm font-bold tracking-widest">{label}</span>

        {/* Active Underline Effect */}
        <span
          className={`absolute -bottom-1 left-0 h-[2px] bg-cyan-500 transition-all duration-300
            ${
              isActive
                ? "w-full shadow-[0_0_10px_cyan]"
                : "w-0 group-hover:w-1/2 group-hover:bg-gray-600"
            }
          `}
        />
      </>
    )}
  </NavLink>
);

const MobileNavItem = ({ to, icon, label, index, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-4 border-l-2 transition-all
       ${
         isActive
           ? "bg-cyan-900/20 border-cyan-500 text-cyan-400"
           : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-gray-600"
       }`
    }
  >
    <span className="text-[10px] font-bold text-gray-600">{index}</span>
    {icon}
    <span className="font-bold tracking-widest text-sm">{label}</span>
  </NavLink>
);

export default CyberpunkPortfolioLayout;

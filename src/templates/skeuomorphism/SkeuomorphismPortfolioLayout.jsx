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

const SkeuomorphismPortfolioLayout = () => {
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

  // Common Skeuomorphic Classes
  const softPlastic =
    "bg-[#292929] shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333]";
  const pressedPlastic =
    "bg-[#292929] shadow-[inset_5px_5px_10px_#1f1f1f,inset_-5px_-5px_10px_#333333]";
  const convexGradient = "bg-gradient-to-br from-[#333333] to-[#1f1f1f]";

  return (
    <div className="min-h-screen bg-[#292929] text-gray-300 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* --- FLOATING HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 py-4 md:px-8">
        <div
          className={`
            max-w-7xl mx-auto rounded-3xl h-20 flex items-center justify-between px-6 transition-all duration-500
            ${
              scrolled
                ? `bg-[#292929]/90 backdrop-blur-md shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#383838]`
                : "bg-transparent"
            }
          `}
        >
          {/* 1. LEFT: Logo (Physical Button) */}
          <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-700">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg cursor-pointer transition-all active:scale-95 ${softPlastic} hover:text-orange-400`}
              onClick={() => navigate("/")}
            >
              P
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block text-gray-400">
              Portfoli<span className="text-orange-500">Me</span>
            </span>
          </div>

          {/* 2. CENTER: Navigation (Indented Track) */}
          <nav
            className={`
              hidden lg:flex items-center gap-6 rounded-full px-6 py-3 absolute left-1/2 -translate-x-1/2
              shadow-[inset_5px_5px_10px_#1f1f1f,inset_-5px_-5px_10px_#333333] bg-[#292929]
            `}
          >
            <NavItem
              to={`/${username}/home`}
              icon={<User size={18} />}
              label="Overview"
            />
            <NavItem
              to={`/${username}/projects`}
              icon={<Briefcase size={18} />}
              label="Projects"
            />
            <NavItem
              to={`/${username}/settings`}
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-6 animate-in slide-in-from-right-4 duration-700">
            {/* Edit Mode Toggle (Physical Switch) */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <span
                className={`
                  text-[11px] font-bold tracking-widest uppercase transition-colors select-none
                  ${isEditMode ? "text-orange-500" : "text-gray-500"}
                `}
              >
                {isEditMode ? "EDIT" : "VIEW"}
              </span>

              {/* Switch Track */}
              <div
                className={`w-14 h-7 rounded-full p-1 transition-all ${pressedPlastic}`}
              >
                {/* Switch Knob */}
                <div
                  className={`
                    w-5 h-5 rounded-full shadow-md transform transition-transform duration-300
                    ${
                      isEditMode
                        ? "translate-x-7 bg-orange-500 shadow-[2px_2px_5px_rgba(0,0,0,0.4)]"
                        : "translate-x-0 bg-gray-400 shadow-[2px_2px_5px_rgba(0,0,0,0.4)]"
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
                  relative p-3 rounded-full transition-all active:scale-95
                  ${isNotifDropdownOpen ? pressedPlastic : softPlastic}
                  ${
                    isNotifDropdownOpen
                      ? "text-orange-500"
                      : "text-gray-400 hover:text-gray-200"
                  }
                `}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_rgba(249,115,22,0.6)]"></span>
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-6 w-80 bg-[#292929] rounded-3xl p-6 z-[60] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in slide-in-from-top-2">
                  <div className="pb-4 border-b border-gray-700/50 mb-4">
                    <h3 className="text-sm font-bold text-gray-300">
                      Notifications
                    </h3>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 text-gray-500 ${pressedPlastic}`}
                    >
                      <Bell size={24} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      No new notifications
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <div
                className={`
                  relative cursor-pointer rounded-full p-1 transition-all active:scale-95
                  ${isProfileDropdownOpen ? pressedPlastic : softPlastic}
                `}
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#292929]">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-6 w-72 bg-[#292929] rounded-3xl p-6 z-[60] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in slide-in-from-top-2">
                  {/* User Info Card */}
                  <div
                    className={`rounded-2xl p-4 mb-6 flex items-center gap-4 ${pressedPlastic}`}
                  >
                    <div className="overflow-hidden flex-1">
                      <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1">
                        Signed in as
                      </p>
                      <p
                        className="text-xs font-bold text-gray-300 truncate"
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

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${softPlastic}`}
                    >
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
                        <Github size={18} className="text-gray-300" />
                      ) : currentUser?.providerData?.some(
                          (p) => p.providerId === "twitter.com"
                        ) ? (
                        /* Custom X (Twitter) Icon */
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-300"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ) : (
                        <Mail size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate(`/${username}/home`)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                    >
                      <User size={18} />
                      Profile
                    </button>

                    <button
                      onClick={() => navigate(`/${username}/settings`)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                    >
                      <Settings size={18} />
                      Settings
                    </button>

                    <div className="h-px bg-gray-700/50 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-red-400 rounded-xl transition-all hover:text-red-300 active:scale-95 ${softPlastic}`}
                    >
                      <LogOut size={18} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              className={`lg:hidden p-3 rounded-xl text-gray-400 active:scale-95 transition-all ${softPlastic}`}
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
            className="absolute inset-0 bg-[#292929]/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-3/4 bg-[#292929] shadow-[-10px_0_20px_rgba(0,0,0,0.5)] p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-gray-300 text-lg">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-full text-gray-400 active:scale-95 ${softPlastic}`}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
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
              <div className="h-px bg-gray-700/50 my-4"></div>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl text-red-400 font-bold transition-all active:scale-95 ${softPlastic}`}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative pt-32 px-4 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
            <span
              className={`px-2 py-1 rounded-md text-xs font-bold ${pressedPlastic}`}
            >
              {username}
            </span>
            <ChevronDown size={12} className="-rotate-90" />
            <span className="text-gray-300 font-bold capitalize tracking-wide">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          <Outlet context={{ isEditMode }} />
        </div>
      </main>
    </div>
  );
};

// Sub-components (Skeuomorphic)
const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ease-out
       ${
         isActive
           ? "text-orange-500 shadow-[inset_5px_5px_10px_#1f1f1f,inset_-5px_-5px_10px_#333333]" /* Pressed */
           : "text-gray-400 hover:text-gray-200 shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333] hover:-translate-y-0.5" /* Popped */
       }`
    }
  >
    <div className="relative z-10">{icon}</div>
    <span className="text-sm font-bold relative z-10">{label}</span>
  </NavLink>
);

const MobileNavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-4 rounded-xl transition-all
       ${
         isActive
           ? "text-orange-500 shadow-[inset_5px_5px_10px_#1f1f1f,inset_-5px_-5px_10px_#333333]"
           : "text-gray-400 shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333] active:scale-95"
       }`
    }
  >
    {icon}
    <span className="font-bold">{label}</span>
  </NavLink>
);

export default SkeuomorphismPortfolioLayout;

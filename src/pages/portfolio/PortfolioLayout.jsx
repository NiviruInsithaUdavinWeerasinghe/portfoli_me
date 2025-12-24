import React, { useState, useEffect } from "react";
import { Outlet, useParams, NavLink, useLocation } from "react-router-dom";
import {
  Briefcase,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  Edit3,
  Eye,
  Bell,
  ChevronDown,
} from "lucide-react";

const PortfolioLayout = () => {
  const { username } = useParams();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for the glass header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* --- BACKGROUND FX --- */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* --- FLOATING HEADER --- */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          px-4 py-4 md:px-8
        `}
      >
        <div
          className={`
            max-w-7xl mx-auto
            ${
              scrolled
                ? "bg-gray-900/70 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/20"
                : "bg-gray-900/40 backdrop-blur-lg border-white/5"
            }
            border rounded-2xl
            h-20 flex items-center justify-between px-6
            transition-all duration-500
          `}
        >
          {/* 1. LEFT: Logo */}
          <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-700">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30 group cursor-pointer hover:scale-110 transition-transform">
              P
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              Portfoli<span className="text-orange-500">Me</span>
            </span>
          </div>

          {/* 2. CENTER: Navigation (Apple Dock Style) - Desktop Only */}
          <nav className="hidden lg:flex items-center gap-2 bg-white/5 rounded-full px-2 py-1.5 border border-white/5 shadow-inner backdrop-blur-md absolute left-1/2 -translate-x-1/2">
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
          <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-700">
            {/* Edit Mode Toggle (Premium Animated) */}
            <div
              className="hidden md:flex items-center gap-3 pl-5 pr-1.5 py-1.5 bg-[#0f1623] border border-white/5 rounded-full cursor-pointer hover:border-white/20 hover:bg-[#131b2c] transition-all duration-300 active:scale-95 shadow-inner group"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <span
                className={`text-[11px] font-black tracking-[0.15em] uppercase transition-colors duration-300 select-none ${
                  isEditMode
                    ? "text-orange-500"
                    : "text-slate-400 group-hover:text-slate-300"
                }`}
              >
                {isEditMode ? "EDIT" : "VIEW"}
              </span>

              {/* Toggle Switch */}
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-500 ease-out border border-white/5 ${
                  isEditMode
                    ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                    : "bg-slate-800 ring-1 ring-white/5"
                }`}
              >
                <div
                  className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] transform transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    isEditMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Notification */}
            <button className="relative p-2 rounded-full hover:bg-white/5 transition-all hover:scale-110 text-gray-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0B1120]"></span>
            </button>

            {/* User Profile Dropdown Trigger */}
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 shadow-lg shadow-purple-500/20 cursor-pointer hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                  alt="User"
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                />
              </div>
              <button
                className="lg:hidden text-white"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute top-4 right-4 left-4 bg-[#0B1120] border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-white">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-white/5 rounded-full text-white"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
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
              <div className="h-px bg-white/5 my-2"></div>
              <MobileNavItem
                to="/"
                icon={<LogOut size={18} />}
                label="Sign Out"
                variant="danger"
              />
            </nav>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative pt-28 px-4 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Breadcrumb-like Header for Page Content */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <span>{username}</span>
            <ChevronDown size={12} className="-rotate-90" />
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

// --- Helper: Desktop Nav Item (Jelly Dock Animation) ---
const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
       hover:scale-110 active:scale-95
       ${
         isActive
           ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/50"
           : "text-gray-400 hover:text-white hover:bg-white/10"
       }
      `
    }
  >
    <div className="relative z-10">{icon}</div>
    <span className="text-sm font-medium relative z-10">{label}</span>
  </NavLink>
);

// --- Helper: Mobile Nav Item ---
const MobileNavItem = ({ to, icon, label, onClick, variant = "default" }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
       ${variant === "danger" ? "text-red-400 hover:bg-red-500/10" : ""}
       ${
         isActive && variant !== "danger"
           ? "bg-orange-600 text-white"
           : "text-gray-400 hover:bg-white/5 hover:text-white"
       }
      `
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default PortfolioLayout;

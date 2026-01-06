import React, { useState, useEffect } from "react";
// --- NEW IMPORTS FOR FETCHING NAME & UPDATING STATUS ---
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
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

const LiquidGlassPortfolioLayout = () => {
  const { username } = useParams(); // This 'username' is actually the UID from the URL
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Check if the viewer is the owner
  // Ensure we compare strings safely
  const isOwner = currentUser?.uid && username && currentUser.uid === username;

  // States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // UPDATED: Initialize state from localStorage to persist across reloads
  const [isEditMode, setIsEditMode] = useState(() => {
    const savedMode = localStorage.getItem("isEditMode");
    return savedMode === "true";
  });

  // UPDATED: Save to localStorage whenever isEditMode changes
  useEffect(() => {
    localStorage.setItem("isEditMode", isEditMode);
  }, [isEditMode]);

  const [scrolled, setScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // NEW: State to store the Firestore photoURL (for Email/Password users)
  const [dbPhotoURL, setDbPhotoURL] = useState(null);

  // NEW STATE for breadcrumb name
  const [breadcrumbName, setBreadcrumbName] = useState("Loading...");

  // --- NEW: FETCH DB AVATAR FOR CURRENT USER ---
  // This ensures we get the picture even if Auth provider (Email/Pass) doesn't have it synced
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!currentUser?.uid) return;
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setDbPhotoURL(userDocSnap.data().photoURL);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };
    fetchUserAvatar();
  }, [currentUser]);

  // --- NEW: PRESENCE MANAGEMENT SYSTEM ---
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userRef = doc(db, "users", currentUser.uid);

    // 1. Set Online on mount
    updateDoc(userRef, { isOnline: true }).catch((err) =>
      console.error("Error setting online:", err)
    );

    // 2. Set Offline on Window Close/Tab Close
    const handleTabClose = () => {
      // Note: This is best-effort. For 100% accuracy on disconnect, Cloud Functions/RTDB is needed.
      updateDoc(userRef, { isOnline: false });
    };

    window.addEventListener("beforeunload", handleTabClose);

    // 3. Set Offline on Unmount (Logout or Navigation away if logic dictates)
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      updateDoc(userRef, { isOnline: false });
    };
  }, [currentUser]);

  // NEW EFFECT: Fetch the display name associated with the URL UID
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!username) return;

      // 1. If viewing own profile, use auth data immediately
      if (currentUser && currentUser.uid === username) {
        setBreadcrumbName(currentUser.displayName || "My Portfolio");
        return;
      }

      // 2. If viewing someone else's, fetch their basic info
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          // Use displayName, fallback to name, fallback to generic
          setBreadcrumbName(data.displayName || data.name || "Portfolio View");
        } else {
          setBreadcrumbName("Unknown User");
        }
      } catch (error) {
        console.error("Error fetching breadcrumb name:", error);
        setBreadcrumbName("Portfolio");
      }
    };

    fetchDisplayName();
  }, [username, currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Safety: Force Edit Mode OFF if user is not the owner
  useEffect(() => {
    if (!isOwner && isEditMode) {
      setIsEditMode(false);
    }
  }, [isOwner, isEditMode]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Hide Scrollbar CSS */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        html, body { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- BACKGROUND FX --- */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* --- FLOATING HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 py-4 md:px-8">
        <div
          className={`
            max-w-[95%] mx-auto border rounded-2xl h-20 flex items-center justify-between px-6 transition-all duration-500
            ${
              scrolled
                ? "bg-gray-900/70 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/20"
                : "bg-gray-900/40 backdrop-blur-lg border-white/5"
            }
          `}
        >
          {/* 1. LEFT: Logo */}
          <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-700">
            <div
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => navigate("/")}
            >
              P
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              Portfoli<span className="text-orange-500">Me</span>
            </span>
          </div>

          {/* 2. CENTER: Navigation */}
          <nav className="hidden lg:flex items-center gap-6 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 shadow-inner backdrop-blur-md absolute left-1/2 -translate-x-1/2">
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
            {/* Only show Settings if isOwner */}
            {isOwner && (
              <NavItem
                to={`/${username}/settings`}
                icon={<Settings size={18} />}
                label="Settings"
              />
            )}
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-700">
            {/* Edit Mode Toggle - Only show if Owner */}
            {isOwner && (
              <div
                className="hidden md:flex items-center gap-3 pl-5 pr-1.5 py-1.5 bg-[#0f1623] border border-white/5 rounded-full cursor-pointer hover:border-white/20 hover:bg-[#131b2c] transition-all duration-300 active:scale-95 shadow-inner group"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <span
                  className={`
                  text-[11px] font-black tracking-[0.15em] uppercase transition-colors duration-300 select-none 
                  ${
                    isEditMode
                      ? "text-orange-500"
                      : "text-slate-400 group-hover:text-slate-300"
                  }
                `}
                >
                  {isEditMode ? "EDIT" : "VIEW"}
                </span>
                <div
                  className={`
                  relative w-11 h-6 rounded-full transition-colors duration-500 ease-out border border-white/5 
                  ${
                    isEditMode
                      ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                      : "bg-slate-800 ring-1 ring-white/5"
                  }
                `}
                >
                  <div
                    className={`
                    absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] transform transition-transform duration-500 
                    ${isEditMode ? "translate-x-5" : "translate-x-0"}
                  `}
                  />
                </div>
              </div>
            )}

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className={`
                  relative p-2 rounded-full transition-all hover:scale-110 
                  ${
                    isNotifDropdownOpen
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }
                `}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0B1120]"></span>
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in slide-in-from-top-2 ring-1 ring-white/5 overflow-hidden">
                  {/* OVERLAY: COMING SOON */}
                  <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded border border-orange-400/20 uppercase tracking-wider shadow-lg">
                      Coming Soon
                    </span>
                  </div>

                  <div className="p-3 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white">
                      Notifications
                    </h3>
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                      <Bell size={20} className="text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      No new notifications
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative pl-2 border-l border-white/10 flex items-center gap-3">
              <div
                className="relative cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
              >
                {/* MATCHED DESIGN: Orange Gradient, Black Ring, Inner Border */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-0.5 shadow-lg shadow-orange-500/20 ring-2 ring-black/40">
                  {/* UPDATED: Check dbPhotoURL first, then currentUser.photoURL */}
                  {dbPhotoURL || currentUser?.photoURL ? (
                    <img
                      src={dbPhotoURL || currentUser.photoURL}
                      alt="User"
                      className="w-full h-full rounded-full object-cover border-2 border-[#0B1120] bg-[#0B1120]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0B1120] flex items-center justify-center text-xs font-bold text-white border-2 border-[#0B1120]">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-4 w-72 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in slide-in-from-top-2 ring-1 ring-white/5">
                    {/* User Info Card */}
                    <div className="bg-white/5 rounded-xl p-5 mb-4 border border-white/5 flex items-center justify-between gap-4">
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5">
                          Signed in as
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

                      {/* Service Icon Display */}
                      <div className="shrink-0 p-2.5 bg-white/5 rounded-lg border border-white/5 text-gray-300 flex items-center justify-center">
                        {currentUser?.providerData?.some(
                          (p) => p.providerId === "google.com"
                        ) ? (
                          /* Custom Google Icon */
                          <svg
                            width="20"
                            height="20"
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
                          <Github size={20} />
                        ) : currentUser?.providerData?.some(
                            (p) => p.providerId === "twitter.com"
                          ) ? (
                          /* Custom X (Twitter) Icon */
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ) : (
                          <Mail size={20} /> /* Email/Password Fallback */
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-1">
                      <button
                        onClick={() => navigate(`/${username}/home`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group"
                      >
                        <div className="p-2 rounded-lg transition-colors bg-blue-500/10 border-blue-500/10 text-blue-500">
                          <User size={18} />
                        </div>
                        Profile
                      </button>

                      <button
                        onClick={() => navigate(`/${username}/settings`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group"
                      >
                        <div className="p-2 rounded-lg transition-colors bg-orange-500/10 border-orange-500/10 text-orange-500">
                          <Settings size={18} />
                        </div>
                        Settings
                      </button>
                    </div>
                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left group text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <div className="p-2 rounded-lg transition-colors bg-red-500/10 border-red-500/10">
                        <LogOut size={18} />
                      </div>
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <button
                className="lg:hidden text-white ml-2"
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

              {/* FIXED: Only show Settings in Mobile Menu if Owner */}
              {isOwner && (
                <MobileNavItem
                  to={`/${username}/settings`}
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              <div className="h-px bg-white/5 my-2"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10 w-full text-left"
              >
                <LogOut size={18} />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative pt-28 px-4 md:px-8 pb-10">
        <div className="max-w-[90%] mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            {/* FIX: Show fetched name instead of raw UID */}
            <span className="font-medium text-gray-400">{breadcrumbName}</span>
            <ChevronDown size={12} className="-rotate-90" />
            <span className="text-white font-medium capitalize">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          {/* Passing isEditMode and isOwner to child pages */}
          <Outlet context={{ isEditMode, setIsEditMode, isOwner }} />
        </div>
      </main>
    </div>
  );
};

// Sub-components
const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ease-in-out hover:scale-110 active:scale-95
       ${
         isActive
           ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/50"
           : "text-gray-400 hover:text-white hover:bg-white/10"
       }`
    }
  >
    <div className="relative z-10">{icon}</div>
    <span className="text-sm font-medium relative z-10">{label}</span>
  </NavLink>
);

const MobileNavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
       ${
         isActive
           ? "bg-orange-600 text-white"
           : "text-gray-400 hover:bg-white/5 hover:text-white"
       }`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default LiquidGlassPortfolioLayout;

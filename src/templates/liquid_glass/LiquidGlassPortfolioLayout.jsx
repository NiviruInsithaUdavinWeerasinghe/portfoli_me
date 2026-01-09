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
  LayoutTemplate,
  Check,
  AlignLeft,
  PanelBottom, // Replaced AlignRight with PanelBottom
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
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

  // NEW: Customization States
  const [portfolioName, setPortfolioName] = useState("PortfoliMe");
  const [headerLayout, setHeaderLayout] = useState("standard"); // standard, sticky, left, right
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // NEW: Sidebar Toggle

  // UPDATED: Save to localStorage whenever isEditMode changes
  useEffect(() => {
    localStorage.setItem("isEditMode", isEditMode);
  }, [isEditMode]);

  // NEW: Fetch Customization Settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!username) return;
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.portfolioName) setPortfolioName(data.portfolioName);
          if (data.headerLayout) setHeaderLayout(data.headerLayout);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [username]);

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

      {/* --- DYNAMIC HEADER --- */}
      <header
        className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${
            headerLayout === "left"
              ? `top-0 left-0 h-screen ${isSidebarCollapsed ? "w-24" : "w-72"}`
              : headerLayout === "bottom"
              ? "bottom-0 left-0 w-full h-32 flex items-end justify-center pointer-events-none pb-6"
              : headerLayout === "sticky"
              ? "top-0 left-0 w-full h-16"
              : "top-0 left-0 w-full h-28 px-4 py-4 md:px-8"
          }
        `}
      >
        <div
          className={`
            border flex items-center justify-between transition-all duration-300 ease-in-out
            ${
              headerLayout === "sticky"
                ? "w-full h-16 px-6 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 rounded-none"
                : headerLayout === "left"
                ? `w-full h-full flex-col items-center justify-between py-6 bg-gray-900/90 backdrop-blur-xl border-white/10 shadow-2xl ${
                    isSidebarCollapsed ? "px-2" : "px-4"
                  }`
                : headerLayout === "bottom"
                ? "pointer-events-auto h-20 px-8 bg-gray-900/80 backdrop-blur-xl rounded-full border-white/10 shadow-2xl shadow-black/50 gap-8"
                : `max-w-[95%] mx-auto rounded-2xl h-20 px-6 ${
                    scrolled
                      ? "bg-gray-900/70 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/20"
                      : "bg-gray-900/40 backdrop-blur-lg border-white/5"
                  }`
            }
          `}
        >
          {/* 1. LOGO AREA */}
          <div
            className={`flex items-center gap-3 animate-in fade-in duration-500 relative transition-all ${
              headerLayout === "left" ? "flex-col w-full" : ""
            }`}
          >
            {/* Sidebar Toggle Button */}
            {headerLayout === "left" && (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-900 border border-white/10 rounded-r-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all z-50"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronLeft size={14} />
                )}
              </button>
            )}

            <div
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
              onClick={() => navigate("/")}
            >
              {portfolioName.charAt(0).toUpperCase()}
            </div>

            {/* Editable Title */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                headerLayout === "left" && isSidebarCollapsed
                  ? "max-h-0 opacity-0"
                  : "max-h-12 opacity-100"
              }`}
            >
              {isOwner && isEditMode ? (
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className="bg-transparent border-b border-orange-500/50 text-lg font-bold tracking-tight text-white focus:outline-none focus:border-orange-500 w-32 text-center"
                />
              ) : (
                <span className="text-lg font-bold tracking-tight block whitespace-nowrap">
                  {portfolioName.substring(0, portfolioName.length - 2)}
                  <span className="text-orange-500">
                    {portfolioName.substring(portfolioName.length - 2)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* 2. NAVIGATION */}
          <nav
            className={`
            hidden lg:flex items-center gap-2 transition-all duration-300 ease-in-out
            ${
              headerLayout === "left"
                ? "flex-col w-full py-2 space-y-1" // Compact vertical stack
                : "gap-6 bg-white/5 border border-white/5 shadow-inner backdrop-blur-md " +
                  (headerLayout === "bottom"
                    ? "rounded-full px-6 py-2"
                    : "rounded-full px-4 py-1.5 absolute left-1/2 -translate-x-1/2")
            }
          `}
          >
            <NavItem
              to={`/${username}/home`}
              icon={<User size={18} />}
              label="Overview"
              collapsed={headerLayout === "left" && isSidebarCollapsed}
              headerLayout={headerLayout}
            />
            <NavItem
              to={`/${username}/projects`}
              icon={<Briefcase size={18} />}
              label="Projects"
              collapsed={headerLayout === "left" && isSidebarCollapsed}
              headerLayout={headerLayout}
            />
            {isOwner && (
              <NavItem
                to={`/${username}/settings`}
                icon={<Settings size={18} />}
                label="Settings"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
                headerLayout={headerLayout}
              />
            )}
          </nav>

          {/* 3. RIGHT: Actions & Profile */}
          <div
            className={`flex items-center transition-all duration-300 ease-in-out ${
              headerLayout === "left"
                ? "flex-col w-full gap-2 border-t border-white/10 pt-4"
                : "gap-4 animate-in fade-in duration-700"
            }`}
          >
            {/* NEW: Header Layout Customizer */}
            {isOwner && isEditMode && (
              <div
                className={`relative ${
                  headerLayout === "left" ? "w-full" : ""
                }`}
              >
                <button
                  onClick={() => {
                    setIsLayoutMenuOpen(!isLayoutMenuOpen);
                    setIsNotifDropdownOpen(false);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`flex items-center transition-all duration-300 group
                    ${
                      headerLayout === "left"
                        ? `w-full rounded-xl hover:bg-white/10 ${
                            isSidebarCollapsed
                              ? "justify-center p-3 mx-auto w-12 h-12"
                              : "px-4 py-3 gap-3"
                          }`
                        : "p-2 rounded-full bg-white/5 hover:bg-white/10 text-orange-400 border border-orange-500/20 hover:rotate-90"
                    }
                  `}
                  title="Customize Layout"
                >
                  <LayoutTemplate
                    size={20}
                    className={`flex-shrink-0 ${
                      headerLayout === "left"
                        ? "text-gray-400 group-hover:text-white"
                        : ""
                    }`}
                  />
                  {headerLayout === "left" && (
                    <span
                      className={`text-sm font-medium text-gray-400 group-hover:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed
                          ? "w-0 opacity-0"
                          : "w-auto opacity-100"
                      }`}
                    >
                      Layout
                    </span>
                  )}
                </button>

                {isLayoutMenuOpen && (
                  <div
                    className={`absolute ${
                      headerLayout === "bottom"
                        ? "bottom-full mb-4 slide-in-from-bottom-2 right-0"
                        : headerLayout === "left"
                        ? `${
                            isSidebarCollapsed
                              ? "left-[calc(100%+1.5rem)]"
                              : "left-[calc(100%+2rem)]"
                          } bottom-0 slide-in-from-left-2`
                        : `top-full ${
                            headerLayout === "sticky" ? "mt-2" : "mt-4"
                          } slide-in-from-top-2 right-0`
                    } w-64 bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl p-3 z-[70] animate-in fade-in ring-1 ring-white/5`}
                  >
                    {/* (Menu Content Same as Before) */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Header Layout
                      </span>
                      <X
                        size={14}
                        className="cursor-pointer text-gray-500 hover:text-white"
                        onClick={() => setIsLayoutMenuOpen(false)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "standard",
                          label: "Floating",
                          icon: <Minimize />,
                        },
                        { id: "sticky", label: "Full Top", icon: <Maximize /> },
                        { id: "left", label: "Sidebar L", icon: <AlignLeft /> },
                        {
                          id: "bottom",
                          label: "Dock",
                          icon: <PanelBottom />,
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setHeaderLayout(opt.id)}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            headerLayout === opt.id
                              ? "bg-orange-500/10 border-orange-500 text-orange-500"
                              : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {opt.icon}
                          <span className="text-[10px] font-medium">
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Mode Toggle */}
            {isOwner && (
              <div
                className={`relative ${
                  headerLayout === "left" ? "w-full" : ""
                }`}
              >
                <button
                  className={`flex items-center transition-all duration-300 group cursor-pointer
                  ${
                    headerLayout === "left"
                      ? `w-full rounded-xl hover:bg-white/10 ${
                          isSidebarCollapsed
                            ? "justify-center p-3 mx-auto w-12 h-12"
                            : "px-4 py-3 gap-3"
                        }`
                      : "gap-3 pl-5 pr-1.5 py-1.5 bg-[#0f1623] border border-white/5 rounded-full hover:border-white/20 hover:bg-[#131b2c] active:scale-95 shadow-inner"
                  }
                `}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {/* Standard Layout Toggle UI */}
                  {headerLayout !== "left" && (
                    <>
                      <span
                        className={`text-[11px] font-black tracking-[0.15em] uppercase transition-colors duration-300 select-none ${
                          isEditMode
                            ? "text-orange-500"
                            : "text-slate-400 group-hover:text-slate-300"
                        }`}
                      >
                        {isEditMode ? "EDIT" : "VIEW"}
                      </span>
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors duration-500 ease-out border border-white/5 ${
                          isEditMode
                            ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                            : "bg-slate-800 ring-1 ring-white/5"
                        }`}
                      >
                        <div
                          className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] transform transition-transform duration-500 ${
                            isEditMode ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </>
                  )}

                  {/* Sidebar Layout Toggle UI (Button Style) */}
                  {headerLayout === "left" && (
                    <>
                      <div
                        className={`relative flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isEditMode
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-500 group-hover:border-white"
                        }`}
                      >
                        {isEditMode && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isSidebarCollapsed
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        } ${
                          isEditMode
                            ? "text-orange-500"
                            : "text-gray-400 group-hover:text-white"
                        }`}
                      >
                        Edit Mode
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Notification Dropdown */}
            <div
              className={`relative ${headerLayout === "left" ? "w-full" : ""}`}
            >
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                  setIsLayoutMenuOpen(false);
                }}
                className={`flex items-center transition-all duration-300 group
                  ${
                    headerLayout === "left"
                      ? `w-full rounded-xl hover:bg-white/10 ${
                          isSidebarCollapsed
                            ? "justify-center p-3 mx-auto w-12 h-12"
                            : "px-4 py-3 gap-3"
                        }`
                      : `relative p-2 rounded-full hover:scale-110 ${
                          isNotifDropdownOpen
                            ? "bg-white/10 text-white"
                            : "hover:bg-white/5 text-gray-400 hover:text-white"
                        }`
                  }
                `}
              >
                <div className="relative flex-shrink-0">
                  <Bell
                    size={20}
                    className={
                      headerLayout === "left"
                        ? "text-gray-400 group-hover:text-white"
                        : ""
                    }
                  />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0B1120] translate-x-1/2 -translate-y-1/2"></span>
                </div>
                {headerLayout === "left" && (
                  <span
                    className={`text-sm font-medium text-gray-400 group-hover:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      isSidebarCollapsed
                        ? "w-0 opacity-0"
                        : "w-auto opacity-100"
                    }`}
                  >
                    Notifications
                  </span>
                )}
              </button>

              {/* Notification Content */}
              {isNotifDropdownOpen && (
                <div
                  className={`absolute ${
                    headerLayout === "bottom"
                      ? "bottom-full mb-4 slide-in-from-bottom-2 -right-24 md:right-0"
                      : headerLayout === "left"
                      ? `${
                          isSidebarCollapsed
                            ? "left-[calc(100%+1.5rem)]"
                            : "left-[calc(100%+2rem)]"
                        } bottom-0 slide-in-from-left-2`
                      : `top-full ${
                          headerLayout === "sticky" ? "mt-2" : "mt-4"
                        } slide-in-from-top-2 -right-24 md:right-0`
                  } w-80 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in ring-1 ring-white/5 overflow-hidden`}
                >
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
            <div
              className={`relative ${
                headerLayout === "left"
                  ? "w-full"
                  : "pl-2 border-l border-white/10 flex items-center gap-3"
              }`}
            >
              <button
                className={`flex items-center transition-all duration-300 group cursor-pointer
                  ${
                    headerLayout === "left"
                      ? `w-full rounded-xl hover:bg-white/10 ${
                          isSidebarCollapsed
                            ? "justify-center p-2 mx-auto w-12 h-12"
                            : "px-4 py-2 gap-3"
                        }`
                      : "hover:scale-105"
                  }
                `}
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                  setIsLayoutMenuOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-0.5 shadow-lg shadow-orange-500/20 ring-1 ring-black/40 flex-shrink-0">
                  {dbPhotoURL || currentUser?.photoURL ? (
                    <img
                      src={dbPhotoURL || currentUser.photoURL}
                      alt="User"
                      className="w-full h-full rounded-full object-cover border border-[#0B1120] bg-[#0B1120]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0B1120] flex items-center justify-center text-[10px] font-bold text-white border border-[#0B1120]">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {headerLayout === "left" && (
                  <div
                    className={`text-left overflow-hidden transition-all duration-300 ease-in-out ${
                      isSidebarCollapsed
                        ? "w-0 opacity-0"
                        : "w-auto opacity-100"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate w-32">
                      {currentUser?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate w-32">
                      Profile & Settings
                    </p>
                  </div>
                )}
              </button>

              {/* Profile Dropdown Content (Same as before) */}
              {isProfileDropdownOpen && (
                <div
                  className={`absolute ${
                    headerLayout === "bottom"
                      ? "bottom-full mb-4 slide-in-from-bottom-2 right-0"
                      : headerLayout === "left"
                      ? `${
                          isSidebarCollapsed
                            ? "left-[calc(100%+1.5rem)]"
                            : "left-[calc(100%+2rem)]"
                        } bottom-0 slide-in-from-left-2`
                      : `top-full ${
                          headerLayout === "sticky" ? "mt-2" : "mt-4"
                        } slide-in-from-top-2 right-0`
                  } w-72 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in ring-1 ring-white/5`}
                >
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
                        {currentUser?.providerData?.some(
                          (p) => p.providerId === "twitter.com"
                        )
                          ? currentUser?.displayName
                          : currentUser?.email}
                      </p>
                    </div>
                    {/* Service Icon... (Same) */}
                    <div className="shrink-0 p-2.5 bg-white/5 rounded-lg border border-white/5 text-gray-300 flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                  </div>

                  {/* Dropdown Links */}
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

              {/* FIXED: Only show Settings & Edit Mode in Mobile Menu if Owner */}
              {isOwner && (
                <>
                  <MobileNavItem
                    to={`/${username}/settings`}
                    icon={<Settings size={18} />}
                    label="Settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />

                  {/* --- MOBILE EDIT MODE TOGGLE --- */}
                  <div
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="flex items-center justify-between px-4 py-3 mt-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-gray-400">Mode</span>
                      <span
                        className={`text-xs font-black tracking-[0.15em] uppercase ${
                          isEditMode ? "text-orange-500" : "text-gray-500"
                        }`}
                      >
                        {isEditMode ? "EDITING" : "VIEWING"}
                      </span>
                    </div>

                    {/* Switch UI */}
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors duration-500 ease-out border border-white/5 ${
                        isEditMode
                          ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                          : "bg-slate-800 ring-1 ring-white/5"
                      }`}
                    >
                      <div
                        className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transform transition-transform duration-500 ${
                          isEditMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-2"></div>
                </>
              )}

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
      <main
        className={`flex-1 relative transition-all duration-500
        ${
          headerLayout === "sticky"
            ? "pt-8"
            : headerLayout === "left"
            ? `pt-8 pl-0 ${isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}` // UPDATED: Adjust padding based on collapse
            : headerLayout === "bottom"
            ? "pt-28 pb-32"
            : "pt-28" // standard
        } px-4 md:px-8 pb-10`}
      >
        <div className="max-w-[90%] mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-400">{breadcrumbName}</span>
            <ChevronDown size={12} className="-rotate-90" />
            <span className="text-white font-medium capitalize">
              {location.pathname.split("/").pop()}
            </span>
          </div>
          {/* Passing context + Header Customization props */}
          <Outlet
            context={{
              isEditMode,
              setIsEditMode,
              isOwner,
              portfolioName,
              setPortfolioName,
              headerLayout,
              setHeaderLayout,
            }}
          />
        </div>
      </main>
    </div>
  );
};

// Sub-components
const NavItem = ({ to, icon, label, collapsed, headerLayout }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center transition-all duration-300 ease-in-out
       ${
         headerLayout === "left"
           ? // Sidebar Styles
             `w-full rounded-xl ${
               collapsed
                 ? "justify-center p-3 mx-auto w-12 h-12"
                 : "px-4 py-3 gap-3"
             } ${
               isActive
                 ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                 : "text-gray-400 hover:bg-white/5 hover:text-white"
             }`
           : // Standard Styles
             `px-4 py-2.5 gap-2 rounded-full hover:scale-110 active:scale-95 ${
               isActive
                 ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/50"
                 : "text-gray-400 hover:text-white hover:bg-white/10"
             }`
       }
      `
    }
  >
    <div className="relative z-10 flex-shrink-0">{icon}</div>
    {/* Hide Text smoothly in Sidebar Left mode */}
    <span
      className={`text-sm font-medium relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
        headerLayout === "left"
          ? collapsed
            ? "w-0 opacity-0"
            : "w-auto opacity-100"
          : "w-auto"
      }`}
    >
      {label}
    </span>
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

import React, { useState, useEffect } from "react";
// --- IMPORTS FOR FETCHING NAME & UPDATING STATUS (LOGIC KEPT) ---
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
  PanelBottom,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Save,
  AlertCircle,
  Terminal,
} from "lucide-react";

const CyberpunkPortfolioLayout = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Check if the viewer is the owner
  const isOwner = currentUser?.uid && username && currentUser.uid === username;

  // States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // LOGIC: Initialize state from localStorage
  const [isEditMode, setIsEditMode] = useState(() => {
    const savedMode = localStorage.getItem("isEditMode");
    return savedMode === "true";
  });

  // LOGIC: Customization States
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [portfolioName, setPortfolioName] = useState("PORTFOLI_ME");

  // LOGIC: Initialize from localStorage
  const [headerLayout, setHeaderLayout] = useState(() => {
    return localStorage.getItem("headerLayout") || "standard";
  });

  const [isPublic, setIsPublic] = useState(true);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // LOGIC: Save to localStorage
  useEffect(() => {
    localStorage.setItem("isEditMode", isEditMode);
  }, [isEditMode]);

  useEffect(() => {
    if (headerLayout) {
      localStorage.setItem("headerLayout", headerLayout);
    }
  }, [headerLayout]);

  // LOGIC: Track Original Settings
  const [originalSettings, setOriginalSettings] = useState({
    portfolioName: "PORTFOLI_ME",
    headerLayout: "standard",
    isPublic: true,
  });

  // LOGIC: Save Animation State & Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(true);

  // LOGIC: Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!username) {
        setIsLoadingSettings(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const fetchedSettings = {
            portfolioName: data.portfolioName || "PORTFOLI_ME",
            headerLayout: data.headerLayout || "standard",
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
          };
          setPortfolioName(fetchedSettings.portfolioName);
          setHeaderLayout(fetchedSettings.headerLayout);
          setIsPublic(fetchedSettings.isPublic);
          setOriginalSettings(fetchedSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [username]);

  // LOGIC: Save Logic
  const handleGlobalSave = async () => {
    if (!currentUser?.uid || !isOwner) return;

    const hasChanges =
      portfolioName !== originalSettings.portfolioName ||
      headerLayout !== originalSettings.headerLayout ||
      isPublic !== originalSettings.isPublic;

    if (!hasChanges) {
      setSaveSuccess(false);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        portfolioName,
        headerLayout,
        isPublic,
      });
      console.log("Global settings saved successfully");
      setOriginalSettings({ portfolioName, headerLayout, isPublic });
      setSaveSuccess(true);
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveSuccess(false);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const [scrolled, setScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [dbPhotoURL, setDbPhotoURL] = useState(null);
  const [breadcrumbName, setBreadcrumbName] = useState("LOADING...");

  // LOGIC: Fetch DB Avatar
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

  // LOGIC: Presence Management
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "users", currentUser.uid);
    updateDoc(userRef, { isOnline: true }).catch((err) =>
      console.error("Error setting online:", err)
    );
    const handleTabClose = () => {
      updateDoc(userRef, { isOnline: false });
    };
    window.addEventListener("beforeunload", handleTabClose);
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      updateDoc(userRef, { isOnline: false });
    };
  }, [currentUser]);

  // LOGIC: Fetch Display Name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!username) return;
      if (currentUser && currentUser.uid === username) {
        setBreadcrumbName(currentUser.displayName || "MY_PORTFOLIO");
        return;
      }
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setBreadcrumbName(data.displayName || data.name || "PORTFOLIO_VIEW");
        } else {
          setBreadcrumbName("UNKNOWN_USER");
        }
      } catch (error) {
        console.error("Error fetching breadcrumb name:", error);
        setBreadcrumbName("PORTFOLIO");
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
    <div className="min-h-screen bg-[#050a10] text-blue-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Hide Scrollbar CSS */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        html, body { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

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

      {/* --- DYNAMIC HEADER (Cyberpunk Style) --- */}
      {!isLoadingSettings && (
        <header
          key={headerLayout}
          className={`fixed z-50 animate-in fade-in duration-500 ease-out transition-all
          ${
            headerLayout === "left"
              ? `slide-in-from-top-6 top-0 left-0 w-full h-20 px-0 py-0 xl:slide-in-from-left-6 xl:h-screen ${
                  isSidebarCollapsed ? "xl:w-20" : "xl:w-72"
                }`
              : headerLayout === "bottom"
              ? "slide-in-from-bottom-6 bottom-0 left-0 w-full h-auto min-h-[5rem] flex items-end justify-center pointer-events-none pb-4 md:pb-6 px-2"
              : headerLayout === "sticky"
              ? "slide-in-from-top-6 top-0 left-0 w-full h-16"
              : "slide-in-from-top-6 top-0 left-0 w-full h-20 px-0 md:px-4 py-0 md:py-4"
          }
        `}
        >
          <div
            className={`
            flex items-center justify-between transition-all duration-300 ease-in-out relative
            ${
              headerLayout === "sticky"
                ? `w-full h-16 px-4 md:px-6 bg-black/90 border-b border-cyan-900/50 backdrop-blur-md`
                : headerLayout === "left"
                ? `w-full mx-auto h-20 px-6 border-b border-cyan-900/50 bg-black/90 backdrop-blur-md
                   xl:max-w-none xl:mx-0 xl:h-full xl:flex-col xl:items-center xl:justify-start xl:gap-8 xl:py-6 xl:bg-black/80 xl:border-b-0 xl:border-r xl:border-cyan-900/50
                   ${isSidebarCollapsed ? "xl:px-2" : "xl:px-6"}`
                : headerLayout === "bottom"
                ? `pointer-events-auto w-[95%] md:w-auto xl:min-w-fit max-w-7xl h-16 md:h-20 px-6 md:px-12 bg-[#050a10]/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(8,145,178,0.3)] backdrop-blur-md gap-6 md:gap-10 mx-auto clip-path-polygon`
                : `w-full md:max-w-7xl mx-auto h-20 px-6 border-b md:border border-cyan-900/50 ${
                    scrolled
                      ? "bg-black/90 backdrop-blur-md shadow-[0_0_20px_rgba(8,145,178,0.2)]"
                      : "bg-black/60 backdrop-blur-sm border-white/10"
                  }`
            }
          `}
          >
            {/* 1. LOGO AREA */}
            <div
              className={`flex items-center gap-4 animate-in fade-in duration-500 relative transition-all ${
                headerLayout === "left"
                  ? "flex-row xl:flex-col w-auto xl:w-full"
                  : ""
              }`}
            >
              {/* Sidebar Toggle Button - Desktop Only */}
              {headerLayout === "left" && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black border border-cyan-500 items-center justify-center text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all z-50`}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                </button>
              )}

              <div
                className="w-10 h-10 border border-cyan-500 bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-lg hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_cyan] transition-all cursor-pointer flex-shrink-0"
                onClick={() => navigate("/")}
              >
                {portfolioName.charAt(0).toUpperCase()}
              </div>

              {/* Editable Title */}
              <div
                className={`flex flex-col leading-none transition-all duration-300 ease-in-out overflow-hidden ${
                  headerLayout === "left" && isSidebarCollapsed
                    ? "xl:max-h-0 xl:opacity-0 hidden xl:flex"
                    : "opacity-100 flex"
                } ${headerLayout === "left" ? "xl:items-center" : ""}`}
              >
                <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase hidden sm:block">
                  System
                </span>
                {isOwner && isEditMode ? (
                  <input
                    type="text"
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    className="bg-transparent border-b border-orange-500/50 text-lg font-bold tracking-tight text-white focus:outline-none focus:border-orange-500 w-32 font-mono uppercase"
                  />
                ) : (
                  <span className="text-lg font-bold tracking-tight text-white uppercase">
                    {portfolioName.substring(0, portfolioName.length - 2)}
                    <span className="text-orange-500">
                      {portfolioName.substring(portfolioName.length - 2)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* 2. NAVIGATION (Desktop) - Terminals */}
            <nav
              className={`
            hidden xl:flex items-center gap-8 transition-all duration-300 ease-in-out
            ${
              headerLayout === "left"
                ? "flex-col w-full py-4 space-y-2 items-start px-2" // Sidebar
                : headerLayout === "bottom"
                ? "gap-12"
                : "absolute left-1/2 -translate-x-1/2" // Centered for standard
            }
          `}
            >
              <NavItem
                to={`/${username}/home`}
                label="OVERVIEW"
                index="01"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
              />
              <NavItem
                to={`/${username}/projects`}
                label="PROJECTS"
                index="02"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
              />
              {isOwner && (
                <NavItem
                  to={`/${username}/settings`}
                  label="SETTINGS"
                  index="03"
                  collapsed={headerLayout === "left" && isSidebarCollapsed}
                />
              )}
            </nav>

            {/* 3. RIGHT: Actions & Profile */}
            <div
              className={`flex items-center gap-4 transition-all duration-300 ease-in-out ${
                headerLayout === "left"
                  ? "flex-row xl:flex-col w-auto xl:w-full gap-4 xl:border-t xl:border-cyan-900/30 xl:pt-6 xl:mt-auto"
                  : "animate-in fade-in duration-700"
              }`}
            >
              {/* Mobile Menu Toggle */}
              <div className="xl:hidden flex items-center gap-4 relative">
                <button
                  className="text-white hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* ORDER: 1. Edit Mode Toggle - Desktop Only */}
              {isOwner && (
                <div
                  className={`hidden xl:block ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 cursor-pointer group
                    ${
                      headerLayout === "left"
                        ? isSidebarCollapsed
                          ? "justify-center"
                          : "justify-start px-2"
                        : ""
                    }
                  `}
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {/* Sidebar Collapsed Mode */}
                    {headerLayout === "left" && isSidebarCollapsed ? (
                      <div
                        className={`w-3 h-3 rounded-sm ${
                          isEditMode
                            ? "bg-orange-500 shadow-[0_0_10px_orange]"
                            : "bg-gray-600"
                        }`}
                      />
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ORDER: 2. Save Button (Tech Button) */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block ${
                    headerLayout === "left" ? "w-full px-2" : ""
                  }`}
                >
                  <button
                    onClick={handleGlobalSave}
                    disabled={isSaving}
                    className={`relative group flex items-center justify-center border transition-all duration-300
                      ${
                        headerLayout === "left"
                          ? "w-full py-2"
                          : "p-2 aspect-square"
                      }
                      ${
                        isSaving
                          ? saveSuccess
                            ? "border-green-500 text-green-500 bg-green-500/10"
                            : "border-red-500 text-red-500 bg-red-500/10"
                          : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black"
                      }
                    `}
                    title="SAVE_CHANGES"
                  >
                    {isSaving ? (
                      saveSuccess ? (
                        <Check size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )
                    ) : (
                      <Save size={16} />
                    )}
                    {headerLayout === "left" && !isSidebarCollapsed && (
                      <span className="ml-2 text-xs font-bold tracking-wider">
                        {isSaving ? (saveSuccess ? "SAVED" : "NO_CHG") : "SAVE"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 3. Public/Private Toggle */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block ${
                    headerLayout === "left" ? "w-full px-2" : ""
                  }`}
                >
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative group flex items-center justify-center border transition-all duration-300
                      ${
                        headerLayout === "left"
                          ? "w-full py-2"
                          : "p-2 aspect-square"
                      }
                      ${
                        isPublic
                          ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
                          : "border-red-500 text-red-500 hover:bg-red-500 hover:text-black"
                      }
                    `}
                  >
                    {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                    {headerLayout === "left" && !isSidebarCollapsed && (
                      <span className="ml-2 text-xs font-bold tracking-wider">
                        {isPublic ? "PUB" : "PVT"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 4. Layouts (Customizer) */}
              {isOwner && isEditMode && (
                <div
                  className={`relative hidden xl:block ${
                    headerLayout === "left" ? "w-full px-2" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      setIsLayoutMenuOpen(!isLayoutMenuOpen);
                      setIsNotifDropdownOpen(false);
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`relative group flex items-center justify-center border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all duration-300
                      ${
                        headerLayout === "left"
                          ? "w-full py-2"
                          : "p-2 aspect-square"
                      }
                    `}
                    title="LAYOUT"
                  >
                    <LayoutTemplate size={16} />
                    {headerLayout === "left" && !isSidebarCollapsed && (
                      <span className="ml-2 text-xs font-bold tracking-wider">
                        LAYOUT
                      </span>
                    )}
                  </button>

                  {isLayoutMenuOpen && (
                    <div
                      className={`absolute w-48 bg-[#050a10] border border-cyan-500/50 p-2 z-[70] shadow-[0_0_20px_rgba(8,145,178,0.4)] animate-in fade-in
                            ${
                              headerLayout === "bottom"
                                ? "bottom-full mb-4 slide-in-from-bottom-2 right-0"
                                : headerLayout === "left"
                                ? `xl:left-[calc(100%+1.5rem)] xl:bottom-0 xl:top-auto xl:right-auto xl:mt-0 xl:slide-in-from-left-2 top-full right-0 mt-2`
                                : `top-full mt-4 slide-in-from-top-2 right-0`
                            }`}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "standard", icon: <Minimize size={14} /> },
                          { id: "sticky", icon: <Maximize size={14} /> },
                          { id: "left", icon: <AlignLeft size={14} /> },
                          { id: "bottom", icon: <PanelBottom size={14} /> },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setHeaderLayout(opt.id)}
                            className={`flex items-center justify-center p-2 border transition-all ${
                              headerLayout === opt.id
                                ? `border-orange-500 text-orange-500 bg-orange-500/10`
                                : `border-white/10 text-gray-400 hover:border-cyan-500 hover:text-cyan-500`
                            }`}
                          >
                            {opt.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ORDER: 5. Notifications */}
              <div
                className={`relative block order-first xl:order-none ${
                  headerLayout === "left" ? "xl:w-full xl:px-2" : ""
                }`}
              >
                <button
                  onClick={() => {
                    setIsNotifDropdownOpen(!isNotifDropdownOpen);
                    setIsProfileDropdownOpen(false);
                    setIsLayoutMenuOpen(false);
                  }}
                  className={`
                  relative border transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400
                  ${
                    headerLayout === "left"
                      ? "w-full py-2 flex justify-center"
                      : "p-2"
                  }
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
                  <div
                    className={`w-80 max-w-[calc(100vw-2rem)] bg-[#050a10] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[60] animate-in fade-in
                
                /* POSITIONING LOGIC */
                fixed left-1/2 -translate-x-1/2 ${
                  headerLayout === "bottom" ? "bottom-24" : "top-24"
                }
                md:absolute md:left-auto md:translate-x-0 md:top-auto md:bottom-auto

                ${
                  headerLayout === "bottom"
                    ? "md:bottom-full md:mb-4 md:slide-in-from-bottom-2 md:right-0"
                    : headerLayout === "left"
                    ? `xl:left-[calc(100%+1.5rem)] xl:bottom-0 xl:top-auto xl:right-auto xl:mt-0 xl:slide-in-from-left-2 md:top-full md:right-0 md:mt-2`
                    : `md:top-full ${
                        headerLayout === "sticky" ? "md:mt-2" : "md:mt-4"
                      } md:slide-in-from-top-2 md:right-0`
                }`}
                  >
                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-cyan-500 tracking-widest uppercase">
                        // NOTIFICATIONS
                      </h3>
                      <span className="text-[10px] text-gray-500">
                        SYS.READY
                      </span>
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

              {/* ORDER: 6. Profile (Desktop) */}
              <div
                className={`relative hidden xl:block ${
                  headerLayout === "left"
                    ? "w-full xl:px-2 xl:pb-2"
                    : "pl-6 border-l border-white/10 flex items-center gap-3"
                }`}
              >
                <div
                  className={`relative cursor-pointer group ${
                    headerLayout === "left" ? "flex justify-center" : ""
                  }`}
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsNotifDropdownOpen(false);
                    setIsLayoutMenuOpen(false);
                  }}
                >
                  <div
                    className={`w-9 h-9 border border-gray-500 group-hover:border-cyan-400 transition-colors p-0.5 ${
                      headerLayout === "left" && !isSidebarCollapsed
                        ? "w-10 h-10"
                        : ""
                    }`}
                  >
                    {dbPhotoURL || currentUser?.photoURL ? (
                      <img
                        src={dbPhotoURL || currentUser.photoURL}
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
                    <div
                      className={`absolute w-72 max-w-[calc(100vw-2rem)] bg-[#050a10] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[60] animate-in fade-in
                  ${
                    headerLayout === "bottom"
                      ? "bottom-full mb-4 slide-in-from-bottom-2 right-0"
                      : headerLayout === "left"
                      ? `xl:left-[calc(100%+1.5rem)] xl:bottom-0 xl:top-auto xl:right-auto xl:mt-0 xl:slide-in-from-left-2 top-full right-0 mt-2`
                      : `top-full ${
                          headerLayout === "sticky" ? "mt-2" : "mt-4"
                        } slide-in-from-top-2 right-0`
                  }`}
                    >
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
                            {currentUser?.providerData?.some(
                              (p) => p.providerId === "twitter.com"
                            )
                              ? currentUser?.displayName
                              : currentUser?.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => navigate(`/${username}/home`)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-l-2 hover:border-cyan-500 transition-all text-left group uppercase tracking-wider"
                        >
                          <User size={16} /> Profile_View
                        </button>
                        <button
                          onClick={() => navigate(`/${username}/settings`)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-400 hover:bg-orange-500/10 hover:text-orange-400 hover:border-l-2 hover:border-orange-500 transition-all text-left group uppercase tracking-wider"
                        >
                          <Settings size={16} /> Config_Sys
                        </button>
                      </div>
                      <div className="h-px bg-white/10 mx-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-6 py-4 text-xs font-bold text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-all text-left group uppercase tracking-wider"
                      >
                        <LogOut size={16} /> Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* --- MOBILE MENU (Cyberpunk Style) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`absolute bg-[#050a10] border-l border-cyan-900 p-6 shadow-2xl duration-300 max-h-[100vh] overflow-y-auto flex flex-col
              ${
                headerLayout === "bottom"
                  ? "bottom-0 left-0 right-0 h-3/4 animate-in slide-in-from-bottom-full border-l-0 border-t"
                  : "top-0 right-0 bottom-0 w-3/4 animate-in slide-in-from-right"
              }
            `}
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
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

            {/* User Details */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                CURRENT_USER
              </p>
              <p className="text-sm font-bold text-cyan-400 truncate font-mono">
                {currentUser?.email}
              </p>
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

              {isOwner && (
                <>
                  <MobileNavItem
                    to={`/${username}/settings`}
                    icon={<Settings size={18} />}
                    label="SETTINGS"
                    index="03"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />

                  {/* Mobile Edit Toggle */}
                  <div
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="flex items-center justify-between px-4 py-4 mt-2 border border-white/10 bg-white/5 hover:border-orange-500 cursor-pointer transition-all"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                        SYS_MODE
                      </span>
                      <span
                        className={`text-xs font-black tracking-widest uppercase ${
                          isEditMode ? "text-orange-500" : "text-gray-500"
                        }`}
                      >
                        {isEditMode ? "EDITING" : "VIEWING"}
                      </span>
                    </div>
                    <div
                      className={`relative w-10 h-5 border transition-all duration-300 ${
                        isEditMode
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-gray-600 bg-black"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 transition-transform duration-300 ${
                          isEditMode
                            ? "translate-x-5 bg-orange-500"
                            : "translate-x-0 bg-gray-500"
                        }`}
                      />
                    </div>
                  </div>

                  {isEditMode && (
                    <>
                      {/* Mobile Public/Private */}
                      <button
                        onClick={() => setIsPublic(!isPublic)}
                        className={`w-full flex items-center justify-between px-4 py-4 mt-2 border bg-white/5 transition-all
                          ${
                            isPublic
                              ? "border-green-500/50 text-green-400"
                              : "border-red-500/50 text-red-400"
                          }
                        `}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">
                          VISIBILITY
                        </span>
                        <div className="flex items-center gap-2">
                          {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                          <span className="text-xs font-bold">
                            {isPublic ? "PUBLIC" : "PRIVATE"}
                          </span>
                        </div>
                      </button>

                      {/* Mobile Save */}
                      <button
                        onClick={() => {
                          handleGlobalSave();
                          setTimeout(() => {
                            setIsMobileMenuOpen(false);
                          }, 1500);
                        }}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-3 mt-2 px-4 py-4 font-bold uppercase tracking-widest text-xs border transition-all duration-300
                          ${
                            isSaving
                              ? saveSuccess
                                ? "border-green-500 bg-green-900/20 text-green-400"
                                : "border-red-500 bg-red-900/20 text-red-400"
                              : "border-orange-500 bg-orange-900/20 text-orange-400 hover:bg-orange-500 hover:text-black"
                          }
                        `}
                      >
                        {isSaving ? (
                          saveSuccess ? (
                            <Check size={16} />
                          ) : (
                            <AlertCircle size={16} />
                          )
                        ) : (
                          <Save size={16} />
                        )}
                        {isSaving
                          ? saveSuccess
                            ? "SUCCESS"
                            : "NO_CHANGE"
                          : "SAVE_CHANGES"}
                      </button>

                      {/* Mobile Layout Selector */}
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          LAYOUT_CONFIG
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: "standard", icon: <Minimize size={14} /> },
                            { id: "sticky", icon: <Maximize size={14} /> },
                            { id: "bottom", icon: <PanelBottom size={14} /> },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setHeaderLayout(opt.id)}
                              className={`flex items-center justify-center p-3 border transition-all ${
                                headerLayout === opt.id
                                  ? `border-orange-500 text-orange-500 bg-orange-500/10`
                                  : `border-white/10 text-gray-400`
                              }`}
                            >
                              {opt.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </nav>

            <div className="pt-6 border-t border-white/10 mt-4">
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
      <main
        className={`flex-1 relative transition-all duration-500
        ${
          headerLayout === "sticky"
            ? "pt-24"
            : headerLayout === "left"
            ? `pt-28 xl:pt-8 ${
                isSidebarCollapsed ? "xl:pl-[6rem]" : "xl:pl-[20rem]"
              }`
            : headerLayout === "bottom"
            ? "pt-8 pb-32"
            : "pt-32"
        } px-4 md:px-8 pb-10`}
      >
        <div className="max-w-[90%] mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {!isLoadingSettings && (
            <div className="mb-8 flex items-center gap-2 text-xs text-gray-500 font-mono border-b border-white/5 pb-2">
              <span className="text-cyan-600">USR</span>
              <span>: :</span>
              <span className="uppercase">{breadcrumbName}</span>
              <ChevronDown size={10} className="-rotate-90 text-orange-500" />
              <span className="text-white font-bold uppercase tracking-widest">
                {location.pathname.split("/").pop()}
              </span>
            </div>
          )}

          {!isLoadingSettings && (
            <Outlet
              context={{
                isEditMode,
                setIsEditMode,
                isOwner,
                portfolioName,
                setPortfolioName,
                headerLayout,
                setHeaderLayout,
                isPublic,
                setIsPublic,
                handleGlobalSave,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// Sub-components (Styled for Cyberpunk)

const NavItem = ({ to, label, index, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative group flex items-center gap-2 py-2 transition-all duration-200
      ${collapsed ? "justify-center w-full" : ""}
      ${isActive ? "text-cyan-400" : "text-gray-500 hover:text-white"}`
    }
  >
    {({ isActive }) => (
      <>
        {!collapsed && (
          <span
            className={`text-[10px] font-bold ${
              isActive
                ? "text-orange-500"
                : "text-gray-700 group-hover:text-gray-500"
            }`}
          >
            {index}
          </span>
        )}
        <span
          className={`${
            collapsed ? "text-[10px]" : "text-sm"
          } font-bold tracking-widest`}
        >
          {collapsed ? index : label}
        </span>

        {/* Active Underline Effect (Hidden in sidebar if collapsed, or shown vertical) */}
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

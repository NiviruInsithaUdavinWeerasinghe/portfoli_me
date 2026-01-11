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
} from "lucide-react";

const SkeuomorphicPortfolioLayout = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // --- LOGIC: HELPER VARIABLES FOR SKEUOMORPHIC THEME ---
  const softPlastic =
    "bg-[#292929] shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333]";
  const pressedPlastic =
    "bg-[#292929] shadow-[inset_5px_5px_10px_#1f1f1f,inset_-5px_-5px_10px_#333333]";
  const flatPlastic = "bg-[#292929]"; // For non-shadowed elements

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
  const [portfolioName, setPortfolioName] = useState("PortfoliMe");

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
    portfolioName: "PortfoliMe",
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
            portfolioName: data.portfolioName || "PortfoliMe",
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
  const [breadcrumbName, setBreadcrumbName] = useState("Loading...");

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
        setBreadcrumbName(currentUser.displayName || "My Portfolio");
        return;
      }
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
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
    <div className="min-h-screen bg-[#292929] text-gray-300 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Hide Scrollbar CSS */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        html, body { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- DYNAMIC HEADER (Skeuomorphic Design) --- */}
      {!isLoadingSettings && (
        <header
          key={headerLayout}
          className={`fixed z-50 animate-in fade-in duration-500 ease-out transition-all
          ${
            headerLayout === "left"
              ? `slide-in-from-top-6 top-0 left-0 w-full h-20 px-4 py-4 md:px-8 xl:p-0 xl:slide-in-from-left-6 xl:h-screen ${
                  isSidebarCollapsed ? "xl:w-24" : "xl:w-72"
                }`
              : headerLayout === "bottom"
              ? "slide-in-from-bottom-6 bottom-0 left-0 w-full h-auto min-h-[5rem] flex items-end justify-center pointer-events-none pb-4 md:pb-6 px-2"
              : headerLayout === "sticky"
              ? "slide-in-from-top-6 top-0 left-0 w-full h-16"
              : "slide-in-from-top-6 top-0 left-0 w-full h-20 px-4 py-4 md:px-8"
          }
        `}
        >
          <div
            className={`
            flex items-center justify-between transition-all duration-300 ease-in-out relative
            ${
              headerLayout === "sticky"
                ? `w-full h-16 px-4 md:px-6 bg-[#292929] border-b border-[#1f1f1f] shadow-[0_5px_10px_#1f1f1f]`
                : headerLayout === "left"
                ? `w-full max-w-[95%] mx-auto rounded-3xl h-16 md:h-20 px-4 md:px-6 
                   xl:max-w-none xl:mx-0 xl:rounded-none xl:h-full xl:flex-col xl:items-center xl:justify-start xl:gap-8 xl:py-6 xl:bg-[#292929] xl:border-b-0 xl:border-r xl:border-[#1f1f1f] xl:shadow-[5px_0_15px_#1a1a1a]
                   ${
                     scrolled
                       ? "bg-[#292929]/95 backdrop-blur-md shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333]"
                       : "bg-[#292929] xl:shadow-none"
                   }
                   ${isSidebarCollapsed ? "xl:px-2" : "xl:px-4"}`
                : headerLayout === "bottom"
                ? `pointer-events-auto w-[95%] md:w-[92%] xl:w-auto xl:min-w-fit max-w-[95vw] xl:max-w-7xl h-16 md:h-20 px-6 md:px-12 rounded-3xl md:rounded-full gap-6 md:gap-10 mx-auto ${softPlastic}`
                : `w-full max-w-[95%] mx-auto rounded-3xl h-16 md:h-20 px-4 md:px-6 ${
                    scrolled ? softPlastic : "bg-transparent"
                  }`
            }
          `}
          >
            {/* 1. LOGO AREA */}
            <div
              className={`flex items-center gap-3 animate-in fade-in duration-500 relative transition-all ${
                headerLayout === "left"
                  ? "flex-row xl:flex-col w-auto xl:w-full"
                  : ""
              }`}
            >
              {/* Sidebar Toggle Button - Desktop Only */}
              {headerLayout === "left" && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`hidden xl:flex absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-12 rounded-r-xl items-center justify-center text-gray-500 hover:text-orange-500 transition-all z-50 ${softPlastic}`}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                </button>
              )}

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg cursor-pointer transition-all active:scale-95 flex-shrink-0 ${softPlastic} hover:text-orange-400`}
                onClick={() => navigate("/")}
              >
                {portfolioName.charAt(0).toUpperCase()}
              </div>

              {/* Editable Title */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  headerLayout === "left" && isSidebarCollapsed
                    ? "xl:max-h-0 xl:opacity-0"
                    : "max-h-12 opacity-100"
                }`}
              >
                {isOwner && isEditMode ? (
                  <input
                    type="text"
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    className="bg-transparent border-b border-orange-500/50 text-base md:text-lg font-bold tracking-tight text-gray-300 focus:outline-none focus:border-orange-500 w-24 md:w-32 text-center"
                  />
                ) : (
                  <span className="text-base md:text-lg font-bold tracking-tight block whitespace-nowrap text-gray-400">
                    {portfolioName.substring(0, portfolioName.length - 2)}
                    <span className="text-orange-500">
                      {portfolioName.substring(portfolioName.length - 2)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* 2. NAVIGATION (Desktop) - Skeuomorphic Track */}
            <nav
              className={`
            hidden xl:flex items-center gap-2 transition-all duration-300 ease-in-out
            ${
              headerLayout === "left"
                ? "flex-col w-full py-2 space-y-3" // Compact vertical stack
                : `gap-6 ${pressedPlastic} ` +
                  (headerLayout === "bottom"
                    ? "rounded-full px-6 py-2"
                    : "rounded-full px-4 py-2 ml-4 mr-auto")
            }
          `}
            >
              <NavItem
                to={`/${username}/home`}
                icon={<User size={18} />}
                label="Overview"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
                headerLayout={headerLayout}
                softPlastic={softPlastic}
                pressedPlastic={pressedPlastic}
              />
              <NavItem
                to={`/${username}/projects`}
                icon={<Briefcase size={18} />}
                label="Projects"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
                headerLayout={headerLayout}
                softPlastic={softPlastic}
                pressedPlastic={pressedPlastic}
              />
              {isOwner && (
                <NavItem
                  to={`/${username}/settings`}
                  icon={<Settings size={18} />}
                  label="Settings"
                  collapsed={headerLayout === "left" && isSidebarCollapsed}
                  headerLayout={headerLayout}
                  softPlastic={softPlastic}
                  pressedPlastic={pressedPlastic}
                />
              )}
            </nav>

            {/* 3. RIGHT: Actions & Profile */}
            <div
              className={`flex items-center transition-all duration-300 ease-in-out ${
                headerLayout === "left"
                  ? "flex-row xl:flex-col w-auto xl:w-full gap-4 xl:border-t xl:border-[#1f1f1f] xl:pt-6 xl:mt-auto"
                  : "gap-4 md:gap-6 animate-in fade-in duration-700"
              }`}
            >
              {/* Mobile Menu Toggle */}
              <div className="xl:hidden flex items-center gap-4 relative">
                {/* Mobile Profile Pic */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsNotifDropdownOpen(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-10 h-10 rounded-full p-0.5 flex-shrink-0 cursor-pointer active:scale-95 transition-transform ${softPlastic}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#292929]">
                    {dbPhotoURL || currentUser?.photoURL ? (
                      <img
                        src={dbPhotoURL || currentUser.photoURL}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white">
                        {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                </button>

                {/* Mobile Profile Dropdown Content */}
                {isProfileDropdownOpen && (
                  <div
                    className={`absolute right-0 w-72 max-w-[90vw] bg-[#292929] rounded-3xl p-4 z-[70] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in
                  ${
                    headerLayout === "bottom"
                      ? "bottom-full mb-4 slide-in-from-bottom-2 origin-bottom-right"
                      : "top-full mt-4 slide-in-from-top-2 origin-top-right"
                  }`}
                  >
                    {/* User Info Card */}
                    <div
                      className={`rounded-xl p-4 mb-4 flex items-center justify-between gap-4 ${pressedPlastic}`}
                    >
                      <div className="overflow-hidden flex-1 text-left">
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1">
                          Signed in as
                        </p>
                        <p
                          className="text-xs font-bold text-gray-300 truncate"
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

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          navigate(`/${username}/home`);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                      >
                        <User size={18} /> Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/${username}/settings`);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                      >
                        <Settings size={18} /> Settings
                      </button>
                      <div className="h-px bg-gray-700/50 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 rounded-xl transition-all hover:text-red-300 active:scale-95 ${softPlastic}`}
                      >
                        <LogOut size={18} /> Sign out
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`p-2.5 text-gray-400 hover:text-orange-500 rounded-xl ${softPlastic}`}
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* ORDER: 1. Edit Mode Toggle - Desktop Only */}
              {isOwner && (
                <div
                  className={`hidden xl:block relative ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <button
                    className={`flex items-center transition-all duration-300 group cursor-pointer
                  ${
                    headerLayout === "left"
                      ? `w-full rounded-xl ${
                          isSidebarCollapsed
                            ? "justify-center p-3 mx-auto w-12 h-12"
                            : "px-4 py-3 gap-3"
                        } ${softPlastic} active:scale-95`
                      : "gap-3"
                  }
                `}
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {/* Standard Layout Toggle UI (Physical Switch) */}
                    {headerLayout !== "left" && (
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-bold tracking-widest uppercase transition-colors select-none ${
                            isEditMode ? "text-orange-500" : "text-gray-500"
                          }`}
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
                    )}

                    {/* Sidebar Layout Toggle UI */}
                    {headerLayout === "left" && (
                      <>
                        <div
                          className={`relative flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            isEditMode
                              ? "text-orange-500"
                              : "text-gray-500 group-hover:text-gray-300"
                          }`}
                        >
                          {isEditMode && <Check size={16} />}
                        </div>
                        <span
                          className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                            isSidebarCollapsed
                              ? "w-0 opacity-0"
                              : "w-auto opacity-100"
                          } ${
                            isEditMode ? "text-orange-500" : "text-gray-400"
                          }`}
                        >
                          Edit Mode
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 2. Save Button (Physical Button) */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block relative ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <button
                    onClick={handleGlobalSave}
                    disabled={isSaving}
                    className={`flex items-center transition-all duration-300 group cursor-pointer
                      ${
                        headerLayout === "left"
                          ? `w-full rounded-xl active:scale-95 ${
                              isSidebarCollapsed
                                ? "justify-center p-3 mx-auto w-12 h-12"
                                : "px-4 py-3 gap-3"
                            } ${
                              isSaving && saveSuccess
                                ? pressedPlastic
                                : softPlastic
                            }`
                          : `p-3 rounded-full active:scale-95 ${
                              isSaving ? pressedPlastic : softPlastic
                            } ${
                              saveSuccess ? "text-green-500" : "text-red-500"
                            }`
                      }
                    `}
                    title="Save Settings"
                  >
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`transition-all duration-300 transform ${
                          isSaving
                            ? "scale-0 opacity-0 absolute"
                            : "scale-100 opacity-100 text-orange-500"
                        }`}
                      >
                        <Save size={20} />
                      </div>
                      <div
                        className={`transition-all duration-300 transform ${
                          isSaving
                            ? "scale-100 opacity-100"
                            : "scale-0 opacity-0 absolute"
                        }`}
                      >
                        {saveSuccess ? (
                          <Check size={20} className="text-green-500" />
                        ) : (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                      </div>
                    </div>

                    {headerLayout === "left" && (
                      <span
                        className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isSidebarCollapsed
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        } ${
                          isSaving
                            ? saveSuccess
                              ? "text-green-500"
                              : "text-red-500"
                            : "text-orange-500"
                        }`}
                      >
                        {isSaving
                          ? saveSuccess
                            ? "Saved!"
                            : "No Changes"
                          : "Save"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 3. Public/Private Toggle */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block relative ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center transition-all duration-300 group cursor-pointer active:scale-95
                        ${
                          headerLayout === "left"
                            ? `w-full rounded-xl ${softPlastic} ${
                                isSidebarCollapsed
                                  ? "justify-center p-3 mx-auto w-12 h-12"
                                  : "px-4 py-3 gap-3"
                              } ${isPublic ? "text-green-500" : "text-red-500"}`
                            : `p-3 rounded-full ${softPlastic} ${
                                isPublic ? "text-green-500" : "text-red-500"
                              }`
                        }
                      `}
                    title={isPublic ? "Public Profile" : "Private Profile"}
                  >
                    {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                    {headerLayout === "left" && (
                      <span
                        className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isSidebarCollapsed
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        }`}
                      >
                        {isPublic ? "Public" : "Private"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 4. Layouts (Customizer) */}
              {isOwner && isEditMode && (
                <div
                  className={`relative hidden xl:block ${
                    headerLayout === "left" ? "w-auto xl:w-full" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      setIsLayoutMenuOpen(!isLayoutMenuOpen);
                      setIsNotifDropdownOpen(false);
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`flex items-center transition-all duration-300 group active:scale-95
                            ${
                              headerLayout === "left"
                                ? `w-full rounded-xl ${softPlastic} ${
                                    isSidebarCollapsed
                                      ? "justify-center p-3 mx-auto w-12 h-12"
                                      : "px-4 py-3 gap-3"
                                  }`
                                : `p-3 rounded-full text-orange-500 ${softPlastic}`
                            }
                          `}
                    title="Customize Layout"
                  >
                    <LayoutTemplate
                      size={20}
                      className={`flex-shrink-0 ${
                        headerLayout === "left"
                          ? "text-gray-400 group-hover:text-orange-500"
                          : ""
                      }`}
                    />
                    {headerLayout === "left" && (
                      <span
                        className={`text-sm font-bold text-gray-400 group-hover:text-orange-500 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
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
                      className={`absolute w-64 bg-[#292929] rounded-3xl p-4 z-[70] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in
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
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            id: "standard",
                            label: "Floating",
                            icon: <Minimize size={16} />,
                          },
                          {
                            id: "sticky",
                            label: "Full Top",
                            icon: <Maximize size={16} />,
                          },
                          {
                            id: "left",
                            label: "Sidebar L",
                            icon: <AlignLeft size={16} />,
                          },
                          {
                            id: "bottom",
                            label: "Dock",
                            icon: <PanelBottom size={16} />,
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setHeaderLayout(opt.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                              headerLayout === opt.id
                                ? `text-orange-500 ${pressedPlastic}`
                                : `text-gray-400 ${softPlastic} hover:text-gray-200`
                            }`}
                          >
                            {opt.icon}
                            <span className="text-[10px] font-bold">
                              {opt.label}
                            </span>
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
                  headerLayout === "left" ? "xl:w-full" : ""
                }`}
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
                      ? `relative p-2 rounded-full text-gray-400 xl:static xl:w-full xl:rounded-xl active:scale-95 ${softPlastic} ${
                          isSidebarCollapsed
                            ? "xl:justify-center xl:p-3 xl:mx-auto xl:w-12 xl:h-12"
                            : "xl:px-4 xl:py-3 xl:gap-3"
                        }`
                      : `relative p-3 rounded-full active:scale-95 ${
                          isNotifDropdownOpen
                            ? `text-orange-500 ${pressedPlastic}`
                            : `text-gray-400 hover:text-gray-200 ${softPlastic}`
                        }`
                  }
                `}
                >
                  <div className="relative flex-shrink-0">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_rgba(249,115,22,0.6)] translate-x-1/2 -translate-y-1/2"></span>
                  </div>
                  {headerLayout === "left" && (
                    <span
                      className={`hidden xl:block text-sm font-bold text-gray-400 group-hover:text-orange-500 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed
                          ? "w-0 opacity-0"
                          : "w-auto opacity-100"
                      }`}
                    >
                      Notifications
                    </span>
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div
                    className={`w-80 max-w-[calc(100vw-2rem)] bg-[#292929] rounded-3xl p-6 z-[60] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in
                
                /* MOBILE: Fixed Center */
                fixed left-1/2 -translate-x-1/2 ${
                  headerLayout === "bottom" ? "bottom-24" : "top-24"
                }

                /* TABLET & DESKTOP: Absolute Right */
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

              {/* ORDER: 6. Profile (Desktop) */}
              <div
                className={`relative hidden xl:block ${
                  headerLayout === "left"
                    ? "w-full"
                    : "pl-2 flex items-center gap-3"
                }`}
              >
                <button
                  className={`flex items-center transition-all duration-300 group cursor-pointer active:scale-95
                  ${
                    headerLayout === "left"
                      ? `w-full rounded-xl ${softPlastic} ${
                          isSidebarCollapsed
                            ? "justify-center p-2 mx-auto w-12 h-12"
                            : "px-4 py-2 gap-3"
                        }`
                      : `rounded-full p-1 ${softPlastic}`
                  }
                `}
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsNotifDropdownOpen(false);
                    setIsLayoutMenuOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#292929] flex-shrink-0">
                    {dbPhotoURL || currentUser?.photoURL ? (
                      <img
                        src={dbPhotoURL || currentUser.photoURL}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white">
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
                      <p className="text-sm font-bold text-gray-300 group-hover:text-orange-500 truncate w-32">
                        {currentUser?.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate w-32">
                        Profile & Settings
                      </p>
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Content */}
                {isProfileDropdownOpen && (
                  <div
                    className={`absolute w-72 max-w-[calc(100vw-2rem)] bg-[#292929] rounded-3xl p-6 z-[60] shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838] animate-in fade-in
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
                          {currentUser?.providerData?.some(
                            (p) => p.providerId === "twitter.com"
                          )
                            ? currentUser?.displayName
                            : currentUser?.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => navigate(`/${username}/home`)}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                      >
                        <User size={18} /> Profile
                      </button>
                      <button
                        onClick={() => navigate(`/${username}/settings`)}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-gray-400 rounded-xl transition-all hover:text-orange-500 active:scale-95 ${softPlastic}`}
                      >
                        <Settings size={18} /> Settings
                      </button>
                      <div className="h-px bg-gray-700/50 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-red-400 rounded-xl transition-all hover:text-red-300 active:scale-95 ${softPlastic}`}
                      >
                        <LogOut size={18} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div
            className="absolute inset-0 bg-[#292929]/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`absolute bg-[#292929] shadow-[-10px_0_20px_rgba(0,0,0,0.5)] p-6 duration-300 max-h-[85vh] overflow-y-auto rounded-3xl
              ${
                headerLayout === "bottom"
                  ? "bottom-24 left-4 right-4 max-w-md mx-auto animate-in slide-in-from-bottom-4 origin-bottom md:bottom-28 md:right-8 md:left-auto md:mx-0 md:max-w-lg md:w-full md:origin-bottom-right"
                  : "top-4 left-4 right-4 max-w-md mx-auto md:left-auto md:right-4 md:mx-0 md:max-w-lg md:w-full animate-in slide-in-from-top-4 origin-top md:origin-top-right"
              }
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-base font-bold text-gray-400 uppercase tracking-wider">
                Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-full text-gray-400 active:scale-95 ${softPlastic}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* User Details */}
            <div
              className={`rounded-2xl p-4 flex items-center justify-between gap-3 mb-6 ${pressedPlastic}`}
            >
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1">
                  Signed in as
                </p>
                <p
                  className="text-sm font-bold text-gray-300 truncate"
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

            <nav className="flex flex-col gap-4">
              <MobileNavItem
                to={`/${username}/home`}
                icon={<User size={18} />}
                label="Overview"
                onClick={() => setIsMobileMenuOpen(false)}
                softPlastic={softPlastic}
                pressedPlastic={pressedPlastic}
              />
              <MobileNavItem
                to={`/${username}/projects`}
                icon={<Briefcase size={18} />}
                label="Projects"
                onClick={() => setIsMobileMenuOpen(false)}
                softPlastic={softPlastic}
                pressedPlastic={pressedPlastic}
              />

              {isOwner && (
                <>
                  <MobileNavItem
                    to={`/${username}/settings`}
                    icon={<Settings size={18} />}
                    label="Settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    softPlastic={softPlastic}
                    pressedPlastic={pressedPlastic}
                  />

                  {/* Mobile Edit Toggle */}
                  <div
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center justify-between px-4 py-4 mt-2 rounded-xl cursor-pointer active:scale-95 transition-all ${softPlastic}`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-gray-400 font-bold">Mode</span>
                      <span
                        className={`text-xs font-black tracking-[0.15em] uppercase ${
                          isEditMode ? "text-orange-500" : "text-gray-500"
                        }`}
                      >
                        {isEditMode ? "EDITING" : "VIEWING"}
                      </span>
                    </div>

                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors duration-500 ease-out p-1 ${pressedPlastic}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          isEditMode
                            ? "translate-x-5 bg-orange-500"
                            : "translate-x-0 bg-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mobile Edit Options */}
                  {isEditMode && (
                    <>
                      <div
                        onClick={() => setIsPublic(!isPublic)}
                        className={`flex items-center justify-between px-4 py-4 mt-2 rounded-xl cursor-pointer active:scale-95 transition-all ${softPlastic}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              isPublic
                                ? "text-green-500 font-bold"
                                : "text-red-500 font-bold"
                            }
                          >
                            {isPublic ? "Public Profile" : "Private Profile"}
                          </span>
                        </div>
                        <div
                          className={`relative w-11 h-6 rounded-full transition-colors duration-500 ease-out p-1 ${pressedPlastic}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                              isPublic
                                ? "translate-x-5 bg-green-500"
                                : "translate-x-0 bg-red-500"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Mobile Save Button */}
                      <button
                        onClick={() => {
                          handleGlobalSave();
                          setTimeout(() => {
                            setIsMobileMenuOpen(false);
                          }, 1500);
                        }}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-2 mt-2 px-4 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all duration-300
                          ${
                            isSaving
                              ? saveSuccess
                                ? "bg-green-600 text-white shadow-green-900/20"
                                : "bg-red-600 text-white shadow-red-900/20"
                              : `bg-orange-600 text-white shadow-orange-900/20`
                          }
                        `}
                      >
                        {isSaving ? (
                          saveSuccess ? (
                            <Check size={18} />
                          ) : (
                            <AlertCircle size={18} />
                          )
                        ) : (
                          <Save size={18} />
                        )}
                        {isSaving
                          ? saveSuccess
                            ? "Saved Successfully!"
                            : "No Changes"
                          : "Save Changes"}
                      </button>

                      {/* Mobile Header Layout Selector */}
                      <div className={`p-4 mt-4 rounded-xl ${pressedPlastic}`}>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">
                          Header Style
                        </span>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              id: "standard",
                              icon: <Minimize size={18} />,
                            },
                            { id: "sticky", icon: <Maximize size={18} /> },
                            {
                              id: "bottom",
                              icon: <PanelBottom size={18} />,
                            },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setHeaderLayout(opt.id)}
                              className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                                headerLayout === opt.id ||
                                (headerLayout === "left" &&
                                  opt.id === "standard")
                                  ? `text-orange-500 ${pressedPlastic}`
                                  : `text-gray-400 ${softPlastic}`
                              }`}
                            >
                              {opt.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-gray-700/50 my-4"></div>
                </>
              )}

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
      <main
        className={`flex-1 relative transition-all duration-500
        ${
          headerLayout === "sticky"
            ? "pt-24"
            : headerLayout === "left"
            ? `pt-28 xl:pt-8 ${
                isSidebarCollapsed ? "xl:pl-[8rem]" : "xl:pl-[20rem]"
              }`
            : headerLayout === "bottom"
            ? "pt-8 pb-32"
            : "pt-28"
        } px-4 md:px-8 pb-10`}
      >
        <div
          key={headerLayout}
          className={`max-w-[90%] mx-auto relative z-10 animate-in fade-in duration-700 ${
            headerLayout === "left"
              ? "slide-in-from-right-8"
              : "slide-in-from-bottom-8"
          }`}
        >
          {!isLoadingSettings && (
            <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`px-2 py-1 rounded-md text-xs font-bold ${pressedPlastic}`}
              >
                {breadcrumbName}
              </span>
              <ChevronDown size={12} className="-rotate-90" />
              <span className="text-gray-300 font-bold capitalize tracking-wide">
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

// Sub-components (Updated for Skeuomorphism)
const NavItem = ({
  to,
  icon,
  label,
  collapsed,
  headerLayout,
  softPlastic,
  pressedPlastic,
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center transition-all duration-200 ease-in-out
      ${
        headerLayout === "left"
          ? `w-full rounded-xl ${
              collapsed
                ? "justify-center p-3 mx-auto w-12 h-12"
                : "px-4 py-3 gap-3"
            } ${
              isActive
                ? `text-orange-500 ${pressedPlastic}`
                : `text-gray-400 hover:text-gray-200 ${softPlastic} hover:-translate-y-0.5`
            }`
          : `px-5 py-3 gap-2 rounded-full hover:-translate-y-0.5 active:translate-y-0 ${
              isActive
                ? `text-orange-500 ${softPlastic} border border-orange-500/10` // Active state in nav bar usually pops out or stays depressed. Let's make it pop but colored.
                : `text-gray-400 hover:text-white`
            }`
      }
    `
    }
  >
    <div className="relative z-10 flex-shrink-0">{icon}</div>
    <span
      className={`text-sm font-bold relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
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

const MobileNavItem = ({
  to,
  icon,
  label,
  onClick,
  softPlastic,
  pressedPlastic,
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-4 rounded-xl transition-all
      ${
        isActive
          ? `text-orange-500 ${pressedPlastic}`
          : `text-gray-400 ${softPlastic} active:scale-95`
      }`
    }
  >
    {icon}
    <span className="font-bold">{label}</span>
  </NavLink>
);

export default SkeuomorphicPortfolioLayout;

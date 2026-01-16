import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { createPortal } from "react-dom"; // NEW: For Onboarding Modal
// UPDATED: Added query imports
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import logo from "../../assets/logo192.png"; // Import the logo
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
  Globe,
  Lock,
  Save,
  AlertCircle,
  Info,
  Palette,
  Camera,
  Loader2,
  RotateCcw, // NEW: For the revert button
} from "lucide-react";

// NEW: Import Cloudinary Service
import { uploadFileToCloudinary } from "../../services/cloudinaryService";
import OnboardingModal from "../../modals/OnboardingModal"; // NEW: Import Onboarding

const LiquidGlassPortfolioLayout = () => {
  const { username: routeParam } = useParams(); // UPDATED: Renamed to routeParam (could be 'Niviru' or 'uid')
  const [resolvedUid, setResolvedUid] = useState(null); // UPDATED: Store the actual UID

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // UPDATED: Resolve URL param to UID
  useEffect(() => {
    const resolveUser = async () => {
      if (!routeParam) return;

      // 1. If param matches current logged in user's username or uid, we know the UID
      // (This is an optimization, fetch logic below handles the real check)

      try {
        // A. Check if it's a Username
        const q = query(
          collection(db, "users"),
          where("username", "==", routeParam)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Found by username
          setResolvedUid(querySnapshot.docs[0].id);
        } else {
          // B. Assume it's a UID (Legacy or direct access)
          // We verify if this doc exists to be safe, but mostly we can just set it
          setResolvedUid(routeParam);
        }
      } catch (error) {
        console.error("Error resolving user:", error);
      }
    };
    resolveUser();
  }, [routeParam]);

  // UPDATED: Check ownership using resolved UID
  const isOwner =
    currentUser?.uid && resolvedUid && currentUser.uid === resolvedUid;

  // States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // UPDATED: Initialize state from localStorage to persist across reloads
  const [isEditMode, setIsEditMode] = useState(() => {
    const savedMode = localStorage.getItem("isEditMode");
    return savedMode === "true";
  });

  // NEW: Customization States
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [portfolioName, setPortfolioName] = useState("PortfoliMe");

  // NEW: Header Image State
  const [headerImage, setHeaderImage] = useState(logo);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [headerError, setHeaderError] = useState(null);

  // NEW: Dynamic Logo Glow Color
  const [logoGlow, setLogoGlow] = useState("rgba(249, 115, 22, 0.2)"); // Default Orange

  // Helper to extract color from loaded image
  const extractImageColor = (imgElement) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgElement, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setLogoGlow(`rgba(${r}, ${g}, ${b}, 0.3)`);
    } catch (e) {
      console.warn("Could not extract image color (CORS likely):", e);
    }
  };

  // COLOR PICKER STATE
  const [highlightColor, setHighlightColor] = useState("text-orange-500");
  const [highlightIndex, setHighlightIndex] = useState(8);

  // NEW: Dropdown Toggle State for Name Editor (Desktop)
  const [isNameEditorOpen, setIsNameEditorOpen] = useState(false);
  // NEW: Accordion Toggle State for Name Editor (Mobile)
  const [isMobileNameEditorOpen, setIsMobileNameEditorOpen] = useState(false);

  const [headerLayout, setHeaderLayout] = useState(() => {
    return localStorage.getItem("headerLayout") || "standard";
  });

  const [isPublic, setIsPublic] = useState(true);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  // UPDATED: Initialize Sidebar state from localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  // NEW: State to track if header space is too tight
  const [isHeaderTight, setIsHeaderTight] = useState(false);

  // NEW: specific logic to measure space left and toggle profile icon
  useEffect(() => {
    const handleResize = () => {
      // Consider size left: If width < 500px, space is too small for logo + actions + profile
      // This automatically adjusts based on viewport, not a manual CSS class
      setIsHeaderTight(window.innerWidth < 500);
    };

    // Run on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // UPDATED: Save to localStorage whenever isEditMode changes
  useEffect(() => {
    localStorage.setItem("isEditMode", isEditMode);
  }, [isEditMode]);

  // UPDATED: Save to localStorage whenever isSidebarCollapsed changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // FIX: Save headerLayout to localStorage whenever it changes
  useEffect(() => {
    if (headerLayout) {
      localStorage.setItem("headerLayout", headerLayout);
    }
  }, [headerLayout]);

  // NEW: Track Original Settings for Comparison
  const [originalSettings, setOriginalSettings] = useState({
    portfolioName: "PortfoliMe",
    headerImage: logo, // Track image
    headerLayout: "standard",
    isPublic: true,
    highlightColor: "text-orange-500",
    highlightIndex: 8,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false); // NEW: State for onboarding

  // --- NEW: Handle Header Image Upload (Direct Upload) ---
  const handleHeaderImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error
    setHeaderError(null);

    // 1. Strict Validation: Static Images Only (No GIF)
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setHeaderError("Static images only (PNG, JPG, WEBP)");
      // Clear error automatically after 3 seconds
      setTimeout(() => setHeaderError(null), 3000);
      return;
    }

    setIsUploadingHeader(true);
    try {
      // 2. Upload to Cloudinary (Directly)
      const uploadedData = await uploadFileToCloudinary(file);

      // 3. Update State
      setHeaderImage(uploadedData.url);
      console.log("Header image updated:", uploadedData.url);
    } catch (error) {
      console.error("Failed to upload header image", error);
      setHeaderError("Upload failed");
      setTimeout(() => setHeaderError(null), 3000);
    } finally {
      setIsUploadingHeader(false);
    }
  };

  // CONSOLIDATED FIX: Single Effect to Fetch, Update State, Set Baseline, and Stop Loading
  useEffect(() => {
    const fetchSettings = async () => {
      if (!resolvedUid) return;

      try {
        const userDocRef = doc(db, "users", resolvedUid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();

          // Prepare new settings object with defaults
          const fetchedSettings = {
            portfolioName: data.portfolioName || "PortfoliMe",
            headerImage: data.headerImage || logo, // Fetch Custom Image
            headerLayout: data.headerLayout || "standard",
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            highlightColor: data.highlightColor || "text-orange-500",
            highlightIndex:
              data.highlightIndex !== undefined
                ? data.highlightIndex
                : data.portfolioName?.length - 2 || 8,
          };

          // Update UI States
          setPortfolioName(fetchedSettings.portfolioName);
          setHeaderImage(fetchedSettings.headerImage);
          setHeaderLayout(fetchedSettings.headerLayout);
          setIsPublic(fetchedSettings.isPublic);
          setHighlightColor(fetchedSettings.highlightColor);
          setHighlightIndex(fetchedSettings.highlightIndex);

          // Set Baseline
          setOriginalSettings(fetchedSettings);

          // NEW: Check Onboarding Status (Moved from Home)
          // Using currentUser.uid ensures we only check for the logged-in owner
          if (
            currentUser?.uid &&
            currentUser.uid === resolvedUid &&
            (data.setupComplete === false ||
              data.githubConfigured === undefined)
          ) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [resolvedUid]);

  // NEW: Conditional Save Logic
  const handleGlobalSave = async () => {
    if (!currentUser?.uid || !isOwner) return;

    // 1. Check for changes
    const hasChanges =
      portfolioName !== originalSettings.portfolioName ||
      headerImage !== originalSettings.headerImage || // Check image change
      headerLayout !== originalSettings.headerLayout ||
      isPublic !== originalSettings.isPublic ||
      highlightColor !== originalSettings.highlightColor ||
      highlightIndex !== originalSettings.highlightIndex;

    // 2. Handle "No Changes" Scenario
    if (!hasChanges) {
      setSaveSuccess(false);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
      return;
    }

    // 3. Handle Valid Save
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        portfolioName,
        headerImage, // Save image URL
        headerLayout,
        isPublic,
        highlightColor,
        highlightIndex,
      });
      console.log("Global settings saved successfully");

      // Update baseline
      setOriginalSettings({
        portfolioName,
        headerImage,
        headerLayout,
        isPublic,
        highlightColor,
        highlightIndex,
      });

      setSaveSuccess(true);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
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
      // UPDATED: Check resolvedUid instead of username
      if (!resolvedUid) return;

      // 1. If viewing own profile, use auth data immediately
      if (currentUser && currentUser.uid === resolvedUid) {
        setBreadcrumbName(currentUser.displayName || "My Portfolio");
        return;
      }

      // 2. If viewing someone else's, fetch their basic info
      try {
        // UPDATED: Use resolvedUid for DB fetch
        const userDocRef = doc(db, "users", resolvedUid);
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
  }, [resolvedUid, currentUser]); // UPDATED: Dependency

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // UPDATED: Removed the "Safety Check" useEffect.
  // We rely on the UI conditionals (e.g., {isOwner && ...}) to hide buttons.
  // This prevents Edit Mode from turning off automatically while Auth is loading.

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // --- NEW: Global Page Tips Logic ---
  const [showPageTips, setShowPageTips] = useState(false);
  const tipsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tipsRef.current && !tipsRef.current.contains(event.target)) {
        setShowPageTips(false);
      }
    };
    if (showPageTips) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPageTips]);

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
      {/* ONLY RENDER HEADER AFTER SETTINGS LOAD TO PREVENT FLASH */}
      {!isLoadingSettings && (
        <header
          /* FIXED: key={headerLayout} forces React to unmount the old header and mount the new one 
             instead of trying to morph the shapes, which causes the "garbage" effect. */
          key={headerLayout}
          className={`fixed z-50 animate-in fade-in duration-500 ease-out
          ${
            headerLayout === "left"
              ? /* Mobile: Standard Floating (fallback) | Desktop: Sidebar */
                `slide-in-from-top-6 top-0 left-0 w-full h-20 px-4 py-4 md:px-8 xl:p-0 xl:slide-in-from-left-6 xl:h-screen ${
                  isSidebarCollapsed ? "xl:w-24" : "xl:w-72"
                }`
              : headerLayout === "bottom"
              ? /* Add slide-in-from-bottom for dock feel */
                "slide-in-from-bottom-6 bottom-0 left-0 w-full h-auto min-h-[5rem] flex items-end justify-center pointer-events-none pb-4 md:pb-6 px-2"
              : headerLayout === "sticky"
              ? /* Add slide-in-from-top for sticky/standard feel */
                "slide-in-from-top-6 top-0 left-0 w-full h-16"
              : "slide-in-from-top-6 top-0 left-0 w-full h-20 px-4 py-4 md:px-8"
          }
        `}
        >
          <div
            className={`
            flex items-center justify-between transition-all duration-300 ease-in-out relative
            ${
              headerLayout === "sticky"
                ? "w-full h-16 px-4 md:px-6 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 rounded-none"
                : headerLayout === "left"
                ? /* Mobile: Standard Floating Style | Desktop: Sidebar Style */
                  `w-full max-w-[95%] mx-auto rounded-2xl h-16 md:h-20 px-4 md:px-6 border 
                   xl:max-w-none xl:mx-0 xl:rounded-none xl:h-full xl:flex-col xl:items-center xl:justify-start xl:gap-8 xl:py-6 xl:bg-gray-900/90 xl:backdrop-blur-xl xl:border-b-0 xl:border-r xl:border-white/10 xl:shadow-2xl
                   ${
                     scrolled
                       ? "bg-gray-900/70 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/20"
                       : "bg-gray-900/40 backdrop-blur-lg border-white/5"
                   }
                   ${isSidebarCollapsed ? "xl:px-2" : "xl:px-4"}`
                : headerLayout === "bottom"
                ? "pointer-events-auto w-[95%] md:w-[92%] xl:w-auto xl:min-w-fit max-w-[95vw] xl:max-w-7xl h-16 md:h-20 px-6 md:px-12 bg-gray-900/80 backdrop-blur-xl rounded-2xl md:rounded-full border border-white/10 shadow-2xl shadow-black/50 gap-6 md:gap-10 mx-auto"
                : `w-full max-w-[95%] mx-auto rounded-2xl h-16 md:h-20 px-4 md:px-6 border ${
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
                headerLayout === "left"
                  ? "flex-row xl:flex-col w-auto xl:w-full"
                  : ""
              }`}
            >
              {/* Sidebar Toggle Button - Desktop Only */}
              {headerLayout === "left" && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden xl:flex absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-900 border border-white/10 rounded-r-xl items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all z-50"
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                </button>
              )}

              {/* Editable Header Image / Logo */}
              {/* FIXED: Added flex-shrink-0 to wrapper so it doesn't vanish on small screens */}
              <div className="relative group/logo flex-shrink-0">
                <img
                  src={headerImage}
                  alt="Logo"
                  crossOrigin="anonymous" // Required for Canvas color extraction
                  onLoad={(e) => extractImageColor(e.target)} // Extract color when loaded
                  style={{
                    boxShadow: `0 0 20px ${logoGlow}`, // Apply dynamic extracted color
                  }}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-xl cursor-pointer hover:scale-110 transition-transform flex-shrink-0 object-contain bg-[#0B1120] ${
                    isUploadingHeader ? "opacity-50" : "opacity-100"
                  }`}
                  onClick={() => navigate("/")}
                />

                {/* Upload Spinner */}
                {isUploadingHeader && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2
                      size={16}
                      className="text-orange-500 animate-spin"
                    />
                  </div>
                )}

                {/* Edit Controls (Only in Edit Mode) */}
                {isOwner && isEditMode && !isUploadingHeader && (
                  <>
                    {/* Camera Overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer z-10">
                      <Camera size={14} className="text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp" // NO GIF
                        onChange={handleHeaderImageUpload}
                      />
                    </label>

                    {/* Revert Button */}
                    {headerImage !== logo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeaderImage(logo);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover/logo:opacity-100 transition-opacity z-20"
                        title="Revert to default logo"
                      >
                        <RotateCcw size={10} />
                      </button>
                    )}
                  </>
                )}

                {/* Error Message Bubble - Subtle & Beautiful */}
                {headerError && (
                  <div className="absolute top-full left-0 mt-3 z-50 w-max animate-in fade-in slide-in-from-top-1">
                    <div className="bg-[#0B1120]/90 border border-red-500/30 text-red-400 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-2">
                      <AlertCircle size={10} />
                      {headerError}
                    </div>
                    {/* Little Arrow pointing up */}
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-[#0B1120] border-t border-l border-red-500/30 transform rotate-45" />
                  </div>
                )}
              </div>

              {/* Logo Text Area with Dropdown Editor */}
              <div
                className={`relative flex flex-col justify-center transition-all duration-300 ease-in-out ${
                  headerLayout === "left" && isSidebarCollapsed
                    ? "xl:max-h-0 xl:opacity-0 xl:overflow-hidden"
                    : "opacity-100"
                }`}
              >
                {/* 1. Trigger Button (Above Name) */}
                {isOwner && isEditMode && (
                  <button
                    onClick={() => {
                      setIsNameEditorOpen(!isNameEditorOpen);
                      // Close other dropdowns
                      setIsNotifDropdownOpen(false);
                      setIsProfileDropdownOpen(false);
                      setIsLayoutMenuOpen(false);
                    }}
                    // UPDATED: Added 'hidden md:flex' so it vanishes on mobile
                    className={`hidden md:flex items-center gap-1.5 mb-1 px-2 py-0.5 rounded-md self-start text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isNameEditorOpen
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Palette size={10} />
                    <span>Customize</span>
                  </button>
                )}

                {/* 2. Display Name (Always Visible) */}
                <span className="text-base md:text-lg font-bold tracking-tight block whitespace-nowrap cursor-default">
                  {/* Render White Part */}
                  {portfolioName.substring(0, highlightIndex)}
                  {/* Render Colored Part */}
                  <span className={highlightColor}>
                    {portfolioName.substring(highlightIndex)}
                  </span>
                </span>

                {/* 3. The Dropdown Editor Tools */}
                {isOwner && isEditMode && isNameEditorOpen && (
                  <div
                    className={`absolute z-[80] p-4 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-64 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5
                    ${
                      headerLayout === "left"
                        ? "left-full top-0 ml-4" // Sidebar: Pop to right
                        : headerLayout === "bottom"
                        ? "bottom-full left-0 mb-4" // Dock: Pop upwards
                        : "top-full left-0 mt-4" // Standard: Pop downwards
                    }`}
                  >
                    {/* Header of Dropdown */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Name & Style
                      </span>
                      <X
                        size={14}
                        className="cursor-pointer text-gray-500 hover:text-white"
                        onClick={() => setIsNameEditorOpen(false)}
                      />
                    </div>

                    <div className="space-y-4">
                      {/* Input Field */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEXT
                          </label>
                          <span
                            className={`text-[10px] ${
                              portfolioName.length === 15
                                ? "text-orange-500"
                                : "text-gray-600"
                            }`}
                          >
                            {portfolioName.length}/15
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={15} // Enforce limit
                          value={portfolioName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPortfolioName(val);
                            // Auto-adjust index if length shrinks below it
                            if (val.length < highlightIndex) {
                              setHighlightIndex(val.length);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors"
                          placeholder="Portfolio Name"
                        />
                      </div>

                      {/* Color Palette */}
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold mb-2 block">
                          HIGHLIGHT COLOR
                        </label>
                        <div className="flex justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                          {[
                            {
                              id: "orange",
                              class: "text-orange-500",
                              bg: "bg-orange-500",
                            },
                            {
                              id: "amber",
                              class: "text-amber-500", // Reverted to Amber
                              bg: "bg-amber-500",
                            },
                            {
                              id: "green",
                              class: "text-emerald-400", // New: Vibrant Green
                              bg: "bg-emerald-400",
                            },
                            {
                              id: "cyan",
                              class: "text-cyan-400", // New: Electric Blue/Cyan
                              bg: "bg-cyan-400",
                            },
                            {
                              id: "blue",
                              class: "text-blue-500",
                              bg: "bg-blue-500",
                            },
                          ].map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setHighlightColor(c.class)}
                              className={`w-6 h-6 rounded-full transition-all duration-200 ${
                                c.bg
                              } ${
                                highlightColor === c.class
                                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B1120] scale-110 shadow-lg shadow-white/10"
                                  : "opacity-60 hover:opacity-100 hover:scale-110"
                              }`}
                              title={c.id}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Split Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            SPLIT POSITION
                          </label>
                          <span className="text-[10px] text-orange-500 font-mono">
                            {highlightIndex}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={portfolioName.length}
                          value={highlightIndex}
                          onChange={(e) =>
                            setHighlightIndex(Number(e.target.value))
                          }
                          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400"
                        />
                        <p className="text-[10px] text-gray-600 mt-1">
                          Adjust where the highlight color begins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. NAVIGATION (Desktop) */}
            <nav
              className={`
            hidden xl:flex items-center gap-2 transition-all duration-300 ease-in-out
            ${
              headerLayout === "left"
                ? "flex-col w-full py-2 space-y-1" // Compact vertical stack
                : "gap-6 bg-white/5 border border-white/5 shadow-inner backdrop-blur-md " +
                  (headerLayout === "bottom"
                    ? "rounded-full px-6 py-2"
                    : "rounded-full px-4 py-1.5 ml-4 mr-auto") // FIXED: Removed absolute center, added left margin & auto right
            }
          `}
            >
              <NavItem
                to={`/${routeParam}/overview`} // UPDATED: routeParam
                icon={<User size={18} />}
                label="Overview"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
                headerLayout={headerLayout}
              />
              <NavItem
                to={`/${routeParam}/projects`} // UPDATED: routeParam
                icon={<Briefcase size={18} />}
                label="Projects"
                collapsed={headerLayout === "left" && isSidebarCollapsed}
                headerLayout={headerLayout}
              />
              {isOwner && (
                <NavItem
                  to={`/${routeParam}/settings`} // UPDATED: routeParam
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
                  ? "flex-row xl:flex-col w-auto xl:w-full gap-2 xl:border-t xl:border-white/10 xl:pt-4 xl:mt-auto"
                  : "gap-2 md:gap-4 animate-in fade-in duration-700"
              }`}
            >
              {/* Mobile Menu Toggle (Visible on Mobile for ALL layouts) */}
              <div className="xl:hidden flex items-center gap-3 relative">
                {/* Mobile Profile Picture Button - HIDE IF NOT LOGGED IN OR IF SPACE IS TIGHT */}
                {currentUser && !isHeaderTight && (
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsNotifDropdownOpen(false); // FIXED: Close notification dropdown to prevent overlap
                      setIsMobileMenuOpen(false); // Close menu if open
                    }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-0.5 shadow-lg shadow-orange-500/20 ring-1 ring-black/40 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                  >
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
                  </button>
                )}

                {/* Mobile Profile Dropdown Content */}
                {currentUser && isProfileDropdownOpen && (
                  <div
                    className={`absolute right-0 w-72 max-w-[90vw] bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[70] animate-in fade-in ring-1 ring-white/5
                  ${
                    headerLayout === "bottom"
                      ? "bottom-full mb-4 slide-in-from-bottom-2 origin-bottom-right"
                      : "top-full mt-4 slide-in-from-top-2 origin-top-right"
                  }`}
                  >
                    {/* User Info Card */}
                    <div className="bg-white/5 rounded-xl p-5 mb-4 border border-white/5 flex items-center justify-between gap-4">
                      <div className="overflow-hidden flex-1 text-left">
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
                      {/* Service Icon */}
                      <div className="shrink-0 p-2.5 bg-white/5 rounded-lg border border-white/5 text-gray-300 flex items-center justify-center">
                        {currentUser?.providerData?.some(
                          (p) => p.providerId === "google.com"
                        ) ? (
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
                          <Mail size={20} />
                        )}
                      </div>
                    </div>

                    {/* Dropdown Links */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          navigate(`/${routeParam}/overview`); // UPDATED
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group"
                      >
                        <div className="p-2 rounded-lg transition-colors bg-blue-500/10 border-blue-500/10 text-blue-500">
                          <User size={18} />
                        </div>
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/${routeParam}/settings`); // UPDATED
                          setIsProfileDropdownOpen(false);
                        }}
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

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* ORDER: 1. Edit Mode (Top of Stack) */}
              {/* Edit Mode Toggle - Desktop Only */}
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

                    {/* ... inside Edit Mode Toggle Block ... */}
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

              {/* ORDER: 2. Save Button */}
              {/* NEW: Global Save Button (Desktop) */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block relative ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <button
                    onClick={handleGlobalSave}
                    disabled={isSaving}
                    className={`flex items-center transition-all duration-300 group cursor-pointer border
                      ${
                        headerLayout === "left"
                          ? `w-full rounded-xl border-transparent hover:bg-orange-500/10 hover:border-orange-500/30 ${
                              isSidebarCollapsed
                                ? "justify-center p-3 mx-auto w-12 h-12"
                                : "px-4 py-3 gap-3"
                            }`
                          : `p-2 rounded-full active:scale-95 ${
                              isSaving
                                ? saveSuccess
                                  ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                  : "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                : "bg-orange-500/10 backdrop-blur-xl border-orange-500/50 text-orange-100 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] hover:bg-orange-500/20 hover:text-white hover:border-orange-500"
                            }`
                      }
                    `}
                    title="Save Settings"
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Animated Icon Swap */}
                      <div
                        className={`transition-all duration-300 transform ${
                          isSaving
                            ? "scale-0 opacity-0 absolute"
                            : "scale-100 opacity-100"
                        }`}
                      >
                        <Save
                          size={20}
                          className={
                            headerLayout === "left" ? "text-orange-500" : ""
                          }
                        />
                      </div>
                      <div
                        className={`transition-all duration-300 transform ${
                          isSaving
                            ? "scale-100 opacity-100"
                            : "scale-0 opacity-0 absolute"
                        }`}
                      >
                        {saveSuccess ? (
                          <Check
                            size={20}
                            className={
                              headerLayout === "left" ? "text-green-500" : ""
                            }
                          />
                        ) : (
                          <AlertCircle
                            size={20}
                            className={
                              headerLayout === "left" ? "text-red-500" : ""
                            }
                          />
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
                            : "text-orange-500" // UPDATED: Changed from blue to orange
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
              {/* NEW: Public/Private Toggle (Desktop) */}
              {isOwner && isEditMode && (
                <div
                  className={`hidden xl:block relative ${
                    headerLayout === "left" ? "w-full" : ""
                  }`}
                >
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center transition-all duration-300 group cursor-pointer
                            ${
                              headerLayout === "left"
                                ? `w-full rounded-xl hover:bg-white/10 ${
                                    isSidebarCollapsed
                                      ? "justify-center p-3 mx-auto w-12 h-12"
                                      : "px-4 py-3 gap-3"
                                  } ${
                                    isPublic ? "text-green-500" : "text-red-500"
                                  }` // FIXED: Added color logic here so Icon changes color too
                                : `p-2 rounded-full border hover:rotate-12 ${
                                    isPublic
                                      ? "bg-green-500/10 border-green-500/30 text-green-500"
                                      : "bg-red-500/10 border-red-500/30 text-red-500"
                                  }`
                            }
                          `}
                    title={isPublic ? "Public Profile" : "Private Profile"}
                  >
                    {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                    {headerLayout === "left" && (
                      <span
                        className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isSidebarCollapsed
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        } ${isPublic ? "text-green-500" : "text-red-500"}`}
                      >
                        {isPublic ? "Public" : "Private"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ORDER: 4. Layouts */}
              {/* NEW: Header Layout Customizer */}
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
                      className={`absolute w-64 max-w-[calc(100vw-2rem)] bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl p-3 z-[70] animate-in fade-in ring-1 ring-white/5
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
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            id: "standard",
                            label: "Floating",
                            icon: <Minimize />,
                          },
                          {
                            id: "sticky",
                            label: "Full Top",
                            icon: <Maximize />,
                          },
                          {
                            id: "left",
                            label: "Sidebar L",
                            icon: <AlignLeft />,
                          },
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

              {/* ORDER: 5. Notifications */}
              {/* Notification Dropdown - HIDE IF NOT LOGGED IN */}
              {currentUser && (
                <div
                  /* FIXED: Added order-first to move it to the left on mobile/tab, xl:order-none restores position on desktop */
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
                      ? /* Mobile: Standard Icon | Desktop: Sidebar Item */
                        `relative p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white xl:static xl:w-full xl:rounded-xl xl:hover:bg-white/10 ${
                          isSidebarCollapsed
                            ? "xl:justify-center xl:p-3 xl:mx-auto xl:w-12 xl:h-12"
                            : "xl:px-4 xl:py-3 xl:gap-3"
                        }`
                      : /* Standard Style everywhere */
                        `relative p-2 rounded-full hover:scale-110 ${
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
                        className={`hidden xl:block text-sm font-medium text-gray-400 group-hover:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
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
                      /* UPDATED: Mobile uses fixed positioning to center on screen. Desktop (md+) reverts to absolute relative to bell. */
                      className={`w-80 max-w-[calc(100vw-2rem)] bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in ring-1 ring-white/5
                 
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
              )}

              {/* ORDER: 6. Profile (Bottom of Stack) */}
              {/* User Profile Dropdown - HIDE IF NOT LOGGED IN */}
              {currentUser && (
                <div
                  className={`relative hidden xl:block ${
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

                  {/* Profile Dropdown Content */}
                  {isProfileDropdownOpen && (
                    <div
                      className={`absolute w-72 max-w-[calc(100vw-2rem)] bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in ring-1 ring-white/5
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
                        {/* Service Icon */}
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

                      {/* Dropdown Links */}
                      <div className="space-y-1">
                        <button
                          onClick={() => navigate(`/${routeParam}/overview`)} // UPDATED
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group"
                        >
                          <div className="p-2 rounded-lg transition-colors bg-blue-500/10 border-blue-500/10 text-blue-500">
                            <User size={18} />
                          </div>
                          Profile
                        </button>
                        <button
                          onClick={() => navigate(`/${routeParam}/settings`)} // UPDATED
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
              )}
            </div>
          </div>
        </header>
      )}

      {/* --- MOBILE MENU (UPDATED: Fixed Right Side, Full Height, Compact) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-64 bg-[#0B1120] border-l border-white/10 shadow-2xl duration-300 flex flex-col overflow-hidden animate-in slide-in-from-right">
            {/* 1. FIXED HEADER ROW: Menu Text & Close Button */}
            <div className="flex justify-between items-center p-4 border-b border-white/5 shrink-0">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 2. SCROLLABLE CONTENT AREA (User Details + Links + Settings) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 custom-scrollbar">
              {/* User Details Card (Compact) */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3 mb-3">
                <div className="overflow-hidden flex-1">
                  <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                    Signed in as
                  </p>
                  <p
                    className="text-xs font-bold text-white truncate"
                    title={currentUser?.email}
                  >
                    {currentUser?.providerData?.some(
                      (p) => p.providerId === "twitter.com"
                    )
                      ? currentUser?.displayName
                      : currentUser?.email}
                  </p>
                </div>
                {/* Service Icon */}
                <div className="shrink-0 p-1.5 bg-white/5 rounded-lg border border-white/5 text-gray-300 flex items-center justify-center">
                  {currentUser?.providerData?.some(
                    (p) => p.providerId === "google.com"
                  ) ? (
                    <svg
                      width="14"
                      height="14"
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
                    <Github size={14} />
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
                    <Mail size={14} />
                  )}
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                <MobileNavItem
                  to={`/${routeParam}/overview`}
                  icon={<User size={16} />}
                  label="Overview"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <MobileNavItem
                  to={`/${routeParam}/projects`}
                  icon={<Briefcase size={16} />}
                  label="Projects"
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Settings & Edit Mode - Owner Only */}
                {isOwner && (
                  <>
                    <MobileNavItem
                      to={`/${routeParam}/settings`}
                      icon={<Settings size={16} />}
                      label="Settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* --- MOBILE EDIT MODE TOGGLE --- */}
                    <div
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="flex items-center justify-between px-3 py-2 mt-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer active:scale-95 transition-all"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-400 text-xs">Mode</span>
                        <span
                          className={`text-[10px] font-black tracking-[0.15em] uppercase ${
                            isEditMode ? "text-orange-500" : "text-gray-500"
                          }`}
                        >
                          {isEditMode ? "EDITING" : "VIEWING"}
                        </span>
                      </div>

                      <div
                        className={`relative w-9 h-5 rounded-full transition-colors duration-500 ease-out border border-white/5 ${
                          isEditMode
                            ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                            : "bg-slate-800 ring-1 ring-white/5"
                        }`}
                      >
                        <div
                          className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transform transition-transform duration-500 ${
                            isEditMode ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Show Edit Options Only in Edit Mode */}
                    {isEditMode && (
                      <>
                        {/* --- MOBILE NAME & COLOR EDITOR --- */}
                        <div className="mt-2 rounded-lg bg-white/5 border border-white/5 overflow-hidden transition-all duration-300">
                          <button
                            onClick={() =>
                              setIsMobileNameEditorOpen(!isMobileNameEditorOpen)
                            }
                            className="w-full flex items-center justify-between px-3 py-2 text-left active:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1 rounded-md transition-colors ${
                                  isMobileNameEditorOpen
                                    ? "bg-orange-500 text-white"
                                    : "bg-orange-500/20 text-orange-500"
                                }`}
                              >
                                <Palette size={14} />
                              </div>
                              <span
                                className={`text-xs font-medium ${
                                  isMobileNameEditorOpen
                                    ? "text-white"
                                    : "text-gray-200"
                                }`}
                              >
                                Customize Name
                              </span>
                            </div>
                            <ChevronDown
                              size={14}
                              className={`text-gray-500 transition-transform duration-300 ${
                                isMobileNameEditorOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <div
                            className={`px-3 space-y-3 transition-all duration-300 ease-in-out ${
                              isMobileNameEditorOpen
                                ? "max-h-[500px] opacity-100 pb-3 pt-1"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-1 shadow-inner">
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                                Preview
                              </span>
                              <span className="text-sm font-bold tracking-tight text-white break-all">
                                {portfolioName.substring(0, highlightIndex)}
                                <span className={highlightColor}>
                                  {portfolioName.substring(highlightIndex)}
                                </span>
                              </span>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] text-gray-500 font-bold">
                                  TEXT
                                </label>
                                <span
                                  className={`text-[9px] ${
                                    portfolioName.length === 15
                                      ? "text-orange-500"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {portfolioName.length}/15
                                </span>
                              </div>
                              <input
                                type="text"
                                maxLength={15}
                                value={portfolioName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPortfolioName(val);
                                  if (val.length < highlightIndex) {
                                    setHighlightIndex(val.length);
                                  }
                                }}
                                className="w-full bg-[#0B1120] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                placeholder="Name"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-gray-500 font-bold mb-2 block">
                                HIGHLIGHT COLOR
                              </label>
                              <div className="flex justify-between bg-[#0B1120] p-1.5 rounded-lg border border-white/5">
                                {[
                                  {
                                    id: "orange",
                                    class: "text-orange-500",
                                    bg: "bg-orange-500",
                                  },
                                  {
                                    id: "amber",
                                    class: "text-amber-500",
                                    bg: "bg-amber-500",
                                  },
                                  {
                                    id: "green",
                                    class: "text-emerald-400",
                                    bg: "bg-emerald-400",
                                  },
                                  {
                                    id: "cyan",
                                    class: "text-cyan-400",
                                    bg: "bg-cyan-400",
                                  },
                                  {
                                    id: "blue",
                                    class: "text-blue-500",
                                    bg: "bg-blue-500",
                                  },
                                ].map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => setHighlightColor(c.class)}
                                    className={`w-6 h-6 rounded-full transition-all duration-200 ${
                                      c.bg
                                    } ${
                                      highlightColor === c.class
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B1120] scale-110 shadow-lg shadow-white/10"
                                        : "opacity-60 hover:opacity-100"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] text-gray-500 font-bold">
                                  SPLIT POSITION
                                </label>
                                <span className="text-[9px] text-orange-500 font-mono">
                                  {highlightIndex}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={portfolioName.length}
                                value={highlightIndex}
                                onChange={(e) =>
                                  setHighlightIndex(Number(e.target.value))
                                }
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mobile Public/Private Toggle */}
                        <div
                          onClick={() => setIsPublic(!isPublic)}
                          className="flex items-center justify-between px-3 py-2 mt-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer active:scale-95 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded-md ${
                                isPublic
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {isPublic ? (
                                <Globe size={14} />
                              ) : (
                                <Lock size={14} />
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                isPublic ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {isPublic ? "Public Profile" : "Private Profile"}
                            </span>
                          </div>
                          <div
                            className={`relative w-9 h-5 rounded-full transition-colors duration-500 ease-out border border-white/5 ${
                              isPublic
                                ? "bg-green-500/20 ring-1 ring-green-500/50"
                                : "bg-red-500/20 ring-1 ring-red-500/50"
                            }`}
                          >
                            <div
                              className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transform transition-transform duration-500 ${
                                isPublic ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Mobile Header Layout */}
                        <div className="p-3 mt-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                            Header Style
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              {
                                id: "standard",
                                icon: <Minimize size={14} />,
                              },
                              { id: "sticky", icon: <Maximize size={14} /> },
                              {
                                id: "bottom",
                                icon: <PanelBottom size={14} />,
                              },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setHeaderLayout(opt.id)}
                                className={`flex items-center justify-center p-1.5 rounded-md border transition-all ${
                                  headerLayout === opt.id ||
                                  (headerLayout === "left" &&
                                    opt.id === "standard")
                                    ? "bg-orange-500/20 border-orange-500 text-orange-500"
                                    : "bg-white/5 border-transparent text-gray-400"
                                }`}
                              >
                                {opt.icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile Save Button (MOVED HERE) */}
                        <button
                          onClick={handleGlobalSave} // UPDATED: Removed the setTimeout/close logic
                          disabled={isSaving}
                          className={`w-full flex items-center justify-center gap-2 mt-2 px-3 py-2.5 rounded-lg text-xs font-bold border backdrop-blur-md active:scale-95 transition-all duration-300 ${
                            isSaving
                              ? saveSuccess
                                ? "bg-green-900/30 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                                : "bg-red-900/30 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                              : "bg-orange-500/10 border-orange-500/50 text-orange-100 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)] hover:bg-orange-500/20 hover:border-orange-500 hover:text-white"
                          }`}
                        >
                          {isSaving ? (
                            saveSuccess ? (
                              <Check size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )
                          ) : (
                            <Save size={14} />
                          )}
                          {isSaving
                            ? saveSuccess
                              ? "Saved Successfully!"
                              : "No Changes detected"
                            : "Save Changes"}
                        </button>
                      </>
                    )}
                    {/* Spacer inside scrollable area */}
                    <div className="h-px bg-white/5 my-1"></div>
                  </>
                )}
              </nav>
            </div>

            {/* 3. FIXED FOOTER: Sign Out Button */}
            <div className="shrink-0 p-3 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 w-full text-left"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Sign Out</span>
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
                // FIXED: Removed pl-0 so mobile keeps symmetric padding (px-4). Desktop overrides with xl:pl-[...]
                isSidebarCollapsed ? "xl:pl-[8rem]" : "xl:pl-[20rem]"
              }` // Mobile: pt-28, Desktop: Sidebar (6rem/18rem) + Gap (2rem)
            : headerLayout === "bottom"
            ? "pt-8 pb-32"
            : "pt-28" // standard
        } px-3 md:px-8 pb-10`}
      >
        {/* UPDATED: Dynamic Slide Direction based on Header Layout */}
        <div
          key={headerLayout} // Forces re-animation when layout changes
          className={`w-full md:max-w-[90%] mx-auto relative z-10 animate-in fade-in duration-700 ${
            headerLayout === "left"
              ? "slide-in-from-right-8" // Loads from Right to Left for Sidebar
              : "slide-in-from-bottom-8" // Default Loads from Bottom Up
          }`}
        >
          {!isLoadingSettings && (
            <div className="mb-6 flex items-center justify-between">
              {/* Left: Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-400">
                  {breadcrumbName}
                </span>
                <ChevronDown size={12} className="-rotate-90" />
                <span className="text-white font-medium capitalize">
                  {location.pathname.split("/").pop()}
                </span>
              </div>

              {/* Right: Quick Tips Dropdown */}
              <div className="relative" ref={tipsRef}>
                <button
                  onClick={() => setShowPageTips(!showPageTips)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
                    showPageTips
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <Info size={14} />
                  <span className="hidden sm:inline">Tips</span>
                </button>

                {showPageTips && (
                  // FIXED: z-[100] to sit above Home overlays
                  <div className="absolute right-0 top-full mt-3 w-72 p-5 bg-[#0F1623] border border-white/10 rounded-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] z-[100] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                    <h4 className="text-xs font-bold text-white uppercase mb-4 tracking-wider flex items-center gap-2">
                      <Info size={14} className="text-orange-500" />
                      Interface Guide
                    </h4>

                    <div className="space-y-4">
                      {/* Section 1: Header - ONLY FOR OWNER */}
                      {isOwner && (
                        <div className="relative pl-3 border-l-2 border-white/10">
                          <h5 className="text-xs font-bold text-gray-300 mb-1">
                            Edit Mode
                          </h5>
                          {/* Desktop Text (xl and up) */}
                          <p className="hidden xl:block text-[11px] text-gray-500 leading-relaxed">
                            Enable <b>Edit Mode</b> to access Developer Tools:
                            edit your portfolio, manage layout, and add details.
                          </p>
                          {/* Mobile/Tablet Text (below xl) */}
                          <p className="block xl:hidden text-[11px] text-gray-500 leading-relaxed">
                            <b>Edit Mode</b> and other settings can be found in
                            the main <b>Menu</b> options.
                          </p>
                        </div>
                      )}

                      {/* Section 2: Overview - DYNAMIC CONTENT */}
                      <div className="relative pl-3 border-l-2 border-white/10">
                        <h5 className="text-xs font-bold text-gray-300 mb-1">
                          Overview
                        </h5>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {isOwner
                            ? 'View real-time visitor stats. Your "Tech Stack" is automatically generated from the tags used in your Projects.'
                            : "View professional summary, activity statistics, and technical expertise."}
                        </p>
                      </div>

                      {/* Section 3: Projects - CONDITIONAL CONTENT */}
                      <div className="relative pl-3 border-l-2 border-white/10">
                        <h5 className="text-xs font-bold text-gray-300 mb-1">
                          Projects
                        </h5>
                        <ul className="text-[11px] text-gray-500 leading-relaxed list-disc pl-3 space-y-1">
                          <li>
                            Search also filters by <b>Tags</b>.
                          </li>
                          <li>
                            Click card to view <b>Media & Details</b>.
                          </li>
                          {/* Only show Edit/Delete/Hide tip to Owner */}
                          {isOwner && (
                            <>
                              <li>
                                Use the <b>Eye icon</b> to Hide projects from
                                visitors.
                              </li>
                              <li>
                                <b>Hover</b> over image to Edit/Delete in
                                desktops.
                              </li>
                            </>
                          )}
                          <li>
                            {currentUser
                              ? "Interact with Likes & Comments."
                              : "Login to Like & Comment."}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Passing context + Header Customization props */}
          {!isLoadingSettings && resolvedUid && (
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
                targetUid: resolvedUid, // UPDATED: Pass the real UID to children
              }}
            />
          )}
        </div>
      </main>

      {/* NEW: Onboarding Modal (Global Level) */}
      {showOnboarding &&
        isOwner &&
        createPortal(
          <OnboardingModal
            user={currentUser}
            onComplete={() => {
              setShowOnboarding(false);
              // Optionally trigger a re-fetch of settings here if needed
            }}
          />,
          document.body
        )}
    </div>
  );
};

// Sub-components
const NavItem = ({ to, icon, label, collapsed, headerLayout }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center transition-all duration-200 ease-in-out
       ${
         headerLayout === "left"
           ? // Sidebar Styles
             `w-full rounded-xl ${
               collapsed
                 ? "justify-center p-3 mx-auto w-12 h-12"
                 : "px-4 py-3 gap-3"
             } ${
               isActive
                 ? "bg-white/10 backdrop-blur-md border border-orange-500/30 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]"
                 : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
             }`
           : // Standard Styles
             `px-4 py-2.5 gap-2 rounded-full hover:scale-110 active:scale-95 ${
               isActive
                 ? "bg-white/10 backdrop-blur-md border border-orange-500/30 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]"
                 : "text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
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
      `flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border
       ${
         isActive
           ? "bg-white/10 backdrop-blur-md border-orange-500/30 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]"
           : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
       }`
    }
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

export default LiquidGlassPortfolioLayout;

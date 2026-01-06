//C:\PortfoliMe\portfoli_me\src\templates\liquid_glass\LiquidGlassUserHome.jsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Added for Portal
import {
  useOutletContext,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"; // --- NEW IMPORTS START ---
import { collection, getDocs, onSnapshot, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
// --- NEW IMPORTS END ---
import {
  MapPin,
  Mail,
  Briefcase,
  Globe,
  Camera,
  TrendingUp,
  Users,
  Award,
  Zap,
  ArrowUpRight,
  Plus,
  X,
  Github,
  Linkedin,
  Twitter,
  Cpu,
  Save,
  Activity,
  Loader2,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Share2,
  GitCommit,
  MessageSquare,
  Inbox,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchUserProfile,
  updateUserProfile,
  updateUserStatus,
} from "../../services/profileOverviewService";
import { getUserProjects } from "../../services/projectService";
import { fetchUserRepositories } from "../../services/githubService";
import { uploadFileToCloudinary } from "../../services/cloudinaryService";
import UserSkillsModal from "../../modals/UserSkillsModal";
import OnboardingModal from "../../modals/OnboardingModal"; // Added Import

// --- NEW: Import the default avatar image ---
import defaultAvatar from "../../assets/default_avatar2.png";

// --- HELPER COMPONENTS ---
const ToastNotification = ({ type, message, onClose }) => (
  <div className="fixed top-32 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-xl ${
        type === "success"
          ? "bg-[#0B1120]/90 border-green-500/20"
          : "bg-[#0B1120]/90 border-red-500/20"
      }`}
    >
      <div
        className={`p-2 rounded-full ${
          type === "success"
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        }`}
      >
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-sm text-white">
          {type === "success" ? "Success" : "Error"}
        </span>
        <span className="text-xs text-gray-400">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

const UserIconMock = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const WEEKLY_STATS = [
  { day: "Mon", value: 24 },
  { day: "Tue", value: 45 },
  { day: "Wed", value: 32 },
  { day: "Thu", value: 68 },
  { day: "Fri", value: 50 },
  { day: "Sat", value: 85 },
  { day: "Sun", value: 60 },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    type: "project",
    text: 'Deployed "PortfoliMe" to production',
    time: "2 hours ago",
    icon: <Zap size={16} />,
  },
  {
    id: 2,
    type: "achievement",
    text: 'Reached 1k views on "Finix" App',
    time: "5 hours ago",
    icon: <TrendingUp size={16} />,
  },
  {
    id: 3,
    type: "update",
    text: "Updated profile bio and skills",
    time: "1 day ago",
    icon: <UserIconMock />,
  },
  {
    id: 4,
    type: "security",
    text: "Password changed successfully",
    time: "2 days ago",
    icon: <Save size={16} />,
  },
];

// --- MAIN COMPONENT ---
export default function LiquidGlassUserHome() {
  // UPDATED: Destructure setIsEditMode
  const { isEditMode, setIsEditMode } = useOutletContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams(); // Get UID from URL

  // Determine Target UID (URL param takes precedence)
  const targetUid = username || currentUser?.uid;
  const isOwner = currentUser?.uid === targetUid;

  // Force edit mode off if not owner
  const effectiveEditMode = isOwner && isEditMode;

  // NEW: Handler for the Add Project logic
  const handleAddProjectRedirect = () => {
    console.log("🔘 [DEBUG] 'Add Project' button clicked in Overview.");

    // 1. Toggle Edit Mode
    if (setIsEditMode) {
      console.log("🔄 [DEBUG] Toggling Edit Mode: ON");
      setIsEditMode(true);
    } else {
      console.warn("⚠️ [DEBUG] setIsEditMode not found in context!");
    }

    // 2. Navigate with State for Highlight
    console.log(
      "➡️ [DEBUG] Navigating to Projects page with highlight trigger..."
    );
    navigate(`../projects`, {
      state: { highlightAddButton: true },
    });
  };

  // -- State Management --
  const [loading, setLoading] = useState(true);
  // Renamed to distinguish viewer's internet vs profile's status
  const [viewerIsOnline, setViewerIsOnline] = useState(navigator.onLine);
  // NEW: Tracks the profile owner's database status
  const [profileIsOnline, setProfileIsOnline] = useState(false);
  const [uploading, setUploading] = useState({ avatar: false, cover: false });

  // NEW: Force Onboarding if setup not complete
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initial state uses defaultAvatar to prevent empty src errors
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    bio: "",
    location: "",
    email: "",
    website: "",
    githubUsername: "",
    githubToken: "",
    avatar: defaultAvatar,
    cover: "",
    setupComplete: true, // Default to true to prevent flash, checked in fetch
  });

  // NEW: Track original profile data for unsaved changes detection
  const [initialProfile, setInitialProfile] = useState(null);

  // NEW: Warn user about unsaved changes on page reload/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if profile matches initialProfile
      // We only check if initialProfile exists to avoid false positives during loading
      if (
        initialProfile &&
        JSON.stringify(profile) !== JSON.stringify(initialProfile)
      ) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [profile, initialProfile]);

  // Replaced manual skills state with project-derived state
  const [projects, setProjects] = useState([]);
  const [derivedSkills, setDerivedSkills] = useState([]);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // State for Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    projectsCount: 0,
    appreciationCount: 0,
    commitsCount: 0,
    commentsCount: 0,
    viewsCount: 0, // <--- ADDED THIS
  });

  // Fetch Projects to derive skills and stats
  useEffect(() => {
    if (targetUid) {
      const loadProjects = async () => {
        console.log("🚀 [DEBUG] Starting Project Load for UID:", targetUid);

        try {
          const data = await getUserProjects(targetUid); // Use targetUid
          console.log(`📂 [DEBUG] Projects fetched: ${data.length}`, data);
          console.log(`📂 [DEBUG] Projects fetched: ${data.length}`, data);

          setProjects(data);

          // Flatten all tags from projects into a unique list
          const allTags = data.flatMap((p) => p.tags || []);
          const uniqueSkills = [...new Set(allTags)];
          setDerivedSkills(uniqueSkills);

          // --- CALCULATE APPRECIATION (LIKES) ---
          const totalLikes = data.reduce(
            (acc, curr) => acc + (curr.appreciation || 0),
            0
          );
          console.log(
            "❤️ [DEBUG] Total Appreciation (Likes) Calculated:",
            totalLikes
          );

          // --- CALCULATE COMMENTS (New Logic) ---
          let totalComments = 0;
          console.log("💬 [DEBUG] Starting to count comments...");

          const commentCountsPromises = data.map(async (project) => {
            try {
              // Use targetUid here too
              const commentsRef = collection(
                db,
                "users",
                targetUid,
                "projects",
                project.id,
                "comments"
              );
              const snapshot = await getDocs(commentsRef);

              console.log(
                `   -- Project [${project.title}] (ID: ${project.id}) has ${snapshot.size} comments.`
              );
              return snapshot.size;
            } catch (err) {
              console.error(
                `   ❌ [DEBUG] Error fetching comments for project ${project.id}:`,
                err
              );
              return 0;
            }
          });

          // Wait for all comment fetches to finish
          const commentCountsArray = await Promise.all(commentCountsPromises);
          totalComments = commentCountsArray.reduce(
            (acc, curr) => acc + curr,
            0
          );

          console.log("✅ [DEBUG] Final Total Comments Count:", totalComments);

          // Update State
          setDashboardStats((prev) => ({
            ...prev,
            projectsCount: data.length,
            appreciationCount: totalLikes,
            commentsCount: totalComments, // NOW UPDATED DYNAMICALLY
          }));
        } catch (error) {
          console.error(
            "🔥 [DEBUG] CRITICAL ERROR fetching projects/stats:",
            error
          );
        }
      };
      loadProjects();
    }
  }, [targetUid]); // Depend on targetUid

  // Fetch GitHub Stats
  useEffect(() => {
    // 1. BLOCKER: Wait for profile loading to finish before fetching
    if (loading) return;

    // Get username AND token from the profile state
    // FIX: Removed hardcoded username. Only fetch if dynamic username exists.
    const username = profile.githubUsername;
    const userToken = profile.githubToken;

    if (username) {
      const loadGithubStats = async () => {
        try {
          // PASS TOKEN TO SERVICE
          const repos = await fetchUserRepositories(username, userToken);

          const commitCounts = await Promise.all(
            repos.map(async (repo) => {
              try {
                // ADD HEADERS MANUALLY HERE FOR FETCH
                const headers = userToken
                  ? { Authorization: `token ${userToken}` }
                  : {};

                const statsRes = await fetch(
                  `https://api.github.com/repos/${repo.name}/stats/contributors`,
                  { headers }
                );

                if (statsRes.ok && statsRes.status !== 202) {
                  const statsData = await statsRes.json();
                  if (Array.isArray(statsData)) {
                    const userStat = statsData.find(
                      (s) =>
                        s.author?.login?.toLowerCase() ===
                        username.toLowerCase()
                    );
                    return userStat ? userStat.total : 0;
                  }
                }

                // Fallback
                const res = await fetch(
                  `https://api.github.com/repos/${repo.name}/commits?author=${username}&per_page=1`,
                  { headers }
                );

                if (!res.ok) return 0;
                const link = res.headers.get("link");
                if (link) {
                  const match = link.match(/&page=(\d+)>; rel="last"/);
                  if (match) return parseInt(match[1], 10);
                }
                const data = await res.json();
                return Array.isArray(data) ? data.length : 0;
              } catch (err) {
                return 0;
              }
            })
          );

          const totalCommits = commitCounts.reduce(
            (acc, count) => acc + count,
            0
          );
          setDashboardStats((prev) => ({
            ...prev,
            commitsCount: totalCommits,
            reposCount: repos.length, // --- NEW: Store Repo Count ---
          }));
        } catch (e) {
          console.error("Github fetch error", e);
        }
      };
      loadGithubStats();
    }
    // Added 'loading' to dependency array so it runs again once loading finishes
  }, [profile.githubUsername, profile.githubToken, loading]);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // -- Effects --

  // 1. Fetch Data & Handle Real-time Presence AND Views
  useEffect(() => {
    if (targetUid) {
      loadUserDataWithRetry();

      // NEW: Real-time listener for Profile Online Status & Views
      const unsub = onSnapshot(doc(db, "users", targetUid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // 1. Update Online Status
          setProfileIsOnline(data.isOnline === true);

          // 2. Update Total Views Live
          setDashboardStats((prev) => ({
            ...prev,
            viewsCount: data.totalViews || 0,
          }));
        }
      });

      return () => unsub();
    }
  }, [targetUid]);

  // 2. Listen to browser offline/online events (Viewer's Connection)
  useEffect(() => {
    const handleStatusChange = () => {
      const status = navigator.onLine;
      setViewerIsOnline(status);
    };
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, [targetUid]); // Depend on targetUid

  // WRAPPER: Handles the retry logic
  const loadUserDataWithRetry = async () => {
    if (!targetUid) return; // Use targetUid

    setLoading(true);
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let lastFetchedData = null; // Store data to use as fallback

    while (attempts < maxAttempts && !success) {
      attempts++;
      console.log(
        `📥 [Attempt ${attempts}/${maxAttempts}] Fetching Profile for UID: ${targetUid}...`
      );

      try {
        const data = await fetchUserProfile(targetUid); // Use targetUid
        lastFetchedData = data; // Save for fallback

        // DEBUG LOGGING
        console.log(`🧐 [Attempt ${attempts}] Data received from DB:`, data);

        // CHECK: Is this a "Valid" profile?
        // FIX: We accept data if it has email OR displayName OR role OR photoURL.
        // This prevents infinite retries for Twitter users who have no email.
        const isValidProfile =
          data &&
          (data.email || data.displayName || data.role || data.photoURL);

        if (isValidProfile) {
          console.log("✅ [Success] Valid Profile Found:", data);
          applyProfileData(data);
          success = true;
        } else {
          console.warn(
            "⚠️ [Partial Data Detected] Data missing key fields. Retrying in 800ms...",
            data
          );
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error("🔥 Error fetching profile:", error);
        break;
      }
    }

    // If we ran out of attempts, force load whatever data we found last
    if (!success) {
      console.error("❌ [Failed] Max retries reached.");
      if (lastFetchedData) {
        console.log(
          "⚠️ Applying last fetched data anyway (Fallback):",
          lastFetchedData
        );
        applyProfileData(lastFetchedData);
      } else {
        console.log("⚠️ No data found at all. Keeping default state.");
      }
    }

    updateUserStatus(currentUser.uid, true);
    setLoading(false);
  };

  const applyProfileData = (data) => {
    console.group("🔍 [DEBUG] applyProfileData Execution");

    // CHECK: If setup is false and I am the owner, trigger the modal
    if (isOwner && data.setupComplete === false) {
      console.warn("⚠️ Setup not complete. Triggering onboarding.");
      setShowOnboarding(true);
    }

    const resolvedAvatar =
      data?.photoURL || data?.avatar || currentUser?.photoURL || defaultAvatar;

    const newProfileData = {
      name:
        data?.displayName || data?.name || currentUser?.displayName || "User",
      role: data?.role || "",
      bio: data?.bio || "",
      location: data?.location || "",
      email: data?.email || currentUser?.email || "",
      website: data?.website || "",
      githubUsername: data?.githubUsername || "",
      githubToken: data?.githubToken || "",
      avatar: resolvedAvatar,
      cover:
        data?.coverImage ||
        data?.cover ||
        "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2000",
      setupComplete: data?.setupComplete || false,
    };

    // Set both profile and initialProfile to the fetched data
    setProfile((prev) => {
      const updated = { ...prev, ...newProfileData };
      setInitialProfile(updated); // Sync initial state
      return updated;
    });
  };

  // -- Handlers --

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));
      const uploadedData = await uploadFileToCloudinary(file);

      // Update local state only. The URL will be saved to Firestore when 'handleSaveProfile' is called.
      const url = uploadedData.url;
      setProfile((prev) => ({ ...prev, [type]: url }));
    } catch (error) {
      alert(`Failed to upload ${type}`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    try {
      await updateUserProfile(currentUser.uid, profile);
      setInitialProfile(profile); // Update the baseline to the current saved state
      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      setNotification({
        type: "error",
        message: "Failed to save profile. Please try again.",
      });
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Custom Notification Toast */}
      {notification && (
        <ToastNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 1. Welcome Section */}
      <WelcomeHeader
        profile={profile}
        currentUser={currentUser}
        isOnline={profileIsOnline}
        isEditMode={effectiveEditMode}
        onSave={handleSaveProfile}
        isOwner={isOwner} // Added prop
        viewsCount={dashboardStats.viewsCount} // Added prop
      />

      {/* 2. Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (Identity) */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Identity Card */}
          <IdentityCard
            profile={profile}
            isOnline={profileIsOnline} // Pass the real DB status
            isEditMode={effectiveEditMode}
            onChange={handleProfileChange}
            onImageUpload={handleImageUpload}
            uploading={uploading}
          />

          {/* B. Metrics & Skills Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <StatsWidget stats={dashboardStats} />
            </div>
            <div className="md:col-span-2">
              <SkillsWidget
                skills={derivedSkills}
                isLoggedIn={isOwner} // Only show add buttons if Owner
                onSeeMore={() => setShowSkillsModal(true)}
                onAddProject={handleAddProjectRedirect}
              />
            </div>
          </div>

          {/* Skills Modal */}
          <UserSkillsModal
            isOpen={showSkillsModal}
            onClose={() => setShowSkillsModal(false)}
            projects={projects}
          />
        </div>

        {/* RIGHT COLUMN (Analytics & Activity) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* C. Analytics Chart */}
          <AnalyticsCard />

          {/* D. Activity Feed */}
          <ActivityFeed />

          {/* E. Quick Actions */}
          {effectiveEditMode && <QuickActions />}
        </div>
      </div>

      {/* Onboarding Logic for Reloads - Portal used to break out of layout stacking contexts */}
      {showOnboarding &&
        isOwner &&
        createPortal(
          <OnboardingModal
            user={currentUser}
            onComplete={() => {
              setShowOnboarding(false);
              loadUserDataWithRetry(); // Reload data after completion
            }}
          />,
          document.body
        )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Welcome Header
// ============================================================================
const WelcomeHeader = ({
  profile,
  currentUser,
  isOnline,
  isEditMode,
  onSave,
  isOwner, // Added prop
  viewsCount, // Added prop
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Logic for name: Owner gets name, Guest gets "Guest"
  const displayName = isOwner
    ? profile.name
      ? profile.name.split(" ")[0]
      : currentUser?.displayName || "User"
    : "Guest";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
      <div>
        {/* Status Indicator */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isOnline ? "text-green-500" : "text-red-500"
          }`}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-xs font-bold tracking-wider uppercase">
            {isOnline ? "User Online" : "User Offline"}
          </span>
        </div>

        {/* Dynamic Greeting */}
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {getGreeting()},{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            {displayName}
          </span>
          .
        </h1>
        {/* Only show stats text if owner */}
        {isOwner && (
          <p className="text-gray-400 mt-2 max-w-xl">
            Here is what's happening with your portfolio today. You have{" "}
            <span className="text-white font-semibold">
              {viewsCount} visitor/s
            </span>{" "}
            recorded.
          </p>
        )}
      </div>

      {isEditMode && (
        <div className="flex items-center gap-3 flex-nowrap">
          <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-lg flex items-center gap-3 animate-pulse whitespace-nowrap">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-orange-500 text-sm font-semibold">
              Editing Enabled
            </span>
          </div>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-orange-900/20 whitespace-nowrap"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: IdentityCard
// ============================================================================
const IdentityCard = ({
  profile,
  isOnline, // NEW PROP
  isEditMode,
  onChange,
  onImageUpload,
  uploading,
}) => {
  // --- DEBUG LOGIC START ---
  const rawAvatar = profile.avatar;
  const isTwitter = rawAvatar?.includes("twimg.com");

  // Calculate the source we are about to use
  let finalSrc = rawAvatar;
  if (isTwitter) {
    finalSrc = rawAvatar.replace("_normal", "_400x400");
  } else if (!rawAvatar) {
    finalSrc = defaultAvatar;
  }

  console.log(`🖼️ [DEBUG] IdentityCard Render:`, {
    isInState: rawAvatar,
    isTwitterDetected: isTwitter,
    finalSrcCalculated: finalSrc,
  });
  // --- DEBUG LOGIC END ---

  return (
    <div className="relative group bg-[#0B1120] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Cover Image */}
      <div className="h-48 w-full relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B1120] z-10" />
        <img
          src={profile.cover}
          alt="Cover"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            uploading.cover ? "opacity-50" : "opacity-100"
          }`}
        />
        {uploading.cover && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-orange-500" size={24} />
          </div>
        )}

        {/* Banner Upload Button - Only visible in Edit Mode */}
        {isEditMode && (
          <label className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-orange-600 transition-colors border border-white/10 cursor-pointer">
            <Camera size={18} />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => onImageUpload(e, "cover")}
            />
          </label>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative z-20 px-8 pb-8 -mt-16 flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl border-4 border-[#0B1120] overflow-hidden shadow-2xl bg-[#020617] group/avatar relative">
            <img
              src={finalSrc}
              alt="Avatar"
              // CRITICAL: Tells browser not to send Referer header (fixes Twitter 403)
              referrerPolicy="no-referrer"
              onLoad={() =>
                console.log("✅ [DEBUG] Image LOADED successfully:", finalSrc)
              }
              onError={(e) => {
                console.error(
                  "❌ [DEBUG] Image ERROR triggered for:",
                  finalSrc
                );
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
              className={`w-full h-full object-cover ${
                uploading.avatar ? "opacity-50" : ""
              }`}
            />
            {uploading.avatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="animate-spin text-orange-500" size={24} />
              </div>
            )}

            {/* Avatar Upload Overlay - Only visible in Edit Mode */}
            {isEditMode && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => onImageUpload(e, "avatar")}
                />
              </label>
            )}
          </div>

          {/* Status Dot - Dynamic Color based on isOnline prop */}
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#0B1120] rounded-full flex items-center justify-center">
            <div
              style={{ animationDuration: "3s" }} // FIXED: Slows down the pulse speed
              className={`w-3 h-3 rounded-full transition-colors duration-500 animate-pulse ${
                isOnline
                  ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                  : "bg-red-500 shadow-[0_0_5px_#ef4444]" // FIXED: Red now pulses too
              }`}
            />
          </div>
        </div>

        {/* Info Fields */}
        <div className="flex-1 w-full pt-14 md:pt-16 space-y-4">
          {/* Top Row: Name & Role */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1 flex-1">
              {/* Name Display */}
              <h2 className="text-3xl font-bold text-white">{profile.name}</h2>

              {/* Role Display */}
              {isEditMode ? (
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  placeholder="Add Role (e.g. Full Stack Engineer)"
                  className="text-orange-500 font-medium bg-white/5 border border-white/10 rounded px-2 py-0.5 w-full md:w-1/2 focus:border-orange-500 focus:outline-none placeholder:text-orange-500/30"
                />
              ) : (
                // Only show if role exists
                profile.role && (
                  <p className="text-orange-500 font-medium flex items-center gap-2">
                    <Briefcase size={16} /> {profile.role}
                  </p>
                )
              )}
            </div>

            {/* Social Links (Static) */}
            <div className="relative flex items-center gap-3">
              {/* OVERLAY: COMING SOON */}
              <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-lg">
                <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>

              <SocialIcon icon={<Github size={20} />} />
              <SocialIcon icon={<Linkedin size={20} />} />
              <SocialIcon icon={<Twitter size={20} />} />
            </div>
          </div>

          {/* Bio */}
          <div>
            {isEditMode ? (
              <textarea
                value={profile.bio}
                onChange={(e) => onChange("bio", e.target.value)}
                rows={3}
                placeholder="Write a short bio about yourself..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-300 focus:border-orange-500 focus:outline-none resize-none placeholder:text-gray-600"
              />
            ) : (
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
            <InfoItem
              icon={<MapPin size={16} />}
              text={profile.location}
              isEditMode={isEditMode}
              onChange={(val) => onChange("location", val)}
              placeholder="Location"
            />
            {/* Updated: Enabled edit mode and added onChange handler for Email */}
            <InfoItem
              icon={<Mail size={16} />}
              text={profile.email}
              isEditMode={isEditMode}
              onChange={(val) => onChange("email", val)}
              placeholder="Email"
            />
            <InfoItem
              icon={<Globe size={16} />}
              text={profile.website}
              isEditMode={isEditMode}
              onChange={(val) => onChange("website", val)}
              placeholder="Website"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Identity Card
const InfoItem = ({ icon, text, isEditMode, placeholder, onChange }) =>
  // Only show if text exists or is in edit mode
  text || isEditMode ? (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="text-orange-500/70">{icon}</span>
      {isEditMode ? (
        <input
          className="bg-transparent border-b border-white/10 text-gray-300 w-32 focus:border-orange-500 focus:outline-none placeholder:text-gray-700"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <span>{text}</span>
      )}
    </div>
  ) : null;

const SocialIcon = ({ icon }) => (
  <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-orange-600 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20">
    {icon}
  </button>
);

// ============================================================================
// SUB-COMPONENT: StatsWidget (Views/Projects/Etc)
// ============================================================================
const StatsWidget = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Card 1: Views & Shares (Horizontal Split) */}
      <div className="bg-[#0B1120] border border-white/5 rounded-xl flex flex-col hover:border-orange-500/20 transition-colors group overflow-hidden">
        <div className="flex-1 p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div>
            <div className="text-gray-400 mb-1 group-hover:text-white transition-colors">
              <Users size={18} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Total Views
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.viewsCount}
          </div>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        <div className="flex-1 p-4 flex items-center justify-between hover:bg-white/5 transition-colors relative">
          {/* OVERLAY: COMING SOON */}
          <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          <div>
            <div className="text-gray-400 mb-1 group-hover:text-white transition-colors">
              <Share2 size={18} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Total Shares
            </div>
          </div>
          <div className="text-2xl font-bold text-white">--</div>
        </div>
      </div>

      {/* Card 2: Projects, Repos & Commits */}
      <div className="bg-[#0B1120] border border-white/5 rounded-xl flex flex-col hover:border-orange-500/20 transition-colors group overflow-hidden">
        {/* Top Half: Projects (Full Width) */}
        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div>
            <div className="text-gray-400 mb-1 group-hover:text-orange-500 transition-colors">
              <Briefcase size={18} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Projects
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.projectsCount}
          </div>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        {/* Bottom Half: Split Vertically (Repos | Commits) */}
        <div className="grid grid-cols-2 divide-x divide-white/5">
          {/* Left: Github Repos */}
          <div className="p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <div className="text-gray-400 group-hover:text-white transition-colors">
                <Github size={18} />
              </div>
              <div className="text-xl font-bold text-white">
                {stats.reposCount || 0}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Repos
            </div>
          </div>

          {/* Right: Commits */}
          <div className="p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <div className="text-gray-400 group-hover:text-white transition-colors">
                <GitCommit size={18} />
              </div>
              <div className="text-xl font-bold text-white">
                {stats.commitsCount}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Commits
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Appreciation & Comments (Horizontal Split) */}
      <div className="bg-[#0B1120] border border-white/5 rounded-xl flex flex-col hover:border-orange-500/20 transition-colors group overflow-hidden">
        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div>
            <div className="text-gray-400 mb-1 group-hover:text-blue-500 transition-colors">
              <ThumbsUp size={18} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Appreciation
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.appreciationCount}
          </div>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div>
            <div className="text-gray-400 mb-1 group-hover:text-white transition-colors">
              <MessageSquare size={18} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Comments
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.commentsCount}
          </div>
        </div>
      </div>

      {/* Card 4: Inquiries (Single) */}
      <div className="bg-[#0B1120] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-colors group relative overflow-hidden">
        {/* OVERLAY: COMING SOON */}
        <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
        <div className="flex justify-between items-start">
          <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-orange-500 transition-colors">
            <Inbox size={20} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white mb-0.5">0</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
            Inquiries
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: SkillsWidget
// ============================================================================
const SkillsWidget = ({ skills, onSeeMore, onAddProject, isLoggedIn }) => {
  // Logic to handle overflow
  const MAX_VISIBLE_SKILLS = 10;
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const overflowCount = skills.length - MAX_VISIBLE_SKILLS;
  const hasSkills = skills.length > 0;
  const isFewSkills = skills.length > 0 && skills.length < 5; // Threshold for "Few"

  console.log("📊 [DEBUG] Skills Widget Render:", {
    count: skills.length,
    hasSkills,
    isFewSkills,
    isLoggedIn,
  });

  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl flex flex-col h-full relative group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Cpu size={18} className="text-orange-500" />
          Tech Stack
        </h3>

        {/* Only show 'See more' if we have skills */}
        {hasSkills && (
          <button
            onClick={onSeeMore}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all duration-300 text-xs font-bold shadow-lg shadow-orange-500/5 hover:shadow-orange-500/20"
          >
            See more
            <ArrowUpRight
              size={12}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        )}
      </div>

      <div className="flex-1 content-start flex flex-col">
        {/* SKILLS LIST AREA */}
        <div className="flex flex-wrap gap-2 mb-4">
          {visibleSkills.map((skill, index) => (
            <div
              key={index}
              title={skill}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-default"
            >
              {skill.length > 10 ? `${skill.slice(0, 10)}...` : skill}
            </div>
          ))}

          {overflowCount > 0 && (
            <div
              onClick={onSeeMore}
              className="px-3 py-1.5 rounded-md text-sm font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
            >
              +{overflowCount}
            </div>
          )}
        </div>

        {/* LOGIC: CASE 1 - NO SKILLS (Logged In Only) */}
        {!hasSkills && isLoggedIn && (
          <div className="mt-auto py-8 px-4 bg-[#0f1623] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <p className="text-gray-400 text-sm mb-4 max-w-[200px]">
              No skills detected yet. Add a project to auto-generate your stack!
            </p>
            <button
              onClick={onAddProject}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} /> Add First Project
            </button>
          </div>
        )}

        {/* LOGIC: CASE 2 - FEW SKILLS (Logged In Only) */}
        {isFewSkills && isLoggedIn && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="bg-[#0f172a] border border-blue-500/20 rounded-xl p-4 flex items-center justify-between group/card hover:border-blue-500/40 transition-colors">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Expand your stack?
                </h4>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Add more projects to showcase your expertise.
                </p>
              </div>
              <button
                onClick={onAddProject}
                className="w-10 h-10 rounded-lg bg-[#1e293b] border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-lg shadow-black/20"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: AnalyticsCard (Custom SVG Chart)
// ============================================================================
const AnalyticsCard = () => {
  // Logic to normalize data for SVG
  const maxVal = Math.max(...WEEKLY_STATS.map((d) => d.value));
  const points = WEEKLY_STATS.map((d, i) => {
    const x = (i / (WEEKLY_STATS.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 80; // keep some padding top
    return `${x},${y}`;
  }).join(" ");

  // Create area path
  const areaPath = `M0,100 ${points
    .split(" ")
    .map((p, i) => `L${p}`)
    .join(" ")} L100,100 Z`;

  return (
    <div className="bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden relative min-h-[250px] flex flex-col">
      {/* OVERLAY: COMING SOON */}
      <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-50 flex items-center justify-center">
        <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20 uppercase tracking-widest shadow-xl">
          Coming Soon
        </span>
      </div>

      <div className="p-6 relative z-10">
        <h3 className="font-bold text-white mb-1">Profile Visits</h3>
        <p className="text-xs text-gray-500 mb-4">Last 7 days performance</p>

        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-white">364</span>
          <span className="text-sm text-green-500 mb-1 font-medium flex items-center">
            <ArrowUpRight size={14} /> 12.5%
          </span>
        </div>
      </div>

      {/* The Chart */}
      <div className="absolute bottom-0 left-0 right-0 h-32 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line
            x1="0"
            y1="25"
            x2="100"
            y2="25"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="75"
            x2="100"
            y2="75"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />

          {/* Area */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Tooltip Hover Overlay (Visual only mock) */}
      <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair">
        {WEEKLY_STATS.map((d, i) => (
          <div
            key={i}
            className="group relative flex flex-col items-center h-full justify-end pb-8 w-full"
          >
            <div className="w-0.5 h-full bg-white/5 absolute bottom-0 group-hover:bg-white/10 transition-colors"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
            <div className="absolute bottom-12 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
              {d.value} views
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: ActivityFeed
// ============================================================================
const ActivityFeed = () => {
  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl flex-1 relative overflow-hidden">
      {/* OVERLAY: COMING SOON */}
      <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-50 flex items-center justify-center">
        <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20 uppercase tracking-widest shadow-xl">
          Coming Soon
        </span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">
          Recent Activity
        </h3>
        <button className="text-xs text-orange-500 hover:text-orange-400 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/5"></div>

        {RECENT_ACTIVITY.map((item, idx) => (
          <div key={item.id} className="relative flex gap-4 group">
            <div className="relative z-10 w-7 h-7 rounded-full bg-[#020617] border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-orange-500 group-hover:border-orange-500 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {item.text}
              </p>
              <p className="text-xs text-gray-600 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Quick Actions
// ============================================================================
const QuickActions = () => {
  return (
    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-xl text-white shadow-xl shadow-orange-900/20 relative overflow-hidden">
      {/* OVERLAY: COMING SOON */}
      <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[2px] z-50 flex items-center justify-center">
        <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20 uppercase tracking-widest shadow-xl">
          Coming Soon
        </span>
      </div>

      <h3 className="font-bold text-lg mb-2">Boost your profile?</h3>
      <p className="text-orange-100 text-sm mb-4">
        Adding more projects increases visibility by 40%.
      </p>

      <div className="flex flex-col gap-2">
        <Link
          to="../projects"
          className="bg-white text-orange-600 py-2.5 px-4 rounded-lg font-bold text-sm text-center hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add New Project
        </Link>
        <button className="bg-black/20 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-black/30 transition-colors">
          Share Profile
        </button>
      </div>
    </div>
  );
};

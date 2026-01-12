//C:\PortfoliMe\portfoli_me\src\templates\liquid_glass\LiquidGlassUserHome.jsx
// Note: File name kept as requested, but content is now Cyberpunk styled.

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useOutletContext,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
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
  Terminal,
  Code,
  Hash,
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
import { decryptData } from "../../lib/secureStorage";
import UserSkillsModal from "../../modals/UserSkillsModal";
import OnboardingModal from "../../modals/OnboardingModal";

import defaultAvatar from "../../assets/default_avatar2.png";

// --- CYBERPUNK THEME CONSTANTS ---
const CYBER = {
  bg: "bg-[#050a10]",
  cardBg: "bg-[#0a0f16]",
  border: "border border-cyan-900/50",
  activeBorder: "border-cyan-500",
  textMain: "text-cyan-50",
  textDim: "text-cyan-900/70",
  textHighlight: "text-cyan-400",
  accent: "text-orange-500",
  glowBox: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
  input:
    "bg-black border border-cyan-900 text-cyan-400 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] outline-none font-mono",
  buttonPrimary:
    "bg-cyan-900/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all font-mono uppercase tracking-widest text-xs",
  buttonSecondary:
    "bg-black border border-gray-700 text-gray-500 hover:border-white hover:text-white transition-all font-mono uppercase tracking-widest text-xs",
  clipPath: { clipPath: "polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)" },
};

// --- HELPER COMPONENTS ---
const ToastNotification = ({ type, message, onClose }) => (
  <div className="fixed top-32 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
    <div
      className={`flex items-center gap-4 px-6 py-4 bg-black border-l-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
        type === "success" ? "border-green-500" : "border-red-500"
      }`}
    >
      <div className={type === "success" ? "text-green-500" : "text-red-500"}>
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
      </div>
      <div className="flex flex-col font-mono">
        <span
          className={`font-bold text-sm text-white uppercase tracking-wider`}
        >
          {type === "success" ? ">> SUCCESS" : ">> ERROR"}
        </span>
        <span className="text-xs text-gray-400">{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-white">
        <X size={14} />
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
export default function CyberpunkUserHome() {
  const { isEditMode, setIsEditMode, portfolioName, headerLayout, isPublic } =
    useOutletContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();

  const targetUid = username || currentUser?.uid;
  const isOwner = currentUser?.uid === targetUid;
  const effectiveEditMode = isOwner && isEditMode;

  const saveHeaderConfig = async () => {
    if (!currentUser?.uid || !isOwner) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { portfolioName, headerLayout });
      console.log("Header config saved");
    } catch (err) {
      console.error("Failed to save header config", err);
    }
  };

  const handleAddProjectRedirect = () => {
    if (setIsEditMode) setIsEditMode(true);
    navigate(`../projects`, { state: { highlightAddButton: true } });
  };

  const [loading, setLoading] = useState(true);
  const [viewerIsOnline, setViewerIsOnline] = useState(navigator.onLine);
  const [profileIsOnline, setProfileIsOnline] = useState(false);
  const [uploading, setUploading] = useState({ avatar: false, cover: false });
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    setupComplete: true,
  });

  const [initialProfile, setInitialProfile] = useState(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
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

  const [projects, setProjects] = useState([]);
  const [derivedSkills, setDerivedSkills] = useState([]);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    projectsCount: 0,
    appreciationCount: 0,
    commitsCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    reposCount: 0,
  });

  useEffect(() => {
    if (targetUid) {
      const loadProjects = async () => {
        try {
          const data = await getUserProjects(targetUid);
          setProjects(data);
          const allTags = data.flatMap((p) => p.tags || []);
          setDerivedSkills([...new Set(allTags)]);

          const totalLikes = data.reduce(
            (acc, curr) => acc + (curr.appreciation || 0),
            0
          );

          const commentCountsPromises = data.map(async (project) => {
            try {
              const commentsRef = collection(
                db,
                "users",
                targetUid,
                "projects",
                project.id,
                "comments"
              );
              const snapshot = await getDocs(commentsRef);
              return snapshot.size;
            } catch (err) {
              return 0;
            }
          });

          const commentCountsArray = await Promise.all(commentCountsPromises);
          const totalComments = commentCountsArray.reduce(
            (acc, curr) => acc + curr,
            0
          );

          setDashboardStats((prev) => ({
            ...prev,
            projectsCount: data.length,
            appreciationCount: totalLikes,
            commentsCount: totalComments,
          }));
        } catch (error) {
          console.error("Critical error fetching projects", error);
        }
      };
      loadProjects();
    }
  }, [targetUid]);

  useEffect(() => {
    if (loading) return;
    const username = profile.githubUsername;
    let userToken = "";
    try {
      if (profile.githubToken) userToken = decryptData(profile.githubToken);
    } catch (e) {
      console.error("Token decrypt fail", e);
    }

    if (username) {
      const loadGithubStats = async () => {
        try {
          const repos = await fetchUserRepositories(username, userToken);
          const commitCounts = await Promise.all(
            repos.map(async (repo) => {
              try {
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
            reposCount: repos.length,
          }));
        } catch (e) {
          console.error("Github fetch error", e);
        }
      };
      loadGithubStats();
    }
  }, [profile.githubUsername, profile.githubToken, loading]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (targetUid) {
      loadUserDataWithRetry();
      const unsub = onSnapshot(doc(db, "users", targetUid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileIsOnline(data.isOnline === true);
          setDashboardStats((prev) => ({
            ...prev,
            viewsCount: data.totalViews || 0,
          }));
        }
      });
      return () => unsub();
    }
  }, [targetUid]);

  useEffect(() => {
    const handleStatusChange = () => setViewerIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  const loadUserDataWithRetry = async () => {
    if (!targetUid) return;
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let lastFetchedData = null;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        const data = await fetchUserProfile(targetUid);
        lastFetchedData = data;
        const isValidProfile =
          data &&
          (data.email || data.displayName || data.role || data.photoURL);
        if (isValidProfile) {
          applyProfileData(data);
          success = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      } catch (error) {
        break;
      }
    }

    if (!success && lastFetchedData) {
      applyProfileData(lastFetchedData);
    }
    updateUserStatus(currentUser.uid, true);
    setLoading(false);
  };

  const applyProfileData = (data) => {
    if (isOwner && data.setupComplete === false) setShowOnboarding(true);

    // FIX: Removed fallback to currentUser photo to prevent showing viewer's photo on other profiles
    const resolvedAvatar = data?.photoURL || data?.avatar || defaultAvatar;

    const newProfileData = {
      name:
        data?.displayName ||
        data?.name ||
        currentUser?.displayName ||
        "USER_UNKNOWN",
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
        "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&q=80&w=2000",
      setupComplete: data?.setupComplete || false,
    };
    setProfile((prev) => {
      const updated = { ...prev, ...newProfileData };
      setInitialProfile(updated);
      return updated;
    });
  };

  const handleProfileChange = (field, value) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading((prev) => ({ ...prev, [type]: true }));
      const uploadedData = await uploadFileToCloudinary(file);
      setProfile((prev) => ({ ...prev, [type]: uploadedData.url }));
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
      if (isOwner) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { portfolioName, headerLayout, isPublic });
      }
      setInitialProfile(profile);
      setNotification({ type: "success", message: "SYSTEM_UPDATE_COMPLETE" });
    } catch (error) {
      setNotification({ type: "error", message: "WRITE_PERMISSION_DENIED" });
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center bg-[#050a10]">
        <div className="font-mono text-cyan-500 animate-pulse text-sm">
          INITIALIZING_SYSTEM...
        </div>
      </div>
    );

  return (
    <div
      className={`font-mono text-blue-100 pb-20 animate-in fade-in duration-700 relative ${
        headerLayout === "left"
          ? "slide-in-from-right-4"
          : "slide-in-from-bottom-4"
      }`}
    >
      {/* Background Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `linear-gradient(#0891b2 1px, transparent 1px), linear-gradient(90deg, #0891b2 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {notification && (
        <ToastNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <WelcomeHeader
        profile={profile}
        currentUser={currentUser}
        isOnline={profileIsOnline}
        isEditMode={effectiveEditMode}
        onSave={handleSaveProfile}
        isOwner={isOwner}
        viewsCount={dashboardStats.viewsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <IdentityCard
            profile={profile}
            isOnline={profileIsOnline}
            isEditMode={effectiveEditMode}
            onChange={handleProfileChange}
            onImageUpload={handleImageUpload}
            uploading={uploading}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <StatsWidget stats={dashboardStats} />
            </div>
            <div className="md:col-span-2">
              <SkillsWidget
                skills={derivedSkills}
                isLoggedIn={isOwner}
                onSeeMore={() => setShowSkillsModal(true)}
                onAddProject={handleAddProjectRedirect}
              />
            </div>
          </div>
          <UserSkillsModal
            isOpen={showSkillsModal}
            onClose={() => setShowSkillsModal(false)}
            projects={projects}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <AnalyticsCard />
          <ActivityFeed />
          {effectiveEditMode && <QuickActions />}
        </div>
      </div>

      {showOnboarding &&
        isOwner &&
        createPortal(
          <OnboardingModal
            user={currentUser}
            onComplete={() => {
              setShowOnboarding(false);
              loadUserDataWithRetry();
            }}
          />,
          document.body
        )}
    </div>
  );
}

// --- SUB-COMPONENTS (CYBERPUNK DESIGN) ---

const WelcomeHeader = ({
  profile,
  currentUser,
  isOnline,
  isEditMode,
  onSave,
  isOwner,
  viewsCount,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "INITIALIZING";
    if (hour < 18) return "SYSTEM_ACTIVE";
    return "NIGHT_MODE";
  };
  const displayName = isOwner
    ? profile.name
      ? profile.name.split(" ")[0]
      : currentUser?.displayName || "USER"
    : "GUEST_USER";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-cyan-900/30 pb-4 relative z-10">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className={`w-2 h-2 ${
              isOnline ? "bg-green-500 shadow-[0_0_8px_lime]" : "bg-red-500"
            } rotate-45`}
          ></div>
          <span
            className={`text-xs font-bold tracking-widest ${
              isOnline ? "text-green-500" : "text-red-500"
            }`}
          >
            {isOnline ? "NET_LINK_ESTABLISHED" : "SIGNAL_LOST"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tighter">
          {getGreeting()}:{" "}
          <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
            {displayName}
          </span>
        </h1>
        {isOwner && (
          <p className="text-cyan-800 text-xs mt-1 uppercase tracking-widest">
            // TRAFFIC_LOG:{" "}
            <span className="text-cyan-200">{viewsCount} UNIQUE_SIGS</span>{" "}
            DETECTED TODAY
          </p>
        )}
      </div>

      {isEditMode && (
        <div className="flex items-center gap-4">
          <div className="bg-orange-500/10 border border-orange-500/50 px-4 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 animate-ping" />
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">
              WRITE_ACCESS_GRANTED
            </span>
          </div>
          <button
            onClick={onSave}
            className="bg-cyan-900/20 hover:bg-cyan-500 hover:text-black border border-cyan-500 text-cyan-400 px-6 py-2 uppercase font-bold text-xs tracking-widest transition-all flex items-center gap-2 group"
          >
            <Save
              size={14}
              className="group-hover:scale-110 transition-transform"
            />{" "}
            COMMIT_CHANGES
          </button>
        </div>
      )}
    </div>
  );
};

const IdentityCard = ({
  profile,
  isOnline,
  isEditMode,
  onChange,
  onImageUpload,
  uploading,
}) => {
  const rawAvatar = profile.avatar;
  const isTwitter = rawAvatar?.includes("twimg.com");
  let finalSrc = rawAvatar;
  if (isTwitter) finalSrc = rawAvatar.replace("_normal", "_400x400");
  else if (!rawAvatar) finalSrc = defaultAvatar;

  return (
    <div
      className={`bg-[#080c14] border border-cyan-900/50 relative group overflow-hidden`}
    >
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 z-30"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 z-30"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 z-30"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 z-30"></div>

      {/* Cover Image */}
      <div className="h-48 w-full relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050a10]/50 to-[#050a10] z-10" />
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-20 opacity-20"></div>

        <img
          src={profile.cover}
          alt="Cover"
          className={`w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ${
            uploading.cover ? "opacity-30" : ""
          }`}
        />

        {uploading.cover && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
          </div>
        )}

        {isEditMode && (
          <label className="absolute top-4 right-4 z-30 bg-black/80 border border-cyan-500 p-2 cursor-pointer text-cyan-500 hover:bg-cyan-500 hover:text-black transition-colors">
            <Camera size={16} />
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
      <div className="px-6 pb-6 relative -mt-12 flex flex-col md:flex-row gap-6 items-start z-20">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 bg-black p-1 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="w-full h-full overflow-hidden relative group/avatar">
              <img
                src={finalSrc}
                alt="Avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
                className={`w-full h-full object-cover ${
                  uploading.avatar ? "opacity-50" : ""
                }`}
              />
              {uploading.avatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <Loader2 className="animate-spin text-cyan-500" size={24} />
                </div>
              )}
              {isEditMode && (
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-cyan-400" size={24} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => onImageUpload(e, "avatar")}
                  />
                </label>
              )}
            </div>
          </div>
          {/* Status Indicator text */}
          <div
            className={`absolute -bottom-6 left-0 w-full text-center text-[10px] tracking-widest font-bold ${
              isOnline ? "text-green-500" : "text-red-500"
            }`}
          >
            [{isOnline ? "ACT" : "OFF"}]
          </div>
        </div>

        <div className="flex-1 w-full pt-14 md:pt-12 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1 flex-1">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">
                {profile.name}
              </h2>
              {isEditMode ? (
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  placeholder="ENTER_ROLE"
                  className={`${CYBER.input} w-full md:w-2/3 px-2 py-1 text-sm`}
                />
              ) : (
                profile.role && (
                  <p className="text-orange-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    {" "}
                    <Terminal size={12} /> {profile.role}
                  </p>
                )
              )}
            </div>
            <div className="flex gap-2">
              <SocialIcon icon={<Github size={18} />} />
              <SocialIcon icon={<Linkedin size={18} />} />
              <SocialIcon icon={<Twitter size={18} />} />
            </div>
          </div>

          <div>
            {isEditMode ? (
              <textarea
                value={profile.bio}
                onChange={(e) => onChange("bio", e.target.value)}
                rows={3}
                placeholder="INPUT_BIO_DATA..."
                className={`${CYBER.input} w-full p-2 text-sm resize-none`}
              />
            ) : (
              <p className="text-cyan-100/70 text-sm leading-relaxed font-mono border-l-2 border-cyan-900 pl-3">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-3 border-t border-dashed border-cyan-900/30">
            <InfoItem
              icon={<MapPin size={14} />}
              text={profile.location}
              isEditMode={isEditMode}
              onChange={(val) => onChange("location", val)}
              placeholder="LOC_DATA"
            />
            <InfoItem
              icon={<Mail size={14} />}
              text={profile.email}
              isEditMode={isEditMode}
              onChange={(val) => onChange("email", val)}
              placeholder="EMAIL_ADDR"
            />
            <InfoItem
              icon={<Globe size={14} />}
              text={profile.website}
              isEditMode={isEditMode}
              onChange={(val) => onChange("website", val)}
              placeholder="NET_LINK"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, text, isEditMode, placeholder, onChange }) =>
  text || isEditMode ? (
    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
      <span className="text-cyan-600">{icon}</span>
      {isEditMode ? (
        <input
          className="bg-transparent border-b border-cyan-900 text-cyan-300 w-32 outline-none focus:border-cyan-400 placeholder:text-cyan-900"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <span className="hover:text-cyan-300 transition-colors cursor-default">
          {text}
        </span>
      )}
    </div>
  ) : null;

const SocialIcon = ({ icon }) => (
  <button className="w-8 h-8 border border-gray-700 bg-black flex items-center justify-center text-gray-500 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all">
    {icon}
  </button>
);

const StatsWidget = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Views */}
      <div
        className={`${CYBER.cardBg} ${CYBER.border} p-4 flex flex-col justify-between relative overflow-hidden group`}
      >
        <div className="absolute top-0 right-0 p-1">
          <div className="w-2 h-2 border-t border-r border-cyan-500"></div>
        </div>
        <div className="flex justify-between items-start">
          <div className="text-cyan-700 group-hover:text-cyan-400 transition-colors">
            <Users size={18} />
          </div>
          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            VISITS
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white font-mono">
            {stats.viewsCount}
          </div>
          <div className="text-[10px] text-cyan-800 uppercase">Total Hits</div>
        </div>
      </div>

      {/* Projects */}
      <div
        className={`${CYBER.cardBg} ${CYBER.border} p-4 flex flex-col justify-between relative overflow-hidden group`}
      >
        <div className="absolute bottom-0 left-0 p-1">
          <div className="w-2 h-2 border-b border-l border-orange-500"></div>
        </div>
        <div className="flex justify-between items-start">
          <div className="text-cyan-700 group-hover:text-orange-500 transition-colors">
            <Briefcase size={18} />
          </div>
          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            PROJS
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white font-mono">
            {stats.projectsCount}
          </div>
          <div className="flex gap-2 mt-1">
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <Github size={8} /> {stats.reposCount || 0}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <GitCommit size={8} /> {stats.commitsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div
        className={`${CYBER.cardBg} ${CYBER.border} p-4 col-span-2 flex items-center justify-between relative`}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-gray-900 to-black pointer-events-none"></div>

        <div className="flex items-center gap-3 z-10">
          <div className="text-cyan-800">
            <Heart size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {stats.appreciationCount}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">
              Likes
            </div>
          </div>
        </div>
        <div className="h-8 w-px bg-cyan-900/50"></div>
        <div className="flex items-center gap-3 z-10 text-right">
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {stats.commentsCount}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">
              Msgs
            </div>
          </div>
          <div className="text-cyan-800">
            <MessageSquare size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillsWidget = ({ skills, onSeeMore, onAddProject, isLoggedIn }) => {
  const visibleSkills = skills.slice(0, 10);
  const overflowCount = skills.length - 10;
  const hasSkills = skills.length > 0;

  return (
    <div
      className={`${CYBER.cardBg} ${CYBER.border} p-5 h-full flex flex-col relative`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2">
          <Cpu size={14} className="text-cyan-500" /> INSTALLED_MODULES
        </h3>
        {hasSkills && (
          <button
            onClick={onSeeMore}
            className="text-[10px] text-orange-500 border border-orange-500/50 px-2 py-0.5 hover:bg-orange-500 hover:text-black transition-colors uppercase"
          >
            Expand
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-wrap content-start gap-2">
        {visibleSkills.map((skill, index) => (
          <div
            key={index}
            className="px-2 py-1 border border-cyan-900/50 bg-cyan-900/10 text-cyan-300 text-[10px] font-mono hover:border-cyan-400 hover:shadow-[0_0_5px_cyan] transition-all cursor-default"
          >
            {skill.length > 10 ? `${skill.slice(0, 10)}...` : skill}
          </div>
        ))}
        {overflowCount > 0 && (
          <div
            onClick={onSeeMore}
            className="px-2 py-1 border border-dashed border-gray-600 text-gray-400 text-[10px] cursor-pointer hover:text-white hover:border-white transition-colors"
          >
            +{overflowCount} MORE
          </div>
        )}

        {!hasSkills && isLoggedIn && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-cyan-900/30">
            <p className="text-[10px] text-cyan-800 mb-2 font-mono">
              NO_STACK_DETECTED
            </p>
            <button
              onClick={onAddProject}
              className="bg-orange-500/10 border border-orange-500 text-orange-500 px-3 py-1 text-[10px] font-bold uppercase hover:bg-orange-500 hover:text-black transition-all flex items-center gap-1"
            >
              <Plus size={12} /> INIT_PROJECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsCard = () => {
  // Simple Mock SVG logic
  const maxVal = Math.max(...WEEKLY_STATS.map((d) => d.value));
  const points = WEEKLY_STATS.map((d, i) => {
    const x = (i / (WEEKLY_STATS.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 70;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div
      className={`${CYBER.cardBg} ${CYBER.border} relative overflow-hidden h-64 flex flex-col`}
    >
      <div className="p-4 relative z-10 flex justify-between items-start border-b border-cyan-900/20 bg-black/40">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            TRAFFIC_ANALYSIS
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-white font-mono">364</span>
            <span className="text-[10px] text-green-500 font-mono">
              ▲ 12.5%
            </span>
          </div>
        </div>
        <div className="px-2 py-1 bg-cyan-900/20 border border-cyan-500/30 text-[9px] text-cyan-300 font-mono">
          LIVE_FEED
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-80">
        {/* Grid overlay for chart */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Glow filter definition */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1"
            points={points}
            filter="url(#glow)"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M0,100 ${points
              .split(" ")
              .map((p) => `L${p}`)
              .join(" ")} L100,100 Z`}
            fill="rgba(6,182,212,0.1)"
          />
        </svg>
      </div>

      {/* Overlay Block */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] z-20">
        <div className="border border-orange-500/50 bg-black px-4 py-2">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest animate-pulse">
            Awaiting_Data_Stream
          </span>
        </div>
      </div>
    </div>
  );
};

const ActivityFeed = () => (
  <div
    className={`${CYBER.cardBg} ${CYBER.border} flex-1 relative flex flex-col`}
  >
    <div className="p-4 border-b border-cyan-900/20 flex justify-between items-center bg-black/20">
      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
        <Activity size={14} className="text-cyan-500" /> SYS_LOGS
      </h3>
      <button className="text-[10px] text-cyan-600 hover:text-cyan-400 uppercase font-bold">
        Expand
      </button>
    </div>

    <div className="p-4 space-y-4 font-mono text-xs overflow-y-auto max-h-[300px] relative">
      <div className="absolute left-6 top-4 bottom-4 w-px bg-cyan-900/30"></div>
      {RECENT_ACTIVITY.map((item) => (
        <div
          key={item.id}
          className="relative flex gap-4 items-start pl-2 group"
        >
          <div className="relative z-10 w-4 h-4 bg-black border border-cyan-900 group-hover:border-cyan-400 rounded-sm flex items-center justify-center mt-0.5 transition-colors">
            <div className="w-1.5 h-1.5 bg-cyan-800 group-hover:bg-cyan-400"></div>
          </div>
          <div>
            <p className="text-cyan-100 group-hover:text-white mb-0.5">
              <span className="text-cyan-700 mr-2 opacity-50">
                [{item.time.toUpperCase()}]
              </span>
              {item.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickActions = () => (
  <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 p-5 relative overflow-hidden">
    <div className="absolute -right-6 -top-6 w-20 h-20 bg-orange-500/20 blur-2xl rounded-full pointer-events-none"></div>

    <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-1">
      Boost_Profile?
    </h3>
    <p className="text-[10px] text-orange-200/60 mb-4 font-mono">
      Adding projects increases visibility by 40%.
    </p>

    <div className="flex gap-2">
      <Link
        to="../projects"
        className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold uppercase text-[10px] py-2 flex items-center justify-center gap-1 tracking-wider transition-colors clip-path-polygon-[0_0,100%_0,95%_100%,0_100%]"
      >
        <Plus size={12} /> New_Entry
      </Link>
      <button className="flex-1 border border-orange-500/50 text-orange-500 hover:text-white hover:border-white font-bold uppercase text-[10px] py-2 tracking-wider transition-colors bg-black/50">
        Share_Link
      </button>
    </div>
  </div>
);

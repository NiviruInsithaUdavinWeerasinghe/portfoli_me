//C:\PortfoliMe\portfoli_me\src\templates\liquid_glass\LiquidGlassUserHome.jsx
// Note: File name kept as requested, but content is now Skeuomorphic

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

// --- THEME CONSTANTS ---
const THEME = {
  bg: "bg-[#292929]",
  textMain: "text-gray-300",
  textMuted: "text-gray-500",
  accent: "text-orange-500",
  softPlastic:
    "bg-[#292929] shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#383838]",
  pressedPlastic:
    "bg-[#292929] shadow-[inset_6px_6px_12px_#1f1f1f,inset_-6px_-6px_12px_#333333]",
  inputField:
    "bg-[#292929] text-gray-300 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#383838] focus:shadow-[inset_5px_5px_10px_#1a1a1a,inset_-5px_-5px_10px_#383838] outline-none border-none",
  button:
    "bg-[#292929] text-gray-400 font-bold shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#383838] hover:text-orange-500 active:shadow-[inset_4px_4px_8px_#1a1a1a,inset_-4px_-4px_8px_#383838] active:scale-95 transition-all ease-in-out duration-200",
  card: "bg-[#292929] rounded-3xl shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838]",
};

// --- HELPER COMPONENTS ---
const ToastNotification = ({ type, message, onClose }) => (
  <div className="fixed top-32 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
    <div
      className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${
        THEME.softPlastic
      } border-l-4 ${
        type === "success" ? "border-green-500" : "border-red-500"
      }`}
    >
      <div
        className={`p-2 rounded-full ${THEME.pressedPlastic} ${
          type === "success" ? "text-green-500" : "text-red-500"
        }`}
      >
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`font-bold text-sm ${THEME.textMain}`}>
          {type === "success" ? "Success" : "Error"}
        </span>
        <span className={`text-xs ${THEME.textMuted}`}>{message}</span>
      </div>
      <button
        onClick={onClose}
        className={`ml-2 p-2 rounded-full ${THEME.button} w-8 h-8 flex items-center justify-center`}
      >
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
export default function LiquidGlassUserHome() {
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
      setNotification({
        type: "success",
        message: "Profile & Layout updated successfully!",
      });
    } catch (error) {
      setNotification({ type: "error", message: "Failed to save profile." });
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center bg-[#292929]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );

  return (
    <div
      className={`space-y-8 animate-in fade-in duration-700 relative pb-20 ${
        headerLayout === "left"
          ? "slide-in-from-right-4"
          : "slide-in-from-bottom-4"
      }`}
    >
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          <IdentityCard
            profile={profile}
            isOnline={profileIsOnline}
            isEditMode={effectiveEditMode}
            onChange={handleProfileChange}
            onImageUpload={handleImageUpload}
            uploading={uploading}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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
        <div className="lg:col-span-4 space-y-8 flex flex-col">
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

// --- SUB-COMPONENTS (SKEUOMORPHIC DESIGN) ---

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
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  const displayName = isOwner
    ? profile.name
      ? profile.name.split(" ")[0]
      : currentUser?.displayName || "User"
    : "Guest";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <div
          className={`flex items-center gap-2 mb-2 px-3 py-1 rounded-full w-fit ${
            isOnline
              ? "text-green-500 bg-green-500/10"
              : "text-red-500 bg-red-500/10"
          } ${THEME.pressedPlastic}`}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <h1
          className={`text-4xl font-bold ${THEME.textMain} tracking-tight drop-shadow-md`}
        >
          {getGreeting()}, <span className={THEME.accent}>{displayName}</span>.
        </h1>
        {isOwner && (
          <p className={`${THEME.textMuted} mt-2 text-sm max-w-xl`}>
            Your portfolio performance today.{" "}
            <span className={`font-bold ${THEME.textMain}`}>
              {viewsCount} visitors
            </span>{" "}
            recorded.
          </p>
        )}
      </div>

      {isEditMode && (
        <div className="flex items-center gap-4">
          <div
            className={`${THEME.pressedPlastic} px-4 py-2 rounded-full flex items-center gap-2 animate-pulse`}
          >
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">
              Editing Active
            </span>
          </div>
          <button
            onClick={onSave}
            className={`${THEME.button} px-6 py-3 rounded-2xl flex items-center gap-2 text-orange-500`}
          >
            <Save size={18} /> Save Changes
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
    <div className={`${THEME.card} p-2 relative group`}>
      {/* Cover Image */}
      <div className="h-56 w-full relative overflow-hidden rounded-[1.2rem] shadow-inner">
        <div className="absolute inset-0 bg-[#292929]/20 z-10" />
        <img
          src={profile.cover}
          alt="Cover"
          className={`w-full h-full object-cover ${
            uploading.cover ? "opacity-50" : ""
          }`}
        />
        {uploading.cover && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        )}

        {isEditMode && (
          <label
            className={`absolute top-4 right-4 z-20 ${THEME.button} p-3 rounded-full cursor-pointer text-white`}
          >
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
      <div className="px-6 pb-6 relative -mt-16 flex flex-col md:flex-row gap-8 items-start z-20">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`w-36 h-36 rounded-full p-1.5 ${THEME.bg} shadow-[10px_10px_20px_#1a1a1a,-10px_-10px_20px_#383838]`}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#292929] relative group/avatar">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="animate-spin text-orange-500" size={24} />
                </div>
              )}
              {isEditMode && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
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
          </div>
          <div
            className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ${THEME.bg} shadow-[3px_3px_6px_#1a1a1a,-3px_-3px_6px_#383838]`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                isOnline
                  ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                  : "bg-red-500 shadow-[0_0_8px_#ef4444]"
              }`}
            />
          </div>
        </div>

        <div className="flex-1 w-full pt-16 md:pt-14 space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <h2 className={`text-3xl font-bold ${THEME.textMain}`}>
                {profile.name}
              </h2>
              {isEditMode ? (
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  placeholder="Add Role"
                  className={`w-full md:w-2/3 px-4 py-2 rounded-xl text-sm font-bold text-orange-500 ${THEME.inputField}`}
                />
              ) : (
                profile.role && (
                  <p
                    className={`text-orange-500 font-bold flex items-center gap-2 text-sm tracking-wide bg-[#292929] w-fit px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_#1a1a1a,inset_-2px_-2px_4px_#383838]`}
                  >
                    {" "}
                    <Briefcase size={14} /> {profile.role}
                  </p>
                )
              )}
            </div>
            <div className="flex gap-3">
              <SocialIcon icon={<Github size={20} />} />
              <SocialIcon icon={<Linkedin size={20} />} />
              <SocialIcon icon={<Twitter size={20} />} />
            </div>
          </div>

          <div>
            {isEditMode ? (
              <textarea
                value={profile.bio}
                onChange={(e) => onChange("bio", e.target.value)}
                rows={3}
                placeholder="Write a short bio..."
                className={`w-full p-4 rounded-2xl text-sm ${THEME.inputField} resize-none`}
              />
            ) : (
              <p className={`${THEME.textMuted} leading-relaxed text-sm`}>
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <InfoItem
              icon={<MapPin size={16} />}
              text={profile.location}
              isEditMode={isEditMode}
              onChange={(val) => onChange("location", val)}
              placeholder="Location"
            />
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

const InfoItem = ({ icon, text, isEditMode, placeholder, onChange }) =>
  text || isEditMode ? (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-xl ${THEME.pressedPlastic}`}
    >
      <span className="text-orange-500">{icon}</span>
      {isEditMode ? (
        <input
          className="bg-transparent text-gray-300 w-32 outline-none text-sm font-medium placeholder:text-gray-600"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <span className={`text-sm font-medium ${THEME.textMain}`}>{text}</span>
      )}
    </div>
  ) : null;

const SocialIcon = ({ icon }) => (
  <button
    className={`${THEME.button} w-10 h-10 rounded-xl flex items-center justify-center`}
  >
    {icon}
  </button>
);

const StatsWidget = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Views */}
      <div
        className={`${THEME.card} p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform`}
      >
        <div className="flex justify-between items-start">
          <div
            className={`${THEME.pressedPlastic} p-3 rounded-2xl text-gray-400 group-hover:text-blue-400 transition-colors`}
          >
            <Users size={20} />
          </div>
          <div
            className={`px-2 py-1 rounded-lg ${THEME.softPlastic} text-[10px] font-bold text-gray-500`}
          >
            VIEWS
          </div>
        </div>
        <div className="mt-4">
          <div className={`text-3xl font-bold ${THEME.textMain}`}>
            {stats.viewsCount}
          </div>
          <div className={`text-xs ${THEME.textMuted} mt-1 font-medium`}>
            Total Profile Visits
          </div>
        </div>
      </div>

      {/* Projects */}
      <div
        className={`${THEME.card} p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform`}
      >
        <div className="flex justify-between items-start">
          <div
            className={`${THEME.pressedPlastic} p-3 rounded-2xl text-gray-400 group-hover:text-orange-500 transition-colors`}
          >
            <Briefcase size={20} />
          </div>
          <div
            className={`px-2 py-1 rounded-lg ${THEME.softPlastic} text-[10px] font-bold text-gray-500`}
          >
            PROJECTS
          </div>
        </div>
        <div className="mt-4">
          <div className={`text-3xl font-bold ${THEME.textMain}`}>
            {stats.projectsCount}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Github size={10} /> {stats.reposCount || 0} Repos
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <GitCommit size={10} /> {stats.commitsCount} Commits
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div
        className={`${THEME.card} p-5 col-span-2 flex items-center justify-between group`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`${THEME.pressedPlastic} p-3 rounded-2xl text-gray-400 group-hover:text-pink-500 transition-colors`}
          >
            <Heart size={20} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${THEME.textMain}`}>
              {stats.appreciationCount}
            </div>
            <div className={`text-xs ${THEME.textMuted}`}>Total Likes</div>
          </div>
        </div>
        <div className="h-10 w-[2px] bg-[#1f1f1f] shadow-[1px_0_2px_#333333]"></div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-2xl font-bold ${THEME.textMain}`}>
              {stats.commentsCount}
            </div>
            <div className={`text-xs ${THEME.textMuted}`}>Comments</div>
          </div>
          <div
            className={`${THEME.pressedPlastic} p-3 rounded-2xl text-gray-400 group-hover:text-green-500 transition-colors`}
          >
            <MessageSquare size={20} />
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
    <div className={`${THEME.card} p-6 h-full flex flex-col`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-bold ${THEME.textMain} flex items-center gap-2`}>
          <Cpu size={18} className="text-orange-500" /> Tech Stack
        </h3>
        {hasSkills && (
          <button
            onClick={onSeeMore}
            className={`w-8 h-8 rounded-full ${THEME.button} flex items-center justify-center text-orange-500`}
          >
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-wrap content-start gap-3">
        {visibleSkills.map((skill, index) => (
          <div
            key={index}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-gray-400 bg-[#292929] shadow-[5px_5px_10px_#1f1f1f,-5px_-5px_10px_#333333]`}
          >
            {skill.length > 10 ? `${skill.slice(0, 10)}...` : skill}
          </div>
        ))}
        {overflowCount > 0 && (
          <div
            onClick={onSeeMore}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-orange-500 cursor-pointer ${THEME.pressedPlastic}`}
          >
            +{overflowCount}
          </div>
        )}

        {!hasSkills && isLoggedIn && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <p className={`text-xs ${THEME.textMuted} mb-4`}>
              Add a project to auto-generate your stack!
            </p>
            <button
              onClick={onAddProject}
              className={`${THEME.button} px-4 py-2 rounded-xl text-xs flex items-center gap-2 text-orange-500`}
            >
              <Plus size={14} /> Add Project
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
    <div className={`${THEME.card} p-6 relative overflow-hidden h-64`}>
      <div className="absolute top-4 right-4 z-20">
        <span
          className={`text-[10px] font-bold text-orange-500 bg-[#292929] px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_#1a1a1a,inset_-2px_-2px_4px_#383838]`}
        >
          COMING SOON
        </span>
      </div>
      <h3 className={`font-bold ${THEME.textMain}`}>Profile Visits</h3>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-3xl font-bold text-gray-200">364</span>
        <span className="text-xs text-green-500 font-bold mb-1 flex items-center gap-1">
          <ArrowUpRight size={10} /> 12.5%
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-50">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d={`M0,100 ${points
              .split(" ")
              .map((p) => `L${p}`)
              .join(" ")} L100,100 Z`}
            fill="rgba(249,115,22,0.1)"
          />
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
    </div>
  );
};

const ActivityFeed = () => (
  <div className={`${THEME.card} p-6 flex-1`}>
    <div className="flex justify-between items-center mb-6">
      <h3 className={`font-bold ${THEME.textMain}`}>Activity</h3>
      <button
        className={`text-xs font-bold text-orange-500 hover:text-orange-400`}
      >
        View All
      </button>
    </div>
    <div className="space-y-6 relative">
      <div className="absolute left-4 top-2 bottom-2 w-1 bg-[#1f1f1f] shadow-[inset_1px_1px_2px_#000]" />
      {RECENT_ACTIVITY.map((item) => (
        <div key={item.id} className="relative flex gap-4 items-start pl-2">
          <div
            className={`relative z-10 w-8 h-8 rounded-full ${THEME.softPlastic} flex items-center justify-center text-gray-500`}
          >
            {item.icon}
          </div>
          <div>
            <p className={`text-sm font-medium ${THEME.textMain}`}>
              {item.text}
            </p>
            <p className={`text-xs ${THEME.textMuted} mt-1`}>{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickActions = () => (
  <div className={`${THEME.card} p-6`}>
    <h3 className={`font-bold ${THEME.textMain} mb-2`}>Boost your profile?</h3>
    <p className={`text-xs ${THEME.textMuted} mb-6`}>
      Adding more projects increases visibility by 40%.
    </p>
    <div className="flex gap-4">
      <Link
        to="../projects"
        className={`${THEME.button} flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-orange-500`}
      >
        <Plus size={16} /> Add Project
      </Link>
      <button
        className={`${THEME.button} flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-400`}
      >
        Share Profile
      </button>
    </div>
  </div>
);

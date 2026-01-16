import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom"; // ADDED: Required for layout context
import ReactDOM from "react-dom"; // Added for Portals
import axios from "axios"; // Added
import {
  User,
  Lock,
  Bell,
  Shield,
  Smartphone,
  Mail,
  Globe,
  MapPin,
  Github,
  Linkedin,
  Upload,
  Check,
  X,
  LogOut,
  Layout,
  Monitor,
  Save,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  XCircle,
  ExternalLink,
  Key,
  AlertCircle, // Added
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
} from "../../services/settingsService";
import { encryptData, decryptData } from "../../lib/secureStorage"; // Import Encryption
// validateGitHubToken removed
import { deleteField } from "firebase/firestore";
import { linkWithPopup, unlink, GoogleAuthProvider } from "firebase/auth";
import { auth, twitterProvider } from "../../lib/firebase";

// --- ASSETS ---
import defaultAvatar2 from "../../assets/default_avatar2.png";
import defaultAvatar3 from "../../assets/default_avatar3.png";
import defaultAvatar4 from "../../assets/default_avatar4.png";
import defaultAvatar5 from "../../assets/default_avatar5.png";
import defaultAvatar6 from "../../assets/default_avatar6.png";
import defaultAvatar7 from "../../assets/default_avatar7.png";
import defaultAvatar8 from "../../assets/default_avatar8.png";
import defaultAvatar9 from "../../assets/default_avatar9.png";
import defaultAvatar10 from "../../assets/default_avatar10.png";
import defaultAvatar11 from "../../assets/default_avatar11.png";
import defaultAvatar12 from "../../assets/default_avatar12.png";
import defaultAvatar13 from "../../assets/default_avatar13.png";
import defaultAvatar14 from "../../assets/default_avatar14.png";
import defaultAvatar15 from "../../assets/default_avatar15.png";

const DEFAULT_AVATARS = [
  defaultAvatar2,
  defaultAvatar4,
  defaultAvatar3,
  defaultAvatar5,
  defaultAvatar14,
  defaultAvatar15,
  defaultAvatar8,
  defaultAvatar9,
  defaultAvatar10,
  defaultAvatar11,
  defaultAvatar12,
  defaultAvatar13,
];
const FALLBACK_AVATAR = defaultAvatar2;

// --- MOCK DATA (For unmodified sections) ---
const SESSIONS = [
  {
    id: 1,
    device: 'MacBook Pro 16"',
    os: "macOS Sonoma",
    location: "Colombo, LK",
    active: true,
    icon: <Monitor size={18} />,
  },
  {
    id: 2,
    device: "iPhone 15 Pro",
    os: "iOS 17.2",
    location: "Moratuwa, LK",
    active: false,
    lastSeen: "2 hours ago",
    icon: <Smartphone size={18} />,
  },
  {
    id: 3,
    device: "Windows PC",
    os: "Windows 11",
    location: "Kandy, LK",
    active: false,
    lastSeen: "3 days ago",
    icon: <Monitor size={18} />,
  },
];

const NOTIFICATIONS = [
  {
    id: "email_news",
    title: "Product Updates",
    description: "Receive emails about new features and improvements.",
    type: "email",
    enabled: true,
  },
  {
    id: "email_security",
    title: "Security Alerts",
    description: "Get notified about suspicious logins and password changes.",
    type: "email",
    enabled: true,
  },
  {
    id: "push_comments",
    title: "New Comments",
    description: "Push notification when someone comments on your project.",
    type: "push",
    enabled: false,
  },
  {
    id: "push_mentions",
    title: "Mentions",
    description: "Push notification when someone mentions you.",
    type: "push",
    enabled: true,
  },
];

// --- MAIN COMPONENT ---
export default function LiquidGlassUserSettings() {
  // UPDATED: Get headerLayout for dynamic animation
  const { headerLayout } = useOutletContext();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Profile State
  const [formData, setFormData] = useState({
    displayName: "",
    role: "",
    location: "",
    website: "",
    bio: "",
    photoURL: "",
    // Added these fields so the UI knows they exist
    githubToken: "",
    githubUsername: "",
    twitterConnected: false,
    linkedinConnected: false,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Load User Data
  useEffect(() => {
    async function loadData() {
      if (currentUser?.uid) {
        try {
          const data = await getUserProfile(currentUser.uid);
          if (data) {
            // Apply fallback if no photo exists
            const initialPhoto = data.photoURL || FALLBACK_AVATAR;
            setFormData({
              displayName: data.displayName || "",
              role: data.role || "",
              location: data.location || "",
              website: data.website || "",
              bio: data.bio || "",
              photoURL: initialPhoto,
              // Map the database fields to state
              githubToken: data.githubToken
                ? decryptData(data.githubToken)
                : "", // DECRYPT ON LOAD
              githubUsername: data.githubUsername || "",
              twitterConnected: data.twitterConnected || false,
              linkedinConnected: data.linkedinConnected || false,
            });
            setAvatarPreview(initialPhoto);
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    loadData();
  }, [currentUser]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    // Reset to fallback default
    setAvatarFile(null);
    setAvatarPreview(FALLBACK_AVATAR);
    setFormData((prev) => ({ ...prev, photoURL: FALLBACK_AVATAR }));
  };

  const handleDefaultAvatarSelect = (avatarSrc) => {
    setAvatarFile(null);
    setAvatarPreview(avatarSrc);
    setFormData((prev) => ({ ...prev, photoURL: avatarSrc }));
  };

  // Global Save Handler
  const handleSave = async () => {
    if (!currentUser?.uid) return;
    setIsSaving(true);

    try {
      let finalPhotoURL = formData.photoURL;

      // Upload new photo if selected
      if (avatarFile) {
        finalPhotoURL = await uploadProfilePicture(avatarFile);
      }

      // Prepare update object
      const updates = {
        ...formData,
        photoURL: finalPhotoURL,
        updatedAt: new Date(), // Client-side timestamp, ideally serverTimestamp() via service
      };

      await updateUserProfile(currentUser.uid, updates);

      // Update local state to reflect saved data
      setFormData((prev) => ({ ...prev, photoURL: finalPhotoURL }));
      setAvatarFile(null); // Clear file selection after upload

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
      // Handle error state if needed
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            formData={formData}
            loading={loadingData}
            onChange={handleInputChange}
            onFileChange={handleFileChange}
            avatarPreview={avatarPreview}
            onRemovePhoto={handleRemovePhoto}
            onDefaultSelect={handleDefaultAvatarSelect}
          />
        );
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "integrations":
        return (
          <IntegrationSettings
            formData={formData}
            currentUser={currentUser}
            onUpdate={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
          />
        );
      default:
        return <GeneralSettings />;
    }
  };

  return (
    // UPDATED: Dynamic Slide Direction based on Header Layout
    <div
      className={`mx-auto animate-in fade-in duration-700 ${
        headerLayout === "left"
          ? "slide-in-from-right-4"
          : "slide-in-from-bottom-4"
      }`}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Settings
          </h1>
          <p className="text-gray-400">
            Manage your account preferences and configurations.
          </p>
        </div>

        {/* Floating Save Status */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2 shadow-lg shadow-green-900/10">
            <Check size={16} />
            <span className="text-sm font-medium">
              Changes saved successfully
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* OVERLAY: COMING SOON - COVERS ENTIRE SETTINGS PAGE */}
        <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-[3px] z-50 flex items-center justify-center rounded-xl">
          <span className="text-xl font-bold text-orange-400 bg-orange-400/10 px-8 py-4 rounded-full border border-orange-400/20 uppercase tracking-widest shadow-2xl">
            Coming Soon
          </span>
        </div>

        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2 lg:sticky lg:top-24 opacity-50 pointer-events-none">
          <NavButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<User size={18} />}
            label="General Profile"
          />
          <NavButton
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={<Shield size={18} />}
            label="Security & Login"
          />
          <NavButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={<Bell size={18} />}
            label="Notifications"
          />
          <NavButton
            active={activeTab === "integrations"}
            onClick={() => setActiveTab("integrations")}
            icon={<Layout size={18} />}
            label="Integrations"
          />
        </div>

        {/* Main Content Area - Glass Panel */}
        <div className="flex-1 w-full bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 min-h-[600px] relative shadow-2xl shadow-black/20 opacity-50 pointer-events-none">
          {renderContent()}

          {/* Sticky Save Button Bar */}
          <div className="mt-12 pt-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-gray-900/0 backdrop-blur-none z-10">
            <button
              onClick={() => window.location.reload()} // Simple reset for now
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-orange-500/20 hover:scale-105 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: General Settings (Connected)
// ============================================================================
const GeneralSettings = ({
  formData,
  loading,
  onChange,
  onFileChange,
  avatarPreview,
  onRemovePhoto,
  onDefaultSelect,
}) => {
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null); // Added Ref

  // Added Scroll Handler
  const scroll = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader
        title="Profile Information"
        description="Update your photo and personal details here."
      />

      {/* Avatar Section - REDESIGNED */}
      <div className="p-8 border border-white/5 rounded-3xl bg-black/20 backdrop-blur-xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* UPDATED: Changed Flex to Grid for better width containment */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-start relative z-10">
          {/* Left: Main Preview (Larger) */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-1.5 shadow-2xl shadow-orange-500/20 ring-4 ring-black/40">
              <img
                src={avatarPreview || "https://via.placeholder.com/200"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-[#0B1120] bg-[#0B1120]"
              />
            </div>
          </div>

          {/* Right: Controls & Defaults */}
          <div className="min-w-0 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Profile Photo</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Upload a custom photo or choose a default avatar.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Upload size={16} /> Upload
                </button>
                <button
                  onClick={onRemovePhoto}
                  className="px-5 py-2.5 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm font-semibold rounded-xl transition-all"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 w-full"></div>

            {/* Default Avatars Grid (Horizontal Scroll with Arrows) */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 block">
                Select a Default Avatar
              </label>

              {/* Scroll Container Wrapper */}
              <div className="relative group">
                {/* Left Arrow Button */}
                <button
                  onClick={() => scroll(-200)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-orange-600 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg -ml-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right Arrow Button */}
                <button
                  onClick={() => scroll(200)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-orange-600 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg -mr-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Scrollable Area */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-5 overflow-x-auto pb-6 pt-2 px-2 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                >
                  {DEFAULT_AVATARS.filter(
                    (avatar) => avatar !== avatarPreview
                  ).map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => onDefaultSelect(avatar)}
                      className="group/item relative w-20 h-20 md:w-24 md:h-24 rounded-full flex-shrink-0 transition-all duration-300 hover:scale-105 hover:ring-4 hover:ring-orange-500/30 focus:outline-none"
                      title="Select this avatar"
                    >
                      <div className="absolute inset-0 bg-black/20 rounded-full group-hover/item:bg-transparent transition-colors"></div>
                      <img
                        src={avatar}
                        alt={`Default ${index + 1}`}
                        className="w-full h-full rounded-full object-cover border-2 border-white/10 group-hover/item:border-orange-500 transition-colors shadow-xl"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputGroup
          label="Display Name"
          name="displayName"
          value={formData.displayName}
          onChange={onChange}
          placeholder="Your Full Name"
          colSpan="col-span-2"
        />
        <InputGroup
          label="Headline"
          name="role"
          value={formData.role}
          onChange={onChange}
          placeholder="e.g. Full Stack Engineer"
          colSpan="col-span-2"
        />
        <InputGroup
          label="Location"
          name="location"
          value={formData.location}
          onChange={onChange}
          placeholder="City, Country"
          icon={<MapPin size={16} />}
        />
        <InputGroup
          label="Portfolio URL"
          name="website"
          value={formData.website}
          onChange={onChange}
          placeholder="your-site.com"
          icon={<Globe size={16} />}
        />

        <div className="col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-400 block ml-1">
            Bio
          </label>
          <textarea
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={onChange}
            className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-0 transition-all text-sm leading-relaxed backdrop-blur-sm"
            placeholder="Tell us a little about yourself..."
          />
          <p className="text-right text-xs text-gray-600 mt-1 mr-1">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 2: Security Settings (Mock)
// ============================================================================
const SecuritySettings = () => {
  const [showCurrentPass, setShowCurrentPass] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader
        title="Password & Authentication"
        description="Manage your login security preferences."
      />

      {/* Change Password */}
      <div className="space-y-4">
        <div className="relative">
          <InputGroup
            label="Current Password"
            type={showCurrentPass ? "text" : "password"}
            defaultValue="password123"
          />
          <button
            onClick={() => setShowCurrentPass(!showCurrentPass)}
            className="absolute right-4 top-[38px] text-gray-500 hover:text-white transition-colors"
          >
            {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
          />
          <InputGroup
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

      {/* 2FA Section */}
      <div className="flex items-start justify-between gap-4 p-5 border border-orange-500/20 bg-orange-500/5 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-orange-500/5 blur-xl group-hover:bg-orange-500/10 transition-colors duration-500"></div>
        <div className="flex gap-4 relative z-10">
          <div className="mt-1 p-2.5 bg-orange-500/10 rounded-xl text-orange-500 ring-1 ring-orange-500/20">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Add an extra layer of security to your account by requiring a code
              when logging in.
            </p>
          </div>
        </div>
        <button className="relative z-10 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-orange-900/20">
          Enable
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

      {/* Session Management */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {SESSIONS.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-full text-gray-400">
                  {session.icon}
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm flex items-center gap-2">
                    {session.device}
                    {session.active && (
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                        Current
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.location} •{" "}
                    {session.active ? "Active now" : session.lastSeen}
                  </p>
                </div>
              </div>
              {!session.active && (
                <button
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Revoke Session"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

      {/* Danger Zone */}
      <div>
        <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium text-sm">Delete Account</h4>
            <p className="text-xs text-gray-400 mt-1">
              Permanently remove your Personal Portfolio and all of its
              contents.
            </p>
          </div>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-sm font-medium rounded-lg transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: Notification Settings (Mock)
// ============================================================================
const NotificationSettings = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader
        title="Notifications"
        description="Choose how and when you want to be notified."
      />

      <div className="space-y-6">
        {/* Email Notifications */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Mail size={14} /> Email Notifications
          </h3>
          <div className="space-y-2 bg-black/20 border border-white/5 rounded-2xl p-2 backdrop-blur-sm">
            {NOTIFICATIONS.filter((n) => n.type === "email").map((n) => (
              <NotificationRow key={n.id} item={n} />
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone size={14} /> Push Notifications
          </h3>
          <div className="space-y-2 bg-black/20 border border-white/5 rounded-2xl p-2 backdrop-blur-sm">
            {NOTIFICATIONS.filter((n) => n.type === "push").map((n) => (
              <NotificationRow key={n.id} item={n} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 4: Integration Settings (Functional)
// ============================================================================
const IntegrationSettings = ({ formData, currentUser, onUpdate }) => {
  const [loading, setLoading] = useState(null); // 'github', 'twitter', 'linkedin'
  const [error, setError] = useState(null);

  // GitHub Modal State
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubInputs, setGithubInputs] = useState({ username: "", token: "" });
  const [githubModalError, setGithubModalError] = useState(""); // Local error state for Modal

  // NEW: Disconnect Modal State
  const [disconnectTarget, setDisconnectTarget] = useState(null); // 'github', 'twitter', etc.

  // --- ACTIONS ---

  // 1. GitHub Connect (PAT Flow)
  const handleGithubSubmit = async (e) => {
    e.preventDefault();
    setLoading("github");
    setGithubModalError(""); // Clear previous modal errors
    setError(null);

    try {
      // 1. Validate GitHub Token AND Get the Username associated with it
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${githubInputs.token}` },
      });
      const authenticatedUsername = response.data.login;

      // 2. Compare Token Owner vs. Entered Username
      const targetUsername = githubInputs.username.trim();

      if (
        authenticatedUsername.toLowerCase() !== targetUsername.toLowerCase()
      ) {
        setGithubModalError(
          "The provided token does not match the entered username."
        );
        setLoading(null);
        return;
      }

      const updates = {
        githubUsername: targetUsername,
        githubToken: encryptData(githubInputs.token), // ENCRYPT BEFORE SAVING
      };

      await updateUserProfile(currentUser.uid, updates);
      onUpdate(updates);
      setShowGithubModal(false);
      // Reset inputs only on success
      setGithubInputs({ username: "", token: "" });
    } catch (err) {
      console.error("GitHub Connection Error:", err);
      // Generic invalid token message
      setGithubModalError(
        "The GitHub token provided is invalid. Please check and try again."
      );
    } finally {
      setLoading(null);
    }
  };

  // 2. Twitter Connect (OAuth Flow)
  const handleTwitterConnect = async () => {
    setLoading("twitter");
    setError(null);
    try {
      // Attempt real OAuth linking
      const result = await linkWithPopup(currentUser, twitterProvider);

      const updates = {
        twitterConnected: true,
        twitterHandle:
          result.user.reloadUserInfo.screenName || "Connected User",
      };

      await updateUserProfile(currentUser.uid, updates);
      onUpdate(updates);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/credential-already-in-use") {
        setError("This Twitter account is already connected to another user.");
      } else {
        setError("Failed to connect Twitter. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  // 3. LinkedIn Connect (Placeholder / Future OAuth)
  const handleLinkedinConnect = async () => {
    setLoading("linkedin");
    // Simulate API call for now (Placeholder logic as requested)
    setTimeout(async () => {
      try {
        const updates = { linkedinConnected: true };
        await updateUserProfile(currentUser.uid, updates);
        onUpdate(updates);
        setLoading(null);
      } catch (err) {
        setError("Could not update profile.");
        setLoading(null);
      }
    }, 1500);
  };

  // --- NEW: CONFIRM DISCONNECT HANDLER (Logic Only) ---
  const confirmDisconnect = async () => {
    const platform = disconnectTarget;
    if (!platform) return;

    setLoading(platform);
    setDisconnectTarget(null); // Close modal immediately

    try {
      let updates = {};
      let localUpdates = {}; // Added to handle local state reset

      if (platform === "github") {
        updates = { githubUsername: deleteField(), githubToken: deleteField() };
        localUpdates = { githubUsername: "", githubToken: "" }; // Clear local state
      } else if (platform === "twitter") {
        updates = {
          twitterConnected: deleteField(),
          twitterHandle: deleteField(),
        };
        localUpdates = { twitterConnected: false, twitterHandle: "" }; // Clear local state
        // Attempt to unlink Auth credential if it exists
        try {
          await unlink(currentUser, twitterProvider.providerId);
        } catch (e) {
          console.warn("Auth unlink failed (might not be linked in Auth):", e);
        }
      } else if (platform === "linkedin") {
        updates = { linkedinConnected: deleteField() };
        localUpdates = { linkedinConnected: false }; // Clear local state
      }

      await updateUserProfile(currentUser.uid, updates);
      onUpdate(localUpdates); // Update parent state with cleared values
    } catch (err) {
      console.error(err);
      setError(`Failed to disconnect ${platform}`);
    } finally {
      setLoading(null);
    }
  };

  const isGithubConnected = !!formData.githubToken;
  const isTwitterConnected = !!formData.twitterConnected;
  const isLinkedinConnected = !!formData.linkedinConnected;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">
      <SectionHeader
        title="Connected Apps"
        description="Supercharge your workflow by connecting tools you use."
      />

      {/* Top Level Error (For non-modal errors like Twitter/Disconnect) */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* GitHub */}
        <IntegrationCard
          icon={<Github size={24} />}
          name="GitHub"
          description="Sync your repositories and display commit history automatically."
          connected={isGithubConnected}
          loading={loading === "github"}
          color="bg-[#24292e]"
          onConnect={() => {
            setGithubModalError(""); // Reset specific modal error on open
            setShowGithubModal(true);
          }}
          onDisconnect={() => setDisconnectTarget("github")}
        />

        {/* LinkedIn */}
        <IntegrationCard
          icon={<Linkedin size={24} />}
          name="LinkedIn"
          description="Display your professional experience and certifications."
          connected={isLinkedinConnected}
          loading={loading === "linkedin"}
          color="bg-[#0077b5]"
          onConnect={handleLinkedinConnect}
          onDisconnect={() => setDisconnectTarget("linkedin")}
        />

        {/* Twitter */}
        <IntegrationCard
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
          name="X (Twitter)"
          description="Share your latest updates and posts on your profile."
          connected={isTwitterConnected}
          loading={loading === "twitter"}
          color="bg-black border border-white/20"
          onConnect={handleTwitterConnect}
          onDisconnect={() => setDisconnectTarget("twitter")}
        />
      </div>

      {/* --- NEW: CUSTOM DISCONNECT MODAL --- */}
      {disconnectTarget &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0B1120] border border-white/10 rounded-2xl p-6 shadow-2xl relative scale-100 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto">
                <LogOut size={24} />
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-2">
                Disconnect{" "}
                {disconnectTarget.charAt(0).toUpperCase() +
                  disconnectTarget.slice(1)}
                ?
              </h3>

              <p className="text-sm text-gray-400 text-center mb-6">
                Are you sure you want to disconnect? This will remove related
                data from your profile. You can reconnect anytime.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDisconnectTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisconnect}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
                >
                  Yes, Disconnect
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* GitHub Connect Modal */}
      {showGithubModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <style>{`
            input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active{
              -webkit-background-clip: text;
              -webkit-text-fill-color: #ffffff;
              transition: background-color 5000s ease-in-out 0s;
              box-shadow: inset 0 0 20px 20px #0B1120;
            }
          `}</style>
            <div className="w-full max-w-md bg-[#0B1120] border border-white/10 rounded-2xl p-6 shadow-2xl relative h-[500px] max-h-[85vh] flex flex-col">
              <button
                onClick={() => setShowGithubModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"
              >
                <XCircle size={20} />
              </button>

              {/* Scrollable Content Wrapper with Hidden Scrollbar */}
              <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-white">
                    <Github size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Connect GitHub
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Enter your username and Personal Access Token (PAT) to fetch
                    your repositories.
                  </p>
                </div>

                {/* Error Message Display (Inside Modal) */}
                {githubModalError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500">
                      <AlertCircle size={16} />
                    </div>
                    <p className="text-sm text-red-400 font-medium">
                      {githubModalError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleGithubSubmit} className="space-y-4">
                  <InputGroup
                    label="GitHub Username"
                    name="username"
                    placeholder="e.g. Enter your username"
                    value={githubInputs.username}
                    required // Added
                    onChange={(e) =>
                      setGithubInputs((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                  />

                  {/* Custom Token Input with Link */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-medium text-gray-400 block ml-1">
                        Personal Access Token
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?description=PortfoliMe%20Access&scopes=repo,read:org,read:user,read:project"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-orange-500 flex items-center gap-1 hover:underline"
                      >
                        Generate Token <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors">
                        <Key size={18} />
                      </div>
                      <input
                        type="password"
                        name="token"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={githubInputs.token}
                        required // Added
                        onChange={(e) =>
                          setGithubInputs((p) => ({
                            ...p,
                            token: e.target.value,
                          }))
                        }
                        className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-0 transition-colors duration-200 text-sm backdrop-blur-sm"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 px-1">
                      Click "Generate Token" above, scroll down, click "Generate
                      token", and paste it here.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading === "github"}
                      className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {loading === "github"
                        ? "Verifying..."
                        : "Verify & Connect"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// ============================================================================
// SHARED HELPER COMPONENTS
// ============================================================================

const NavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active
        ? "bg-gradient-to-r from-orange-600/90 to-orange-500/90 text-white shadow-lg shadow-orange-500/20 ring-1 ring-white/10"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    <div
      className={`relative z-10 ${
        active
          ? "text-white"
          : "text-gray-500 group-hover:text-white transition-colors"
      }`}
    >
      {icon}
    </div>
    <span className="font-medium text-sm relative z-10">{label}</span>
  </button>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-6 pb-6 border-b border-white/5">
    <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

const InputGroup = ({
  label,
  name,
  type = "text",
  value,
  defaultValue,
  onChange,
  placeholder,
  colSpan,
  icon,
  required, // Added
}) => (
  <div className={`space-y-2 ${colSpan || ""}`}>
    <label className="text-sm font-medium text-gray-400 block ml-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        required={required} // Added
        className={`w-full bg-[#0B1120]/50 border border-white/10 rounded-xl py-3 text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-0 transition-colors duration-200 text-sm backdrop-blur-sm ${
          icon ? "pl-11 pr-4" : "px-4"
        }`}
      />
    </div>
  </div>
);

const NotificationRow = ({ item }) => {
  const [enabled, setEnabled] = useState(item.enabled);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
      <div>
        <h4 className="text-white text-sm font-medium mb-0.5">{item.title}</h4>
        <p className="text-xs text-gray-500">{item.description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={setEnabled} />
    </div>
  );
};

const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ring-1 ring-inset ring-white/5 ${
      enabled ? "bg-orange-600" : "bg-gray-800"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const IntegrationCard = ({
  icon,
  name,
  description,
  connected,
  color,
  loading,
  onConnect,
  onDisconnect,
}) => (
  <div className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-2xl hover:border-white/10 transition-colors group backdrop-blur-sm">
    <div className="flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${color}`}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold flex items-center gap-2">
          {name}
          {connected && (
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
              Connected
            </span>
          )}
        </h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    <button
      onClick={connected ? onDisconnect : onConnect}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2 ${
        connected
          ? "bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
          : "bg-white text-black border-transparent hover:bg-gray-200"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : connected ? (
        "Disconnect"
      ) : (
        "Connect"
      )}
    </button>
  </div>
);

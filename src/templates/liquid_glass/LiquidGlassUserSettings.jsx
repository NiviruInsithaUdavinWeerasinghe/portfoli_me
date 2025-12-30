import React, { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Smartphone,
  Mail,
  Globe,
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
} from "lucide-react";

// --- MOCK DATA ---
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
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Global Save Handler
  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "integrations":
        return <IntegrationSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2 lg:sticky lg:top-24">
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
        <div className="flex-1 w-full bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 min-h-[600px] relative shadow-2xl shadow-black/20">
          {renderContent()}

          {/* Sticky Save Button Bar */}
          <div className="mt-12 pt-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-gray-900/0 backdrop-blur-none z-10">
            <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
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
// TAB 1: General Settings
// ============================================================================
const GeneralSettings = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader
        title="Profile Information"
        description="Update your photo and personal details here."
      />

      {/* Avatar Section */}
      <div className="flex items-center gap-6 p-5 border border-white/5 rounded-2xl bg-black/20 backdrop-blur-sm">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 p-[2px] shadow-lg shadow-orange-500/20">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-4 border-[#0B1120]"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">Profile Photo</h3>
          <p className="text-xs text-gray-500 mb-3">
            Recommended: 400x400px. JPG, PNG or GIF.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
              <Upload size={14} /> Upload New
            </button>
            <button className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium rounded-lg transition-colors">
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputGroup label="First Name" defaultValue="Alex" />
        <InputGroup label="Last Name" defaultValue="Developer" />
        <InputGroup
          label="Headline"
          defaultValue="Full Stack Engineer"
          colSpan="col-span-2"
        />
        <InputGroup
          label="Location"
          defaultValue="Colombo, Sri Lanka"
          icon={<Globe size={16} />}
        />
        <InputGroup
          label="Portfolio URL"
          defaultValue="portfoli.me/alex"
          icon={<Globe size={16} />}
        />

        <div className="col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-400 block ml-1">
            Bio
          </label>
          <textarea
            rows={4}
            className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm leading-relaxed backdrop-blur-sm"
            defaultValue="Building digital experiences with a focus on minimalism and performance. Specialized in React ecosystems and Java Android development."
          />
          <p className="text-right text-xs text-gray-600 mt-1 mr-1">
            240/500 characters
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 2: Security Settings
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
// TAB 3: Notification Settings
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
// TAB 4: Integration Settings
// ============================================================================
const IntegrationSettings = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader
        title="Connected Apps"
        description="Supercharge your workflow by connecting tools you use."
      />

      <div className="grid grid-cols-1 gap-4">
        <IntegrationCard
          icon={<Github size={24} />}
          name="GitHub"
          description="Sync your repositories and display commit history automatically."
          connected={true}
          color="bg-[#24292e]"
        />
        <IntegrationCard
          icon={<Linkedin size={24} />}
          name="LinkedIn"
          description="Display your professional experience and certifications."
          connected={false}
          color="bg-[#0077b5]"
        />
        <IntegrationCard
          icon={<div className="font-bold text-xl">D</div>}
          name="Dribbble"
          description="Showcase your design shots directly in your portfolio projects."
          connected={false}
          color="bg-[#ea4c89]"
        />
      </div>
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
  type = "text",
  defaultValue,
  placeholder,
  colSpan,
  icon,
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full bg-[#0B1120]/50 border border-white/10 rounded-xl py-3 text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm backdrop-blur-sm ${
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

const IntegrationCard = ({ icon, name, description, connected, color }) => (
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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
        connected
          ? "bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
          : "bg-white text-black border-transparent hover:bg-gray-200"
      }`}
    >
      {connected ? "Disconnect" : "Connect"}
    </button>
  </div>
);

import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
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
  Calendar,
  ArrowUpRight,
  Plus,
  X,
  Github,
  Linkedin,
  Twitter,
  Cpu,
  Save,
  Activity,
  MousePointer2,
} from "lucide-react";

// --- HELPER COMPONENTS (Defined before use) ---
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

// --- MOCK DATA FOR CHARTS & ACTIVITY ---
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
export default function UserHome() {
  const { isEditMode } = useOutletContext();

  // -- State Management --
  const [profile, setProfile] = useState({
    name: "Alex Developer",
    role: "Full Stack Engineer",
    bio: "Building digital experiences with a focus on minimalism and performance. Specialized in React ecosystems and Java Android development. Currently building the future of portfolios.",
    location: "Colombo, Sri Lanka",
    email: "alex@portfoli.me",
    website: "www.alexdev.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1000",
    cover:
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2000",
    availability: "Available for Hire",
  });

  const [skills, setSkills] = useState([
    "React.js",
    "Java",
    "Android SDK",
    "Firebase",
    "Tailwind CSS",
    "Node.js",
    "SQL",
  ]);

  const [newSkill, setNewSkill] = useState("");

  // -- Handlers --
  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (e) => {
    if (e.key === "Enter" && newSkill.trim()) {
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    if (!isEditMode) return;
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Welcome Section */}
      <WelcomeHeader name={profile.name} isEditMode={isEditMode} />

      {/* 2. Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (Identity) - Spans 8 cols on large screens */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Identity Card */}
          <IdentityCard
            profile={profile}
            isEditMode={isEditMode}
            onChange={handleProfileChange}
          />

          {/* B. Metrics & Skills Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsWidget />
            <SkillsWidget
              skills={skills}
              isEditMode={isEditMode}
              newSkill={newSkill}
              setNewSkill={setNewSkill}
              onAddSkill={handleAddSkill}
              onRemoveSkill={removeSkill}
            />
          </div>
        </div>

        {/* RIGHT COLUMN (Analytics & Activity) - Spans 4 cols on large screens */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* C. Analytics Chart */}
          <AnalyticsCard />

          {/* D. Activity Feed */}
          <ActivityFeed />

          {/* E. Quick Actions (Only visible in Edit Mode) */}
          {isEditMode && <QuickActions />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Welcome Header
// ============================================================================
const WelcomeHeader = ({ name, isEditMode }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
      <div>
        <div className="flex items-center gap-2 text-orange-500 mb-1">
          <Zap size={16} className="animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase">
            System Online
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {getGreeting()},{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            {name.split(" ")[0]}
          </span>
          .
        </h1>
        <p className="text-gray-400 mt-2 max-w-xl">
          Here is what's happening with your portfolio today. You have{" "}
          <span className="text-white font-semibold">12 new visitors</span> this
          week.
        </p>
      </div>

      {isEditMode && (
        <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-lg flex items-center gap-3 animate-pulse">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-orange-500 text-sm font-semibold">
            Editing Enabled
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Identity Card (The Big Profile Card)
// ============================================================================
const IdentityCard = ({ profile, isEditMode, onChange }) => {
  return (
    <div className="relative group bg-[#0B1120] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Cover Image */}
      <div className="h-48 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B1120] z-10" />
        <img
          src={profile.cover}
          alt="Cover"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {isEditMode && (
          <button className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-orange-600 transition-colors border border-white/10">
            <Camera size={18} />
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative z-20 px-8 pb-8 -mt-16 flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl border-4 border-[#0B1120] overflow-hidden shadow-2xl bg-[#020617]">
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {isEditMode && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent">
              <Camera className="text-white" size={24} />
            </div>
          )}
          {/* Status Dot */}
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#0B1120] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B1120] animate-pulse"></div>
          </div>
        </div>

        {/* Info Fields */}
        <div className="flex-1 w-full pt-14 md:pt-16 space-y-4">
          {/* Top Row: Name & Role */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1 flex-1">
              {isEditMode ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="text-3xl font-bold text-white bg-white/5 border border-white/10 rounded px-2 py-1 w-full focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <h2 className="text-3xl font-bold text-white">
                  {profile.name}
                </h2>
              )}

              {isEditMode ? (
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  className="text-orange-500 font-medium bg-white/5 border border-white/10 rounded px-2 py-0.5 w-full md:w-1/2 focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <p className="text-orange-500 font-medium flex items-center gap-2">
                  <Briefcase size={16} /> {profile.role}
                </p>
              )}
            </div>

            {/* Social Links (Mock) */}
            <div className="flex items-center gap-3">
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
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-300 focus:border-orange-500 focus:outline-none resize-none"
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
            />
            <InfoItem
              icon={<Mail size={16} />}
              text={profile.email}
              isEditMode={isEditMode}
            />
            <InfoItem
              icon={<Globe size={16} />}
              text={profile.website}
              isEditMode={isEditMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Identity Card
const InfoItem = ({ icon, text, isEditMode }) => (
  <div className="flex items-center gap-2 text-sm text-gray-500">
    <span className="text-orange-500/70">{icon}</span>
    {isEditMode ? (
      <input
        className="bg-transparent border-b border-white/10 text-gray-300 w-32 focus:border-orange-500 focus:outline-none"
        value={text}
        readOnly
      />
    ) : (
      <span>{text}</span>
    )}
  </div>
);

const SocialIcon = ({ icon }) => (
  <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-orange-600 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20">
    {icon}
  </button>
);

// ============================================================================
// SUB-COMPONENT: Stats Widget (Views/Projects/Etc)
// ============================================================================
const StatsWidget = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatBox
        label="Total Views"
        value="2,543"
        trend="+12%"
        isPositive={true}
        icon={<Users size={20} />}
        delay={100}
      />
      <StatBox
        label="Projects"
        value="12"
        trend="+1"
        isPositive={true}
        icon={<Briefcase size={20} />}
        delay={200}
      />
      <StatBox
        label="Appreciation"
        value="845"
        trend="+5%"
        isPositive={true}
        icon={<Award size={20} />}
        delay={300}
      />
      <StatBox
        label="Hours Coded"
        value="1,204"
        trend="Active"
        isPositive={true}
        icon={<Activity size={20} />}
        delay={400}
      />
    </div>
  );
};

const StatBox = ({ label, value, trend, isPositive, icon, delay }) => (
  <div
    className="bg-[#0B1120] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-colors group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-orange-500 transition-colors">
        {icon}
      </div>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          isPositive
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        }`}
      >
        {trend}
      </span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-white mb-0.5">{value}</h3>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </p>
    </div>
  </div>
);

// ============================================================================
// SUB-COMPONENT: Skills Widget
// ============================================================================
const SkillsWidget = ({
  skills,
  isEditMode,
  newSkill,
  setNewSkill,
  onAddSkill,
  onRemoveSkill,
}) => {
  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Cpu size={18} className="text-orange-500" />
          Tech Stack
        </h3>
        <span className="text-xs text-gray-500">{skills.length} Skills</span>
      </div>

      <div className="flex-1 content-start flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <div
            key={index}
            className={`
              relative group px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${
                isEditMode
                  ? "bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-500 border border-white/10 hover:border-red-500/30 cursor-pointer pr-8"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }
            `}
            onClick={() => onRemoveSkill(skill)}
          >
            {skill}
            {isEditMode && (
              <X
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50"
              />
            )}
          </div>
        ))}

        {isEditMode && (
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={onAddSkill}
            placeholder="+ Add skill"
            className="px-3 py-1.5 rounded-md text-sm bg-transparent border border-dashed border-gray-600 text-gray-400 focus:border-orange-500 focus:text-white focus:outline-none w-24 focus:w-auto transition-all"
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Analytics Card (Custom SVG Chart)
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
// SUB-COMPONENT: Activity Feed
// ============================================================================
const ActivityFeed = () => {
  return (
    <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl flex-1">
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
    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-xl text-white shadow-xl shadow-orange-900/20">
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

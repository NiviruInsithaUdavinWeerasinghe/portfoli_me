import React, { useState } from "react";
import {
  ArrowRight,
  Code,
  Layers,
  Share2,
  Sparkles,
  Monitor,
  CheckCircle,
  Github,
  Linkedin,
  Briefcase,
  ExternalLink,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Mail, // Added for Google/Email
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Added

function Home() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth(); // Get auth state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // New state to dynamically change the shutter text (LOGIN vs START)
  const [transitionLetters, setTransitionLetters] = useState([
    "L",
    "O",
    "G",
    "I",
    "N",
  ]);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigation = (path) => {
    // Set the transition text based on where the user is going
    if (path === "/register") {
      setTransitionLetters(["S", "T", "A", "R", "T"]);
    } else {
      setTransitionLetters(["L", "O", "G", "I", "N"]);
    }

    setIsTransitioning(true);
    // Delay to allow the specific text to animate in before switching pages
    setTimeout(() => {
      navigate(path);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden flex flex-col relative">
      {/* --- ENTRY TRANSITION OVERLAY (Simple Fade In) --- */}
      <div
        className={`fixed inset-0 z-[150] bg-[#020617] pointer-events-none transition-opacity duration-1000 ease-out ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      ></div>

      {/* --- COOL CYBER SHUTTER TRANSITION (EXIT) --- */}
      <div className="fixed inset-0 z-[100] grid grid-cols-5 pointer-events-none">
        {transitionLetters.map((letter, i) => (
          <div
            key={i}
            className={`relative h-full bg-[#020617] border-r border-white/5 flex items-center justify-center transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isTransitioning ? "translate-y-0" : "-translate-y-full"
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {/* Login Character Animation (Neon Slam Effect) */}
            <span
              className={`text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isTransitioning
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-32 scale-0"
              }`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              {letter}
            </span>

            {/* Glowing Orange Edge at the bottom of the shutter */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
          </div>
        ))}
      </div>

      {/* --- INJECT CUSTOM ANIMATION STYLES --- */}
      <style>{`
        /* Hide Scrollbar (Prevent layout shift/conflict during transition) */
        ::-webkit-scrollbar {
          display: none;
        }
        html, body {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }

        @keyframes scrollVertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-vertical {
          animation: scrollVertical 20s linear infinite;
        }
        /* Pause animation on hover for better UX */
        .group:hover .animate-scroll-vertical {
          animation-play-state: paused;
        }
      `}</style>

      {/* --- CONTENT WRAPPER (Grid applies here) --- */}
      <div className="relative flex-1">
        {/* BACKGROUND GRID: Covers full content height, stops at footer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a0a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* --- FLOATING HEADER --- */}
        <div className="fixed top-6 left-0 right-0 flex justify-center z-50 px-4">
          <nav className="flex items-center justify-between w-full max-w-5xl bg-[#0B1120]/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-2xl">
            <div
              className="text-xl font-bold tracking-tighter cursor-pointer flex items-center gap-2"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-900/20">
                P
              </div>
              <span className="text-gray-200">
                Portfoli<span className="text-amber-500">Me</span>
              </span>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
              <button className="hover:text-white transition-colors">
                Features
              </button>
              <button className="hover:text-white transition-colors">
                Templates
              </button>
              <button className="hover:text-white transition-colors">
                Pricing
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium relative">
              {currentUser ? (
                /* --- LOGGED IN: PROFILE DROPDOWN --- */
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 pr-3 pl-2 py-1.5 rounded-full hover:bg-white/10 transition-all group"
                  >
                    {/* Check if user has a photoURL, otherwise fallback to Initials */}
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border border-white/10 shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {currentUser.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}

                    <ChevronDown
                      size={16}
                      className={`text-gray-400 group-hover:text-white transition-transform duration-300 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-4 w-72 bg-[#0B1120] border border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-2 z-[60] animate-in fade-in slide-in-from-top-2 ring-1 ring-white/5">
                      {/* --- User Info Card --- */}
                      <div className="bg-white/5 rounded-xl p-5 mb-4 border border-white/5 flex items-center justify-between gap-4">
                        <div className="overflow-hidden flex-1">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5">
                            Signed in as
                          </p>
                          <p
                            className="text-sm font-bold text-white truncate"
                            title={currentUser.email}
                          >
                            {/* Check if logged in via Twitter (X), show name instead of email */}
                            {currentUser.providerData?.some(
                              (p) => p.providerId === "twitter.com"
                            )
                              ? currentUser.displayName
                              : currentUser.email}
                          </p>
                        </div>

                        {/* Service Icon Display */}
                        <div className="shrink-0 p-2.5 bg-white/5 rounded-lg border border-white/5 text-gray-300 flex items-center justify-center">
                          {currentUser.providerData?.some(
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
                          ) : currentUser.providerData?.some(
                              (p) => p.providerId === "github.com"
                            ) ? (
                            <Github size={20} />
                          ) : currentUser.providerData?.some(
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

                      {/* --- Menu Items --- */}
                      <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group">
                          <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
                            <User size={18} className="text-blue-500" />
                          </div>
                          Profile
                        </button>

                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 text-left group">
                          <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors border border-orange-500/10">
                            <Settings size={18} className="text-orange-500" />
                          </div>
                          Settings
                        </button>
                      </div>

                      <div className="h-px bg-white/5 my-2 mx-2"></div>

                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 text-left group"
                      >
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors border border-red-500/10">
                          <LogOut size={18} />
                        </div>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* --- LOGGED OUT: LOGIN BUTTONS --- */
                <>
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation("/register")}
                    className="bg-amber-600 text-white px-5 py-2 rounded-full hover:bg-orange-500 transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-95"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* --- HERO SECTION --- */}
        <main className="relative pt-32 pb-10 px-4 flex flex-col items-center text-center max-w-7xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8 hover:bg-white/10 transition-colors cursor-default">
            <Sparkles size={12} className="text-orange-400" />
            <span>v1.0 • Now in Public Beta</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-5xl leading-[1.1] text-white">
            Build a Professional Portfolio <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
              Without Writing Code.
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
            Manage your projects, showcase your skills, and get a unique link to
            share with recruiters. Focus on your work, we'll handle the website.
          </p>

          {/* ONLY SHOW BUTTONS IF LOGGED IN */}
          {currentUser && (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12">
              <button
                onClick={() => navigate("/demo_user/home")} // Updated to match Login redirect
                className="bg-white text-black px-8 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/5"
              >
                Create Your Portfolio <ArrowRight size={18} />
              </button>
              <button
                onClick={() => {}} /* Linkless for now */
                className="px-8 py-3.5 rounded-xl font-bold text-gray-300 border border-white/10 hover:bg-white/5 hover:text-white transition-colors cursor-default"
              >
                View Live Demo
              </button>
            </div>
          )}
        </main>

        {/* --- SECTION 1: SKILLS --- */}
        <section className="py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-1">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                <Code className="text-orange-500" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Showcase Your <span className="text-orange-500">Skills</span> &
                Proficiency
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Don't just list keywords. Categorize your technical stack, set
                proficiency levels, and let recruiters see exactly what you
                bring to the table.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>One-click skill addition</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Auto-generated proficiency bars</span>
                </li>
              </ul>
            </div>

            <div className="order-2 relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <MockupFrame url="portfoli.me/edit/skills">
                <div className="p-8 bg-[#0B1120] min-h-[350px]">
                  <h3 className="text-white font-bold text-lg mb-6 flex justify-between items-center">
                    My Tech Stack
                    <button className="text-xs bg-orange-600 px-3 py-1 rounded-md text-white hover:bg-orange-500">
                      + Add New
                    </button>
                  </h3>
                  <div className="space-y-6">
                    {/* Category 1 */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-3">
                        Frontend Development
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <SkillBadge
                          name="React.js"
                          level="90%"
                          color="bg-blue-500"
                        />
                        <SkillBadge
                          name="Tailwind CSS"
                          level="95%"
                          color="bg-cyan-400"
                        />
                        <SkillBadge
                          name="Next.js"
                          level="80%"
                          color="bg-white"
                        />
                        <SkillBadge
                          name="TypeScript"
                          level="75%"
                          color="bg-blue-600"
                        />
                      </div>
                    </div>
                    {/* Category 2 */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-3 mt-2">
                        Backend & Database
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <SkillBadge
                          name="Node.js"
                          level="85%"
                          color="bg-green-500"
                        />
                        <SkillBadge
                          name="Firebase"
                          level="70%"
                          color="bg-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </MockupFrame>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: EXPERIENCE (AUTO SCROLLING) --- */}
        <section className="py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Mockup Window with Infinite Scroll */}
            <div className="order-2 lg:order-1 relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-l from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <MockupFrame url="portfoli.me/edit/experience">
                <div className="p-6 sm:p-8 bg-[#0B1120] h-[350px] relative overflow-hidden group">
                  {/* Gradient Masks for Smooth Scrolling */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0B1120] to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0B1120] to-transparent z-20 pointer-events-none"></div>

                  {/* Timeline Line (Static background) */}
                  <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-0.5 bg-white/10 z-0"></div>

                  {/* Auto Scrolling Content */}
                  <AutoScroll>
                    {/* Experience Item 1 */}
                    <ExperienceItem
                      role="Senior Frontend Dev"
                      company="TechCorp Inc."
                      date="2023 - Present"
                      desc="Led the migration to React 18 and improved site performance by 40%."
                      color="bg-green-500"
                    />
                    {/* Experience Item 2 */}
                    <ExperienceItem
                      role="Web Developer Intern"
                      company="StartUp Studio"
                      date="2021 - 2023"
                      desc="Collaborated with designers to implement new UI features and animations."
                      color="bg-blue-500"
                    />
                    {/* Experience Item 3 (Added for length) */}
                    <ExperienceItem
                      role="Junior Designer"
                      company="Creative Flow"
                      date="2020 - 2021"
                      desc="Designed mockups and prototypes for mobile applications using Figma."
                      color="bg-purple-500"
                    />
                    {/* Experience Item 4 (Added for length) */}
                    <ExperienceItem
                      role="Freelance Dev"
                      company="Self Employed"
                      date="2019 - 2020"
                      desc="Built custom WordPress themes and React landing pages for local clients."
                      color="bg-orange-500"
                    />
                  </AutoScroll>
                </div>
              </MockupFrame>
            </div>

            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20">
                <Briefcase className="text-green-500" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Track Your <span className="text-green-500">Journey</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Your career isn't just a list of dates. Create a visual timeline
                of your work history, internships, and education.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-orange-500" />
                  <span>Beautiful timeline layout</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-orange-500" />
                  <span>Add company logos & descriptions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: PROJECTS (AUTO SCROLLING) --- */}
        <section className="py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-1">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                <Layers className="text-blue-500" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Let Your Work <span className="text-blue-500">Speak</span> For
                Itself
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Upload images, embed videos, or link to GitHub repositories. Our
                project editor is designed to handle detailed case studies or
                quick visual showcases.
              </p>
              <button className="text-blue-400 hover:text-white font-medium flex items-center gap-2 transition-colors">
                Explore Templates <ArrowRight size={16} />
              </button>
            </div>

            <div className="order-2 relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-l from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <MockupFrame url="portfoli.me/projects">
                <ProjectsMockupContent />
              </MockupFrame>
            </div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Everything else you need
              </h2>
              <p className="text-gray-400">
                We've thought of the little things so you don't have to.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Monitor size={32} className="text-orange-500" />}
                title="Responsive Design"
                desc="Your portfolio looks perfect on phones, tablets, and desktops automatically."
              />
              <FeatureCard
                icon={<Sparkles size={32} className="text-orange-500" />}
                title="Dark & Light Mode"
                desc="Switch themes with one click. Your content adapts automatically."
              />
              <FeatureCard
                icon={<Share2 size={32} className="text-orange-500" />}
                title="SEO Optimized"
                desc="We structure your data so Google can find your portfolio easily."
              />
            </div>
          </div>
        </section>
      </div>
      {/* --- END OF CONTENT WRAPPER --- */}

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="bg-[#020617] pt-16 pb-8 text-sm relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
                P
              </div>
              <span className="font-bold text-lg text-white">
                Portfoli<span className="text-orange-500">Me</span>
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              The easiest way for developers to build a professional presence
              online.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-gray-500">
              <li className="hover:text-orange-500 cursor-pointer">
                Templates
              </li>
              <li className="hover:text-orange-500 cursor-pointer">Features</li>
              <li className="hover:text-orange-500 cursor-pointer">Pricing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-500">
              <li className="hover:text-orange-500 cursor-pointer">About Us</li>
              <li className="hover:text-orange-500 cursor-pointer">Careers</li>
              <li className="hover:text-orange-500 cursor-pointer">Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-500">
              <li className="hover:text-orange-500 cursor-pointer">
                Privacy Policy
              </li>
              <li className="hover:text-orange-500 cursor-pointer">
                Terms of Service
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600">
          <p>&copy; {new Date().getFullYear()} PortfoliMe.</p>

          <div className="flex gap-4">
            <a
              href="https://github.com/NiviruInsithaUdavinWeerasinghe"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-white cursor-pointer flex items-center justify-center transition-all duration-300"
            >
              <Github size={16} />
            </a>
            <a
              href="https://www.linkedin.com/in/niviru-i-u-weerasinghe-107b75350/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600/20 hover:text-blue-500 cursor-pointer flex items-center justify-center transition-all duration-300"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- HELPER COMPONENTS ---

// 1. AutoScroll Component (Logic for infinite loop)
function AutoScroll({ children }) {
  return (
    <div className="animate-scroll-vertical">
      <div className="space-y-4 pb-4">{children}</div>
      {/* Duplicate content for seamless loop */}
      <div className="space-y-4 pb-4">{children}</div>
    </div>
  );
}

// 2. Mockup Frame
function MockupFrame({ children, url }) {
  return (
    <div className="relative bg-[#0B1120] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-left">
      <div className="bg-[#0f172a] border-b border-white/5 p-3 flex items-center gap-4 relative z-30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <div className="ml-2 bg-black/40 px-3 py-1 rounded text-[10px] text-gray-500 font-mono flex-1 text-center border border-white/5 flex items-center justify-center gap-2">
          <span className="text-green-500">🔒</span> {url}
        </div>
      </div>
      {children}
    </div>
  );
}

// 3. Experience Item Component
function ExperienceItem({ role, company, date, desc, color }) {
  return (
    <div className="flex gap-4 relative z-10">
      <div
        className={`w-5 h-5 rounded-full ${color} border-4 border-[#0B1120] mt-1 flex-shrink-0 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
      ></div>
      <div className="flex-1 min-w-0 bg-[#1e293b]/20 p-3 rounded-lg border border-white/5 hover:bg-[#1e293b]/40 transition-colors">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
          <h4 className="text-white font-bold text-sm truncate">{role}</h4>
          <span className="text-gray-500 text-[10px] sm:text-xs">{date}</span>
        </div>
        <p className="text-gray-400 text-xs mb-2 font-medium">{company}</p>
        <p className="text-xs text-gray-300 leading-relaxed opacity-80">
          {desc}
        </p>
      </div>
    </div>
  );
}

// 4. Project Card Component
function ProjectCard({ title, desc, tags, color, gradient }) {
  const bgColor = color.replace("bg-", ""); // simple hack to reuse color prop
  return (
    <div className="bg-[#1e293b]/30 border border-white/5 rounded-lg p-4 flex gap-4 hover:border-white/20 transition-colors group/card cursor-pointer">
      <div
        className={`w-16 h-16 rounded-md bg-gradient-to-br ${gradient} flex-shrink-0 border border-white/10 group-hover/card:border-white/30 transition-colors shadow-lg`}
      ></div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-white mb-1 truncate">{title}</h4>
          <ExternalLink
            size={12}
            className="text-gray-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
          />
        </div>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{desc}</p>
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${color}`}></span>{" "}
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. Skill Badge Component
function SkillBadge({ name, level, color }) {
  return (
    <div className="group/badge bg-white/5 border border-white/5 rounded-lg p-2.5 flex flex-col gap-2 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex justify-between items-center">
        <span className="text-white text-xs font-medium">{name}</span>
        <div
          className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_currentColor] opacity-40 group-hover/badge:opacity-100 group-hover/badge:animate-pulse transition-all duration-300`}
        ></div>
      </div>
      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: level }}></div>
      </div>
    </div>
  );
}

// 6. Feature Card Component
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="group p-8 bg-white/5 border border-white/5 rounded-2xl hover:border-orange-500/30 hover:bg-white/[0.07] transition-all duration-300">
      <div className="mb-6 p-3 bg-black/40 w-fit rounded-lg group-hover:scale-110 transition-transform duration-300 border border-white/10 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

// 7. Interactive Projects Mockup Component
function ProjectsMockupContent() {
  const [activeTab, setActiveTab] = React.useState("All");

  const projects = [
    {
      id: 1,
      title: "E-Commerce Dashboard",
      category: "Web Apps",
      desc: "A full-stack admin panel with real-time analytics.",
      tags: ["React", "Firebase"],
      color: "bg-blue-500",
      gradient: "from-blue-900 to-slate-800",
    },
    {
      id: 2,
      title: "Smart Gym Tracker",
      category: "IoT",
      desc: "IoT based solution for gym equipment tracking.",
      tags: ["IoT", "C++"],
      color: "bg-teal-500",
      gradient: "from-teal-900/50 to-emerald-900/50",
    },
    {
      id: 3,
      title: "Travel Companion",
      category: "Mobile",
      desc: "Mobile application for itinerary planning and maps.",
      tags: ["Flutter", "Dart"],
      color: "bg-orange-500",
      gradient: "from-orange-900/50 to-amber-900/50",
    },
    {
      id: 4,
      title: "Recipe Finder",
      category: "Web Apps",
      desc: "Search over 10k recipes using external APIs.",
      tags: ["Vue.js", "API"],
      color: "bg-green-500",
      gradient: "from-green-900/50 to-emerald-900/50",
    },
    {
      id: 5,
      title: "Finance Tracker",
      category: "Mobile",
      desc: "Personal finance management with charts.",
      tags: ["React Native"],
      color: "bg-cyan-500",
      gradient: "from-cyan-900/50 to-blue-900/50",
    },
  ];

  const filteredProjects =
    activeTab === "All"
      ? projects
      : projects.filter(
          (p) =>
            p.category === activeTab ||
            (activeTab === "Mobile" && p.category === "Mobile") ||
            (activeTab === "Web Apps" && p.category === "Web Apps")
        );

  return (
    <div className="p-6 bg-[#0B1120] h-[380px] flex flex-col">
      {/* Header Tabs */}
      <div className="flex gap-6 mb-6 border-b border-white/5 pb-2">
        {["All", "Web Apps", "Mobile"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium pb-2 transition-colors relative ${
              activeTab === tab
                ? "text-orange-500"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {tab === "All" ? "All Projects" : tab}
            {activeTab === tab && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-orange-500"></span>
            )}
          </button>
        ))}
      </div>

      {/* Projects Grid (Scrollable container with hidden scrollbar) */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="space-y-3 overflow-y-auto h-full pr-2 pb-10"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Hide scrollbar for Webkit browsers */}
          <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              desc={project.desc}
              tags={project.tags}
              color={project.color}
              gradient={project.gradient}
            />
          ))}
        </div>
        {/* Fade at bottom to indicate scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}

export default Home;

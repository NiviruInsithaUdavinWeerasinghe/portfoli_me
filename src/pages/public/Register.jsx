//C:\PortfoliMe\portfoli_me\src\pages\public\Register.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import OnboardingModal from "../../modals/OnboardingModal";
import ErrorModal from "../../modals/ErrorModal";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, X } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { signup, googleSignIn, githubSignIn, twitterSignIn, currentUser } =
    useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  // --- SOCIAL LOGIN HANDLERS (Reused) ---
  const handleSocialLogin = async (providerSignIn, providerName) => {
    setIsLoading(true);
    try {
      const result = await providerSignIn();
      const user = result.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const redirectPath = sessionStorage.getItem("login_redirect_to");
        if (redirectPath) {
          sessionStorage.removeItem("login_redirect_to");
          navigate(redirectPath);
        } else {
          // UPDATED: Check for username, fallback to uid
          const identifier = data.username || user.uid;
          navigate(`/${identifier}/overview`);
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error(`${providerName} Sign In Failed`, error);
      setErrorModal({
        show: true,
        title: "Authentication Error",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EMAIL REGISTER HANDLER ---
  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorModal({
        show: true,
        title: "Password Mismatch",
        message: "The passwords you entered do not match.",
      });
      return;
    }

    if (formData.password.length < 6) {
      setErrorModal({
        show: true,
        title: "Weak Password",
        message: "Password should be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await signup(formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create Placeholder Firestore Document immediately
      // This prevents "No profile" issues later
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        uid: user.uid,
        setupComplete: false,
      });

      // 3. Show Onboarding
      setShowOnboarding(true);
    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = error.message;
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in.";
      }
      setErrorModal({
        show: true,
        title: "Registration Failed",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Accept savedUsername to redirect correctly
  const handleOnboardingComplete = (savedUsername) => {
    setShowOnboarding(false);
    const redirectPath = sessionStorage.getItem("login_redirect_to");
    if (redirectPath) {
      sessionStorage.removeItem("login_redirect_to");
      navigate(redirectPath);
    } else if (currentUser?.uid) {
      // Use the username returned from modal, or fallback to UID
      const identifier = savedUsername || currentUser.uid;
      navigate(`/${identifier}/overview`);
    }
  };

  const handleHomeNavigation = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <div className="h-screen bg-[#00030f] text-white font-sans selection:bg-orange-500 selection:text-white flex items-center justify-center overflow-hidden relative p-4 lg:p-[80px]">
      {/* --- EXIT TRANSITION --- */}
      <div
        className={`fixed inset-0 z-[200] bg-[#020617] pointer-events-none transition-opacity duration-700 ease-in-out ${
          isExiting ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* --- CYBER SHUTTER (Using "START" for 5 cols) --- */}
      <div className="fixed inset-0 z-[100] grid grid-cols-5 pointer-events-none">
        {["S", "T", "A", "R", "T"].map((letter, i) => (
          <div
            key={i}
            className="relative h-full bg-[#020617] border-r border-white/5 animate-shutter-reveal flex items-center justify-center"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_30px_rgba(234,88,12,0.5)]">
              {letter}
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
          </div>
        ))}
      </div>

      {/* Animations CSS (Injected) */}
      <style>{`
        @keyframes shutterReveal {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        .animate-shutter-reveal {
          animation: shutterReveal 0.8s cubic-bezier(0.8, 0, 0.2, 1) forwards;
        }

        @keyframes float-random {
          0% { transform: translate(0, 0); }
          20% { transform: translate(80px, -40px); }
          40% { transform: translate(-60px, 60px); }
          60% { transform: translate(40px, 90px); }
          80% { transform: translate(-80px, -30px); }
          100% { transform: translate(0, 0); }
        }
        .animate-float-random {
          animation: float-random 15s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Close Button */}
      <button
        onClick={handleHomeNavigation}
        className="absolute top-6 right-6 z-50 w-12 h-12 bg-[#0B1120]/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-orange-600 hover:border-orange-500 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] group"
      >
        <X
          size={24}
          className="group-hover:rotate-90 transition-transform duration-300"
        />
      </button>

      {/* Main Card */}
      <div className="w-full max-w-[1200px] lg:aspect-video relative flex flex-col lg:flex-row overflow-hidden border border-orange-500/20 rounded-3xl shadow-2xl bg-[#020617]">
        {/* LEFT SIDE (Branding) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-[#0B1120]">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2940&auto=format&fit=crop"
              alt="Coding setup"
              className="w-full h-full object-cover opacity-50 scale-105 transition-transform duration-[2s] hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-orange-900/30 mix-blend-multiply"></div>
          </div>

          <div className="relative z-10 p-16 flex flex-col h-full justify-between">
            <div
              className="inline-flex items-center gap-3 cursor-pointer self-start"
              onClick={handleHomeNavigation}
            >
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-900/20">
                P
              </div>
              <span className="text-2xl font-bold text-gray-100 tracking-tight">
                Portfoli<span className="text-orange-500">Me</span>
              </span>
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Join the future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  Digital Portfolios.
                </span>
              </h2>
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                Create, customize, and showcase your work like never before.
                Start your journey today.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} PortfoliMe. All rights reserved.
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (Register Form) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
          {/* Mobile BG */}
          <div className="absolute inset-0 bg-[#0B1120] lg:hidden z-0"></div>

          <div className="w-full max-w-xl z-10 bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden group/card transition-all duration-500 hover:shadow-blue-900/20 hover:border-blue-500/30">
            {/* Gradient Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-50 group-hover/card:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px] animate-float-random pointer-events-none mix-blend-screen"></div>

            {/* Mobile Header */}
            <div className="text-center mb-6 lg:hidden relative z-10">
              <span className="text-xl font-bold text-gray-100">
                Portfoli<span className="text-orange-500">Me</span>
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-400 text-sm">
                Already a member?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-orange-500 hover:text-orange-400 font-medium hover:underline transition-all"
                >
                  Sign in now
                </button>
              </p>
            </div>

            <div className="space-y-4 relative z-10">
              {/* Social Login Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin(googleSignIn, "Google")}
                  className="group relative w-full bg-[#020617] border border-white/10 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-[0.98] flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-all duration-500 ease-out group-hover:w-full"></div>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin(githubSignIn, "GitHub")}
                  className="group relative w-full bg-[#020617] border border-white/10 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-[0.98] flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent transition-all duration-500 ease-out group-hover:w-full"></div>
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin(twitterSignIn, "Twitter")}
                  className="group relative w-full bg-[#020617] border border-white/10 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-[0.98] flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-white to-transparent transition-all duration-500 ease-out group-hover:w-full"></div>
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full">
                <div className="h-[1px] bg-white/10 flex-1"></div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Or register with email
                </span>
                <div className="h-[1px] bg-white/10 flex-1"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">
                    Email Address
                  </label>
                  <div className="relative group bg-[#020617] rounded-xl border border-white/10 transition-all duration-500 hover:border-white/20">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors duration-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 transition-all duration-500"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent transition-all duration-700 ease-out group-focus-within:w-full"></div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">
                    Password
                  </label>
                  <div className="relative group bg-[#020617] rounded-xl border border-white/10 transition-all duration-500 hover:border-white/20">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors duration-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 transition-all duration-500"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent transition-all duration-700 ease-out group-focus-within:w-full"></div>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group bg-[#020617] rounded-xl border border-white/10 transition-all duration-500 hover:border-white/20">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors duration-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 transition-all duration-500"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent transition-all duration-700 ease-out group-focus-within:w-full"></div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.2)] hover:shadow-[0_0_25px_rgba(234,88,12,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Creating
                      Account...
                    </>
                  ) : (
                    <>
                      Sign Up <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingModal
          user={currentUser}
          onComplete={handleOnboardingComplete}
        />
      )}
      {errorModal.show && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, show: false })}
        />
      )}
    </div>
  );
}

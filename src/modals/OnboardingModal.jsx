import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase"; // Ensure path is correct based on your structure
import {
  User,
  Briefcase,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function OnboardingModal({ user, onComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    role: "", // e.g., "Full Stack Developer"
    bio: "",
  });

  // Pre-fill data from Google Auth
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save to Firestore 'users' collection
      // We use setDoc with merge: true to create or update
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: formData.displayName,
          role: formData.role,
          bio: formData.bio,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
          // Only set createdAt if it doesn't exist (handled by merge logic usually,
          // but for simple onboarding we just write current details)
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Trigger the navigation in parent
      onComplete();
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm transition-opacity duration-300"></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-content-slide">
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              {/* User Avatar from Google or Placeholder */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-orange-500">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-1.5 rounded-full border border-[#0B1120]">
                <Sparkles size={14} fill="white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Almost there!</h2>
              <p className="text-gray-400 text-sm">
                Let's set up your professional profile.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Full Name
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Role / Job Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Professional Role
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <Briefcase size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. UX Designer, Student, Frontend Dev"
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Bio / Short Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Short Bio
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-4 text-gray-500 group-focus-within:text-orange-500">
                  <FileText size={18} />
                </div>
                <textarea
                  rows="3"
                  placeholder="Tell us a little about yourself..."
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Saving
                  Profile...
                </>
              ) : (
                <>
                  Complete Setup <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

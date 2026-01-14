import React, { useState, useEffect } from "react";
import axios from "axios";
// UPDATED: Added collection, query, where, getDocs for username check
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { encryptData } from "../lib/secureStorage"; // Import Encryption
import {
  User,
  Briefcase,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
  Github,
  Key,
  ExternalLink,
  Globe,
  Lock,
  AlertCircle,
  Camera, // Added Camera Icon
} from "lucide-react";

export default function OnboardingModal({ user, onComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false); // Added for upload state
  const [error, setError] = useState(""); // New Error State
  const [formData, setFormData] = useState({
    displayName: "",
    username: "", // UPDATED: Added username field
    role: "",
    bio: "",
    githubToken: "",
    githubUsername: "",
    isPublic: true,
    photoURL: "",
  });

  // UPDATED: Username Validation State
  const [usernameStatus, setUsernameStatus] = useState("idle"); // idle, checking, available, taken, error

  // UPDATED: Check Username Availability
  const checkUsername = async (username) => {
    if (username.length < 3) {
      setUsernameStatus("error");
      return;
    }
    // Allow only alphanumeric, underscores, hyphens
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(username)) {
      setUsernameStatus("invalid_char");
      return;
    }

    setUsernameStatus("checking");
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUsernameStatus("taken");
      } else {
        setUsernameStatus("available");
      }
    } catch (err) {
      console.error("Username check failed", err);
      setUsernameStatus("error");
    }
  };

  // Pre-fill data & Restore from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem("onboarding_draft");

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Restore draft if exists
      setFormData((prev) => ({
        ...prev,
        ...parsedData,
        email: user?.email || prev.email, // Always ensure email matches current auth
        // FIX: If local draft has no photo but GitHub User does, use the GitHub photo
        photoURL: parsedData.photoURL || user?.photoURL || "",
      }));
    } else if (user) {
      // Otherwise use Auth defaults
      setFormData((prev) => ({
        ...prev,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "", // Initialize with auth photo
      }));
    }
  }, [user]);

  // New Handler for Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsImageUploading(true);
      const uploadedData = await uploadFileToCloudinary(file);
      setFormData((prev) => ({ ...prev, photoURL: uploadedData.url }));
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsImageUploading(false);
    }
  };

  // Save to LocalStorage on change & Unsaved Changes Warning
  useEffect(() => {
    localStorage.setItem("onboarding_draft", JSON.stringify(formData));

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let authenticatedUsername = "";

    // 1. Validate GitHub Token AND Get the Username associated with it
    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${formData.githubToken}` },
      });
      // The token is valid, and we get the actual username of the token owner
      authenticatedUsername = response.data.login;
    } catch (error) {
      console.error("GitHub Token Validation Failed:", error);
      setError(
        "The GitHub Token provided is invalid. Please check and try again."
      );
      setIsLoading(false);
      return;
    }

    // 2. Compare Token Owner vs. Entered Username
    const targetUsername = formData.githubUsername.trim() || user.displayName;

    // Check if the typed username matches the Token's owner (Case insensitive)
    if (authenticatedUsername.toLowerCase() !== targetUsername.toLowerCase()) {
      // FIX: Generic error message that doesn't reveal the token owner
      setError(
        `The GitHub Token provided does not match the username "${targetUsername}". Please ensure the token belongs to the account you are trying to link.`
      );
      setIsLoading(false);
      return;
    }

    // 3. Save Data
    if (usernameStatus !== "available") {
      setError("Please choose a valid and available username.");
      setIsLoading(false);
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          username: formData.username, // UPDATED: Saving username
          displayName: formData.displayName,
          role: formData.role,
          bio: formData.bio,
          isPublic: formData.isPublic,
          photoURL: formData.photoURL || user.photoURL,
          githubToken: encryptData(formData.githubToken),
          githubUsername: authenticatedUsername,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          setupComplete: true,
        },
        { merge: true }
      );

      // Clear draft on success
      localStorage.removeItem("onboarding_draft");
      // UPDATED: Pass the username back to the parent
      onComplete(formData.username);
    } catch (error) {
      console.error("Error saving user data:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // This URL pre-selects the scopes for the user
  const githubTokenUrl = `https://github.com/settings/tokens/new?description=PortfoliMe%20Access&scopes=repo,read:org,read:user,read:project`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Hide Scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm transition-opacity duration-300"></div>

      <div className="relative w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-content-slide max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group/avatar">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-[0_0_20px_rgba(234,88,12,0.2)] relative">
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt="Profile"
                    className={`w-full h-full object-cover transition-opacity ${
                      isImageUploading ? "opacity-50" : ""
                    }`}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-orange-500">
                    <User size={32} />
                  </div>
                )}

                {/* Loading Overlay */}
                {isImageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2
                      size={20}
                      className="animate-spin text-orange-500"
                    />
                  </div>
                )}

                {/* Upload Input Overlay */}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                  <Camera size={20} className="text-white drop-shadow-md" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isImageUploading}
                  />
                </label>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Almost there!</h2>
              <p className="text-gray-400 text-sm">
                Let's set up your professional profile.
              </p>
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <AlertCircle size={16} />
              </div>
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* UPDATED: Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1 flex justify-between">
                <span>Username (for your URL)</span>
                <span
                  className={`text-[10px] ${
                    usernameStatus === "available"
                      ? "text-green-500"
                      : usernameStatus === "taken"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {usernameStatus === "available" && "Available"}
                  {usernameStatus === "taken" && "Username taken"}
                  {usernameStatus === "invalid_char" && "Alphanumeric only"}
                  {usernameStatus === "checking" && "Checking..."}
                </span>
              </label>
              <div
                className={`relative group bg-[#020617] rounded-xl border transition-all duration-300 ${
                  usernameStatus === "taken"
                    ? "border-red-500/50"
                    : usernameStatus === "available"
                    ? "border-green-500/50"
                    : "border-white/10 focus-within:border-orange-500/50"
                }`}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <span className="text-xs">@</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="foryourcustomprofileurl"
                  value={formData.username}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\s/g, ""); // No spaces
                    setFormData({ ...formData, username: val });
                    if (val) checkUsername(val);
                  }}
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-8 pr-4 text-sm text-white focus:outline-none focus:ring-0 lowercase"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Full Name
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Enter display name"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Professional Role
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <Briefcase size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer"
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* GitHub Username */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">
                GitHub Username
              </label>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <Github size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Your GitHub username"
                  required
                  value={formData.githubUsername}
                  onChange={(e) =>
                    setFormData({ ...formData, githubUsername: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* GitHub Token Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-medium text-gray-400">
                  GitHub Personal Access Token
                </label>
                <a
                  href={githubTokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-orange-500 flex items-center gap-1 hover:underline"
                >
                  Generate Token <ExternalLink size={10} />
                </a>
              </div>
              <div className="relative group bg-[#020617] rounded-xl border border-white/10 focus-within:border-orange-500/50 transition-all duration-300">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  required
                  value={formData.githubToken}
                  onChange={(e) =>
                    setFormData({ ...formData, githubToken: e.target.value })
                  }
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-0"
                />
              </div>
              <p className="text-[10px] text-gray-500 px-1">
                Click "Generate Token" above, scroll down, click "Generate
                token", and paste it here.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-1">
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
                  // Added 'scrollbar-hide' to the end of the className list
                  className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-0 resize-none scrollbar-hide"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between bg-[#020617] p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    formData.isPublic
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {formData.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {formData.isPublic ? "Public Profile" : "Private Profile"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formData.isPublic
                      ? "Visible to everyone"
                      : "Only visible to you"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isPublic: !formData.isPublic })
                }
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  formData.isPublic ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                    formData.isPublic ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Saving...
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

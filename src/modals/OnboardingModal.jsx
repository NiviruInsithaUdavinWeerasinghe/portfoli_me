import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  doc,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { encryptData, decryptData } from "../lib/secureStorage";
import { fetchUserRepositories } from "../services/githubService";
import {
  User,
  Briefcase,
  FileText,
  ArrowRight,
  Loader2,
  Github,
  Key,
  ExternalLink,
  Globe,
  Lock,
  AlertCircle,
  Camera,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function OnboardingModal({ user, onComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    role: "",
    bio: "",
    githubToken: "",
    githubUsername: "",
    isPublic: true,
    photoURL: "",
  });

  // --- Lock State for Existing Users ---
  // Default is false (Editable). Only turns true if we confirm setupComplete is true.
  const [isExistingUser, setIsExistingUser] = useState(false);

  // --- GitHub Auto-Import State ---
  const [includeGithub, setIncludeGithub] = useState(false);
  const [repoList, setRepoList] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [autoSyncFuture, setAutoSyncFuture] = useState(false);

  // --- Handle Toggle & Fetch ---
  const handleToggleGithub = async () => {
    const newState = !includeGithub;
    setIncludeGithub(newState);

    // NEW: Clear any previous errors when the user clicks the toggle
    if (error) setError("");

    if (newState && formData.githubToken && repoList.length === 0) {
      await loadRepositories(formData.githubUsername, formData.githubToken);
    }
  };

  const loadRepositories = async (username, token) => {
    if (!username) return;
    setIsFetchingRepos(true);
    try {
      const repos = await fetchUserRepositories(username, token);
      setRepoList(repos || []);
    } catch (err) {
      console.error("Failed to load repos", err);
      // NEW: Set a specific error message
      setError(
        "Failed to connect to GitHub. Please check your Username and Token."
      );
      // NEW: Turn the toggle OFF and clear list since the connection failed
      setIncludeGithub(false);
      setRepoList([]);
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const toggleRepoSelection = (repoId) => {
    setSelectedRepos((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRepos.length === repoList.length) {
      setSelectedRepos([]);
    } else {
      setSelectedRepos(repoList.map((r) => r.id));
    }
  };

  // --- NEW: Reset GitHub State on Credential Change ---
  // If the user types/deletes characters in the Token or Username fields,
  // we immediately clear the loaded repos and turn off the toggle.
  // This forces a fresh fetch when they turn the toggle back on.
  useEffect(() => {
    setRepoList([]);
    setIncludeGithub(false);
    setSelectedRepos([]);
  }, [formData.githubToken, formData.githubUsername]);

  // --- Username Validation ---
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const checkUsername = async (username) => {
    if (username.length < 3) {
      setUsernameStatus("error");
      return;
    }
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

  // --- Fetch Existing Data ---
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) return;

      try {
        // 1. Check Database First
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // FIX: Only lock fields if setup is actually complete.
          // This allows "Register" flow (which creates a placeholder doc) to remain editable.
          if (data.setupComplete) {
            setIsExistingUser(true);
          }

          // Decrypt Token if present
          let decryptedToken = "";
          if (data.githubToken) {
            try {
              decryptedToken = decryptData(data.githubToken);
            } catch (e) {
              console.error("Token decryption failed", e);
            }
          }

          setFormData((prev) => ({
            ...prev,
            ...data,
            githubToken: decryptedToken,
          }));
        } else {
          // 2. Fallback to LocalStorage / Auth Default
          const savedData = localStorage.getItem("onboarding_draft");
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData((prev) => ({
              ...prev,
              ...parsedData,
              email: user.email || prev.email,
              photoURL: parsedData.photoURL || user.photoURL || "",
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              displayName: user.displayName || "",
              email: user.email || "",
              photoURL: user.photoURL || "",
            }));
          }
        }
      } catch (err) {
        console.error("Error loading user data", err);
      }
    };

    loadUserData();
  }, [user]);

  // Image Upload
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

  // Draft Saving
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

    // 1. Validate GitHub Token
    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${formData.githubToken}` },
      });
      authenticatedUsername = response.data.login;
    } catch (error) {
      console.error("GitHub Token Validation Failed:", error);
      setError(
        "The GitHub Token provided is invalid. Please check and try again."
      );
      setIsLoading(false);
      return;
    }

    // 2. Compare Token Owner
    const targetUsername = formData.githubUsername.trim() || user.displayName;
    if (authenticatedUsername.toLowerCase() !== targetUsername.toLowerCase()) {
      setError(
        `The GitHub Token provided does not match the username "${targetUsername}". Please ensure the token belongs to the account you are trying to link.`
      );
      setIsLoading(false);
      return;
    }

    // 3. Save Data
    // FIX: Only validate availability for NEW users (not existing locked ones)
    if (!isExistingUser && usernameStatus !== "available") {
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
          username: formData.username,
          displayName: formData.displayName,
          role: formData.role,
          bio: formData.bio,
          isPublic: formData.isPublic,
          photoURL: formData.photoURL || user.photoURL,
          githubToken: encryptData(formData.githubToken),
          githubUsername: authenticatedUsername,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          setupComplete: true, // MARK AS COMPLETE HERE
          githubConfigured: true,
          githubAutoInclude: includeGithub,
          githubAutoSyncFuture: autoSyncFuture,
        },
        { merge: true }
      );

      // Process Auto-Added Projects
      if (includeGithub && selectedRepos.length > 0) {
        const projectsRef = collection(db, "users", user.uid, "projects");
        const reposToSave = repoList.filter((r) =>
          selectedRepos.includes(r.id)
        );
        const batchPromises = reposToSave.map((repo) => {
          return addDoc(projectsRef, {
            title: repo.name,
            description: repo.description || "No description provided.",
            githubLink: repo.html_url,
            liveLink: repo.homepage || "",
            tags: repo.language ? [repo.language] : [],
            status: "Ongoing",
            createdAt: serverTimestamp(),
            hiddenBy: [user.uid],
            image: "",
            appreciation: 0,
            views: 0,
          });
        });
        await Promise.all(batchPromises);
      }

      localStorage.removeItem("onboarding_draft");
      onComplete(formData.username);
    } catch (error) {
      console.error("Error saving user data:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const githubTokenUrl = `https://github.com/settings/tokens/new?description=PortfoliMe%20Access&scopes=repo,read:org,read:user,read:project`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm transition-opacity duration-300"></div>

      <div className="relative w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-content-slide max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar Section */}
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
                {isImageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2
                      size={20}
                      className="animate-spin text-orange-500"
                    />
                  </div>
                )}
                {!isExistingUser && (
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                    <Camera size={20} className="text-white drop-shadow-md" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isImageUploading || isExistingUser}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isExistingUser ? "New Feature Alert!" : "Almost there!"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isExistingUser
                  ? "Connect GitHub to auto-sync your projects."
                  : "Let's set up your professional profile."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <AlertCircle size={16} />
              </div>
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) => {
                    const val = e.target.value.replace(/\s/g, "");
                    setFormData({ ...formData, username: val });
                    if (val) checkUsername(val);
                  }}
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-8 pr-4 text-sm focus:outline-none focus:ring-0 lowercase ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-0 ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-0 ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) =>
                    setFormData({ ...formData, githubUsername: e.target.value })
                  }
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-0 ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
                />
              </div>
            </div>

            {/* GitHub Token Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-medium text-gray-400">
                  GitHub Personal Access Token
                </label>
                {!isExistingUser && (
                  <a
                    href={githubTokenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-orange-500 flex items-center gap-1 hover:underline"
                  >
                    Generate Token <ExternalLink size={10} />
                  </a>
                )}
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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) =>
                    setFormData({ ...formData, githubToken: e.target.value })
                  }
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-0 ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
                />
              </div>
              {!isExistingUser && (
                <p className="text-[10px] text-gray-500 px-1">
                  Click "Generate Token" above, scroll down, click "Generate
                  token", and paste it here.
                </p>
              )}
            </div>

            {/* GitHub Auto-Include Toggle Section */}
            {formData.githubToken && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github size={18} className="text-blue-400" />
                    <span className="text-sm font-medium text-blue-100">
                      Include GitHub Repositories
                    </span>
                    {/* NEW Label only for Existing Users */}
                    {isExistingUser && (
                      <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGithub}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {includeGithub ? (
                      <ToggleRight size={32} />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                </div>

                {includeGithub && (
                  <div className="space-y-3 pt-2 border-t border-blue-500/20">
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                      <span>Select repositories to import:</span>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="hover:text-white transition-colors"
                      >
                        {selectedRepos.length === repoList.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {isFetchingRepos ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto pr-1 space-y-1 scrollbar-hide">
                        {repoList.map((repo) => {
                          const isSelected = selectedRepos.includes(repo.id);
                          return (
                            <div
                              key={repo.id}
                              onClick={() => toggleRepoSelection(repo.id)}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                                isSelected
                                  ? "bg-blue-500/20 border-blue-500/50"
                                  : "bg-black/20 border-transparent hover:bg-white/5"
                              }`}
                            >
                              <div
                                className={`text-blue-400 ${
                                  isSelected ? "opacity-100" : "opacity-30"
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare size={16} />
                                ) : (
                                  <Square size={16} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {repo.name}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {repo.description || "No description"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedRepos.length > 0 &&
                      selectedRepos.length === repoList.length && (
                        <div
                          onClick={() => setAutoSyncFuture(!autoSyncFuture)}
                          className="flex items-start gap-2 pt-2 cursor-pointer group"
                        >
                          <div
                            className={`mt-0.5 ${
                              autoSyncFuture
                                ? "text-orange-500"
                                : "text-gray-600 group-hover:text-gray-400"
                            }`}
                          >
                            {autoSyncFuture ? (
                              <CheckSquare size={14} />
                            ) : (
                              <Square size={14} />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            Automatically import future repositories (Saved as
                            hidden)
                          </p>
                        </div>
                      )}

                    <div className="bg-blue-500/10 p-2 rounded text-[10px] text-blue-200 flex gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <p>
                        Imported projects will be <b>Hidden</b> by default. You
                        can unhide them in your projects later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  disabled={isExistingUser} // LOCKED
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className={`w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-0 resize-none scrollbar-hide ${
                    isExistingUser
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
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
                disabled={isExistingUser} // LOCKED
                onClick={() =>
                  !isExistingUser &&
                  setFormData({ ...formData, isPublic: !formData.isPublic })
                }
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  formData.isPublic ? "bg-green-600" : "bg-gray-600"
                } ${isExistingUser ? "opacity-50 cursor-not-allowed" : ""}`}
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

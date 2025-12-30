import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UploadCloud,
  Loader2,
  Github,
  Film,
  FileText,
  Trash2,
  Star,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit, // New icon
  GripVertical, // New icon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { fetchUserProfile } from "../services/profileOverviewService"; // ADDED THIS
import {
  fetchUserRepositories,
  fetchRepoLanguages,
} from "../services/githubService";

export default function AddEditProjectModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Ongoing",
    startDate: "",
    endDate: "",
    githubLink: "",
    liveLink: "",
    tags: [],
    media: [],
    thumbnail: "",
  });

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubToken, setGithubToken] = useState(null); // Added state
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState(""); // New Error State

  // UI States
  const [previewItem, setPreviewItem] = useState(null); // For lightbox
  const [isStatusOpen, setIsStatusOpen] = useState(false); // For custom dropdown

  const statusOptions = ["Ongoing", "Completed", "On Hold"];

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        thumbnail: initialData.thumbnail || initialData.image || "",
      });
    } else {
      // Reset to empty state if no initialData (for "Add Project" mode)
      setFormData({
        title: "",
        description: "",
        status: "Ongoing",
        startDate: "",
        endDate: "",
        githubLink: "",
        liveLink: "",
        tags: [],
        media: [],
        thumbnail: "",
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    // Clear error when modal opens/closes
    if (isOpen) setError("");

    const loadRepos = async () => {
      if (!currentUser?.uid) return;

      setLoadingRepos(true);
      try {
        const userProfile = await fetchUserProfile(currentUser.uid);
        const username =
          userProfile?.githubUsername ||
          currentUser?.reloadUserInfo?.screenName;
        const token = userProfile?.githubToken;

        // Save token to state for later use (languages fetch)
        setGithubToken(token);

        if (username) {
          const data = await fetchUserRepositories(username, token);
          setRepos(data);
        }
      } catch (err) {
        console.error("Failed to load repos", err);
      } finally {
        setLoadingRepos(false);
      }
    };

    if (isOpen) loadRepos();
  }, [currentUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing dates to fix it
    if (name === "startDate" || name === "endDate") {
      setError("");
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadFileToCloudinary(file));
      const uploadedMedia = await Promise.all(uploadPromises);

      setFormData((prev) => {
        // If it's the first media and no thumbnail is set, auto-set the first one
        const newThumbnail =
          !prev.thumbnail && uploadedMedia.length > 0
            ? getPreviewUrl(uploadedMedia[0])
            : prev.thumbnail;

        return {
          ...prev,
          media: [...(prev.media || []), ...uploadedMedia],
          thumbnail: newThumbnail,
        };
      });
    } catch (error) {
      alert("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index, e) => {
    if (e) e.stopPropagation(); // Prevent opening preview
    setFormData((prev) => {
      const itemToRemove = prev.media[index];
      const newMedia = prev.media.filter((_, i) => i !== index);

      // If we removed the current thumbnail, reset thumbnail to the first available item or empty
      let newThumbnail = prev.thumbnail;
      if (getPreviewUrl(itemToRemove) === prev.thumbnail) {
        newThumbnail = newMedia.length > 0 ? getPreviewUrl(newMedia[0]) : "";
      }

      return {
        ...prev,
        media: newMedia,
        thumbnail: newThumbnail,
      };
    });
  };

  const setAsThumbnail = (item, e) => {
    if (e) e.stopPropagation(); // Prevent opening preview
    const url = getPreviewUrl(item);
    setFormData((prev) => ({ ...prev, thumbnail: url }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const handleRepoSelect = async (e) => {
    const repoId = e.target.value;
    if (!repoId) return;
    const selectedRepo = repos.find((r) => r.id.toString() === repoId);

    if (selectedRepo) {
      const cleanTitle = selectedRepo.name.split("/").pop();
      let repoTags = [];

      // Fetch all languages if the URL exists
      if (selectedRepo.languages_url) {
        try {
          // Pass the stored token here
          repoTags = await fetchRepoLanguages(
            selectedRepo.languages_url,
            githubToken
          );
        } catch (error) {
          // Fallback to primary language if fetch fails
          if (selectedRepo.language) repoTags = [selectedRepo.language];
        }
      } else if (selectedRepo.language) {
        repoTags = [selectedRepo.language];
      }

      setFormData((prev) => ({
        ...prev,
        title: cleanTitle,
        description: selectedRepo.description || "",
        githubLink: selectedRepo.html_url,
        tags: repoTags,
      }));
    }
  };

  const getPreviewUrl = (item) => {
    if (!item.url) return "";
    if (
      item.originalFormat === "pdf" ||
      item.type === "pdf" ||
      item.url.toLowerCase().endsWith(".pdf")
    ) {
      return item.url.replace(/\.pdf$/i, ".jpg");
    }
    return item.url;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { startDate, endDate, status } = formData;

    // 1. End date cannot be before start date
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        setError("End date cannot be earlier than start date");
        return;
      }
    }

    // 2. If BOTH dates exist → project MUST be Completed
    if (startDate && endDate && status !== "Completed") {
      setError(
        "Projects with both start and end dates must be marked as Completed"
      );
      return;
    }

    // 3. If status is Completed → BOTH dates are required
    if (status === "Completed" && (!startDate || !endDate)) {
      setError("Completed projects must have both start and end dates");
      return;
    }

    // 4. If status is Ongoing or On Hold → end date must NOT exist
    if ((status === "Ongoing" || status === "On Hold") && endDate) {
      setError("Ongoing or On Hold projects cannot have an end date");
      return;
    }

    // Thumbnail fallback
    let finalThumbnail = formData.thumbnail;
    if (!finalThumbnail && formData.media && formData.media.length > 0) {
      finalThumbnail = getPreviewUrl(formData.media[0]);
    }

    onSave({
      ...formData,
      image: finalThumbnail,
    });
  };

  const renderPreviewItem = (item) => {
    const previewUrl = getPreviewUrl(item);

    if (item.type === "video") {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 border border-white/5">
          <Film size={20} />
        </div>
      );
    }
    return (
      <img
        src={previewUrl}
        alt="preview"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/150?text=No+Preview";
        }}
      />
    );
  };

  // Lightbox Navigation Logic
  const handleNextMedia = (e) => {
    e.stopPropagation();
    const currentIndex = formData.media.indexOf(previewItem);
    if (currentIndex < formData.media.length - 1) {
      setPreviewItem(formData.media[currentIndex + 1]);
    }
  };

  const handlePrevMedia = (e) => {
    e.stopPropagation();
    const currentIndex = formData.media.indexOf(previewItem);
    if (currentIndex > 0) {
      setPreviewItem(formData.media[currentIndex - 1]);
    }
  };

  // --- Drag and Drop Handlers ---
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Swaps items immediately when entering a new position (Interactive Sorting)
  const handleDragEnter = (e, index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    // If we are in edit mode, sort the tempMedia
    if (isEditingMedia) {
      setTempMedia((prev) => {
        const newMedia = [...prev];
        const [movedItem] = newMedia.splice(draggedIndex, 1);
        newMedia.splice(index, 0, movedItem);
        return newMedia;
      });
    } else {
      // Normal mode sorting
      setFormData((prev) => {
        const newMedia = [...prev.media];
        const [movedItem] = newMedia.splice(draggedIndex, 1);
        newMedia.splice(index, 0, movedItem);
        return { ...prev, media: newMedia };
      });
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  // --- Media Edit Mode Logic ---
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [tempMedia, setTempMedia] = useState([]);

  const handleEnterEditMode = () => {
    setTempMedia([...(formData.media || [])]);
    setIsEditingMedia(true);
  };

  const handleCancelEdit = () => {
    setIsEditingMedia(false);
    setTempMedia([]);
  };

  const handleSaveMedia = () => {
    setFormData((prev) => ({ ...prev, media: tempMedia }));
    setIsEditingMedia(false);
  };

  const updateMediaTitle = (index, newTitle) => {
    setTempMedia((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], caption: newTitle };
      return updated;
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Scrollbar Hiding, Autofill Fix & Date Picker Theme */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Prevent background change on autocomplete */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-background-clip: text;
            -webkit-text-fill-color: #ffffff;
            transition: background-color 5000s ease-in-out 0s;
            box-shadow: inset 0 0 20px 20px 23232329;
        }

        /* Custom Date Picker Theme */
        input[type="date"] {
            color-scheme: dark; /* Forces the calendar popup to use the browser's dark mode */
        }
        /* Style the calendar icon */
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1); /* Turns the default black icon to white */
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.2s;
        }
        /* Hover effect for the icon - turns it orange */
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
            filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(346deg) brightness(118%) contrast(119%);
        }
      `}</style>

      {/* Lightbox Preview */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          {/* Close Button */}
          <button className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-[80]">
            <X size={32} />
          </button>

          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
          >
            {/* Prev Button */}
            {formData.media.indexOf(previewItem) > 0 && (
              <button
                onClick={handlePrevMedia}
                className="absolute left-2 md:left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[80]"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Media Content */}
            <div className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-lg shadow-2xl">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  controls
                  className="max-w-full max-h-[85vh]"
                />
              ) : (
                <img
                  src={getPreviewUrl(previewItem)}
                  alt="Full Preview"
                  className="max-w-full max-h-[85vh] object-contain"
                />
              )}
            </div>

            {/* Next Button */}
            {formData.media.indexOf(previewItem) <
              formData.media.length - 1 && (
              <button
                onClick={handleNextMedia}
                className="absolute right-2 md:right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[80]"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white">
              {initialData ? "Edit Project" : "Create Project"}
            </h2>
            {/* Custom Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-left-2">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-xs font-medium text-red-400">
                  {error}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Media Upload & Thumbnail Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  Project Media & Thumbnail
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    {formData.media?.length || 0}
                  </span>
                </label>
                {!isEditingMedia && formData.media?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEnterEditMode}
                    className="text-xs flex items-center gap-1.5 text-orange-500 hover:text-orange-400 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg"
                  >
                    <Edit size={12} />
                    Edit Details
                  </button>
                )}
              </div>

              {isEditingMedia ? (
                /* --- EDIT MODE LIST --- */
                <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="max-h-[300px] overflow-y-auto scrollbar-hide space-y-2">
                    {tempMedia.map((item, idx) => (
                      <div
                        key={item.url || idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDrop={handleDrop}
                        className={`flex items-center gap-3 bg-[#0B1120] border border-white/10 p-2 rounded-lg transition-all ${
                          draggedIndex === idx
                            ? "opacity-50 border-orange-500/50"
                            : "opacity-100 hover:border-white/20"
                        }`}
                      >
                        {/* Drag Handle & Number */}
                        <div className="flex items-center gap-2 cursor-grab text-gray-500 hover:text-white">
                          <GripVertical size={16} />
                          <span className="text-xs font-mono font-medium text-gray-400">
                            {idx + 1}.
                          </span>
                        </div>

                        {/* Preview */}
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-white/10 bg-black">
                          {item.type === "video" ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Film size={16} />
                            </div>
                          ) : (
                            <img
                              src={getPreviewUrl(item)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Title Input */}
                        <div className="flex-grow">
                          <input
                            type="text"
                            value={item.caption || ""}
                            onChange={(e) =>
                              updateMediaTitle(idx, e.target.value)
                            }
                            placeholder="Add a title (optional)..."
                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-orange-500/50 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Edit Mode Footer */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMedia}
                      className="px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* --- NORMAL GRID VIEW --- */
                <>
                  <div className="flex flex-wrap gap-3 mb-3 animate-in fade-in zoom-in duration-300">
                    {formData.media?.map((item, idx) => {
                      const isThumbnail =
                        getPreviewUrl(item) === formData.thumbnail;
                      return (
                        <div
                          /* key changed to item.url to help React track element movement */
                          key={item.url || idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, idx)}
                          onDrop={handleDrop}
                          onClick={() => setPreviewItem(item)}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden border group bg-black/40 cursor-pointer 
                          transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] 
                          hover:scale-105 hover:z-10 hover:shadow-xl
                          ${
                            isThumbnail
                              ? "border-orange-500 ring-1 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                              : "border-white/10 hover:border-white/30"
                          } ${
                            draggedIndex === idx
                              ? "opacity-50 scale-90"
                              : "opacity-100"
                          }`}
                        >
                          {/* Number Indicator */}
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 pointer-events-none">
                            {idx + 1}
                          </div>

                          {renderPreviewItem(item)}

                          {/* Hover Overlay: Icons top-right with black bg */}
                          <div className="absolute inset-0 group-hover:bg-black/10 transition-colors">
                            <div className="absolute top-1 right-1 flex gap-1 bg-black/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <button
                                type="button"
                                onClick={(e) => setAsThumbnail(item, e)}
                                title="Set as Thumbnail"
                                className={`p-0.5 rounded transition-colors ${
                                  isThumbnail
                                    ? "text-orange-500"
                                    : "text-gray-400 hover:text-orange-400 hover:bg-white/10"
                                }`}
                              >
                                <Star
                                  size={14}
                                  fill={isThumbnail ? "currentColor" : "none"}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => removeMedia(idx, e)}
                                title="Remove"
                                className="p-0.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* PDF Indicator */}
                          {(item.originalFormat === "pdf" ||
                            item.url.toLowerCase().endsWith(".pdf")) && (
                            <div className="absolute bottom-1 right-1 pointer-events-none">
                              <FileText
                                size={10}
                                className="text-white drop-shadow-md"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <label className="w-20 h-20 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-orange-500/50 transition-all duration-300 group">
                      {uploading ? (
                        <Loader2
                          className="animate-spin text-orange-500"
                          size={18}
                        />
                      ) : (
                        <UploadCloud
                          className="text-gray-500 group-hover:text-orange-500 mb-1 transition-colors"
                          size={18}
                        />
                      )}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/*,.pdf"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    Click media to preview. Click star to set cover.
                  </p>
                </>
              )}
            </div>

            {/* 2. GitHub Integration */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Github size={16} />
                <span className="text-sm font-semibold">
                  Import from GitHub
                </span>
              </div>
              <select
                onChange={handleRepoSelect}
                className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                disabled={loadingRepos}
              >
                <option value="">Select a repository to auto-fill...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Title
                </label>
                <input
                  required
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none ring-0 focus:ring-0 transition-all"
                  placeholder="Project Name"
                />
              </div>

              {/* Date Inputs (Start & End) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Timeline (Optional)
                </label>
                <div className="flex gap-2">
                  {/* Start Date */}
                  <div
                    className={`relative w-1/2 bg-black/30 border rounded-xl px-4 py-3 flex items-center focus-within:border-orange-500/50 transition-all ${
                      error ? "border-red-500/50" : "border-white/10"
                    }`}
                  >
                    <input
                      type="date"
                      name="startDate"
                      lang="en-GB"
                      value={formData.startDate}
                      onChange={handleChange}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="w-full h-full bg-transparent text-sm text-white focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* End Date */}
                  <div
                    className={`relative w-1/2 bg-black/30 border rounded-xl px-4 py-3 flex items-center focus-within:border-orange-500/50 transition-all ${
                      error ? "border-red-500/50" : "border-white/10"
                    }`}
                  >
                    <input
                      type="date"
                      name="endDate"
                      lang="en-GB"
                      value={formData.endDate}
                      onChange={handleChange}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="w-full h-full bg-transparent text-sm text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Description
              </label>
              <textarea
                required
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
                placeholder="Details about the project..."
              />
            </div>

            {/* 5. Status & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Status Dropdown */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-400">
                  Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white flex justify-between items-center focus:border-orange-500/50 transition-all"
                  >
                    <span>{formData.status}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isStatusOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isStatusOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B1120] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                      {statusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              status: option,
                            }));
                            setIsStatusOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-orange-500 flex items-center justify-between transition-colors"
                        >
                          {option}
                          {formData.status === option && (
                            <Check size={14} className="text-orange-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Tags (Press Enter)
                </label>
                <div className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-2 flex flex-wrap gap-2 overflow-hidden items-start">
                  {formData.tags.map((tag, i) => (
                    <span
                      key={i}
                      title={tag} // Native tooltip added here
                      className="bg-white/10 px-2 py-1 rounded text-sm flex items-center gap-1 border border-white/5 max-w-full cursor-help"
                    >
                      <span className="truncate break-all">{tag}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((t) => t !== tag),
                          }))
                        }
                        className="hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="bg-transparent outline-none flex-grow min-w-[80px] text-sm h-7 text-white placeholder:text-gray-600"
                    placeholder="Add tag..."
                  />
                </div>
              </div>
            </div>

            {/* 6. Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleChange}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  name="liveLink"
                  value={formData.liveLink}
                  onChange={handleChange}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl backdrop-blur-md">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? "Uploading Media..." : "Save Project"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

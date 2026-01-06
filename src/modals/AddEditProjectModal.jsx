import React, { useState, useEffect, useRef } from "react";
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
  Edit,
  GripVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Info,
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

  // Ref to manage the editor DOM element directly
  const editorRef = useRef(null);
  // NEW: Ref to manage the main modal container for Focus (needed for Ctrl+V)
  const modalRef = useRef(null);

  // NEW: Auto-focus the modal when it opens to capture Paste events
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

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

  // NEW: Track original data for unsaved changes detection
  const [initialFormData, setInitialFormData] = useState(null);

  // NEW: Warn user about unsaved changes on page reload/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if formData matches initialFormData
      if (
        initialFormData &&
        JSON.stringify(formData) !== JSON.stringify(initialFormData)
      ) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, initialFormData]);

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubToken, setGithubToken] = useState(null);

  // UPDATED: Use a counter to track multiple concurrent/queued uploads
  const [uploadCounter, setUploadCounter] = useState(0);
  const uploading = uploadCounter > 0; // Derived state for UI

  // NEW: A Promise Queue to ensure batches are processed in strict order (First In, First Out)
  const uploadQueue = useRef(Promise.resolve());

  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false); // NEW: Drag state

  // --- Text Editor State & Logic ---
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [activeListMenu, setActiveListMenu] = useState(null); // 'ul' | 'ol' | null
  const [linkData, setLinkData] = useState({ text: "", url: "" });
  const [savedSelection, setSavedSelection] = useState(null);
  const [activeFormats, setActiveFormats] = useState({});

  // NEW: Logic to handle smart list numbering (Reset on text, continue on sub-bullets/breaks)
  // NEW: Advanced Logic to handle lists wrapped in divs and sibling lists
  const updateListNumbering = () => {
    if (!editorRef.current) return;

    let currentCount = 1;

    // Recursive helper to process nodes and their children
    const processNode = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName.toLowerCase();

      // 1. If it's an Ordered List (<ol>)
      if (tagName === "ol") {
        node.setAttribute("start", currentCount);

        // Count only direct <li> children to avoid counting nested sub-items
        // This ensures <ol><li>Item 1 <ol><li>SubItem</li></ol></li></ol> only counts as 1
        let directLiCount = 0;
        Array.from(node.children).forEach((child) => {
          if (child.tagName.toLowerCase() === "li") directLiCount++;
        });

        // Fallback: If <li> are buried (e.g. inside invalid <ul> children of <ol>), counting all <li> might be safer visually
        // But for standard structure, direct children is correct.
        // In your specific "sdfsd" case, 'sdfsd' is a direct LI, so this works.
        currentCount += directLiCount;
        return;
      }

      // 2. If it's an Unordered List (<ul>)
      if (tagName === "ul") {
        // Do not reset count. Do not increment count.
        // Just skip it so the sequence continues across it.
        return;
      }

      // 3. If it's a container (<div> or <p>) that might contain lists
      const hasListChildren = Array.from(node.children).some((child) =>
        ["ol", "ul"].includes(child.tagName.toLowerCase())
      );

      if (hasListChildren) {
        // If it wraps lists, drill down and process children sequentially
        Array.from(node.children).forEach((child) => processNode(child));
        return;
      }

      // 4. If it's a text block (and we haven't returned yet)
      const text = node.textContent || "";
      const hasText = text.trim().length > 0;

      // If it has actual text, it breaks the numbering sequence -> Reset to 1
      if (hasText) {
        currentCount = 1;
      }
      // If it's empty (like <br> or empty <div>), we do nothing, preserving the count
    };

    // Start processing from the editor's top-level children
    Array.from(editorRef.current.children).forEach((child) =>
      processNode(child)
    );
  };

  const checkFormats = () => {
    const selection = window.getSelection();
    let activeUlStyle = null;
    let activeOlStyle = null;
    let isLink = false;
    let currentUrl = "";

    if (selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "UL") {
          activeUlStyle = node.style.listStyleType || "disc";
        } else if (node.nodeName === "OL") {
          activeOlStyle = node.getAttribute("type") || "1";
        } else if (node.nodeName === "A") {
          isLink = true;
          currentUrl = node.getAttribute("href");
        }
        node = node.parentNode;
      }
    }

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      ulStyle: activeUlStyle,
      olStyle: activeOlStyle,
      isLink,
      linkUrl: currentUrl,
    });
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    checkFormats();
    updateListNumbering(); // Update numbering on command
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current.innerHTML,
      }));
      editorRef.current.focus();
    }
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const command = e.shiftKey ? "outdent" : "indent";
      document.execCommand(command);
      checkFormats();
      updateListNumbering(); // Update numbering on tab
      if (editorRef.current) {
        setFormData((prev) => ({
          ...prev,
          description: editorRef.current.innerHTML,
        }));
      }
    }
  };

  // ... (Keep existing applyListStyle, saveSelection, restoreSelection, handleInsertLink functions exactly as they were) ...
  // To save space in chat, I am assuming you keep the helper functions here.
  // Just ensure updateListNumbering() is called whenever content changes (see below in the JSX).

  const applyListStyle = (cmd, styleValue) => {
    const isOrdered = cmd === "insertOrderedList";
    const currentState = document.queryCommandState(cmd);

    if (!currentState) {
      document.execCommand(cmd);
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === (isOrdered ? "OL" : "UL")) {
          if (isOrdered) {
            const cssMap = {
              1: "decimal",
              a: "lower-alpha",
              A: "upper-alpha",
              i: "lower-roman",
              I: "upper-roman",
            };
            node.style.listStyleType = cssMap[styleValue] || "decimal";
            node.setAttribute("type", styleValue);
          } else {
            node.style.listStyleType = styleValue;
          }
          break;
        }
        node = node.parentNode;
      }
    }

    checkFormats();
    updateListNumbering(); // Update numbering on style change
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current.innerHTML,
      }));
      editorRef.current.focus();
    }
    setActiveListMenu(null);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0));
      setLinkData((prev) => ({ ...prev, text: sel.toString() }));
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedSelection) {
      sel.addRange(savedSelection);
    }
  };

  const handleInsertLink = () => {
    restoreSelection();
    if (linkData.text && linkData.url) {
      const linkHTML = `<a href="${linkData.url}" target="_blank" rel="noopener noreferrer" class="text-orange-400 underline">${linkData.text}</a>`;
      document.execCommand("insertHTML", false, linkHTML);
    } else if (linkData.url) {
      document.execCommand("createLink", false, linkData.url);
    }

    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current.innerHTML,
      }));
    }

    setShowLinkModal(false);
    setLinkData({ text: "", url: "" });
  };

  const handleRemoveLink = () => {
    restoreSelection();
    document.execCommand("unlink", false, null);

    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current.innerHTML,
      }));
    }
    setShowLinkModal(false);
    setLinkData({ text: "", url: "" });
  };

  // UI States
  const [previewItem, setPreviewItem] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusOptions = ["Ongoing", "Completed", "On Hold"];

  useEffect(() => {
    // Reset UI states (Dropdowns, Help Text, Modals) whenever modal opens/closes
    setShowLinkModal(false);
    setActiveListMenu(null);
    setIsStatusOpen(false);
    setShowMediaHelp(false);
    setIsEditingMedia(false); // Reset edit mode
    setPreviewItem(null); // Reset preview overlay

    // Reset Editor Toolbar States (Bold, Italic, List Styles, Links, etc.)
    setActiveFormats({});
    setLinkData({ text: "", url: "" });

    let startData; // Helper to capture the baseline state

    if (initialData) {
      startData = {
        ...initialData,
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        thumbnail: initialData.thumbnail || initialData.image || "",
      };
      setFormData(startData);
      setInitialFormData(startData); // NEW: Set baseline for comparison

      if (editorRef.current) {
        editorRef.current.innerHTML = initialData.description || "";
        updateListNumbering(); // Run logic on load
      }
    } else {
      startData = {
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
      };
      setFormData(startData);
      setInitialFormData(startData); // NEW: Set baseline for comparison

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [initialData, isOpen]);

  // ... (Keep existing useEffect for repos, handleChange, handleFileChange, removeMedia, setAsThumbnail, handleTagKeyDown, handleRepoSelect, getPreviewUrl, handleSubmit, renderPreviewItem, Lightbox logic, Drag and Drop logic, Edit Mode logic) ...
  // [OMITTED FOR BREVITY - KEEP YOUR EXISTING CODE FOR THESE FUNCTIONS]

  // Re-inserting the essential hooks/funcs just to be safe for the "replace" context:
  useEffect(() => {
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
    if (name === "startDate" || name === "endDate") setError("");
  };

  // Reusable function to process files from Input, Drop, or Paste
  const processFiles = (files) => {
    if (files.length === 0) return;

    // VALIDATION: Check for allowed types (Image, Video, PDF)
    const hasInvalidFiles = files.some((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      return !isImage && !isVideo && !isPdf;
    });

    if (hasInvalidFiles) {
      setError(
        "Invalid file type. Only images, videos, gifs, and PDFs are allowed."
      );
      return;
    }

    setError("");

    // 1. Immediately signal that uploading has started (increments counter)
    setUploadCounter((prev) => prev + 1);

    // 2. Add this batch to the Queue.
    // This ensures Batch B waits for Batch A to finish before starting/displaying.
    // This preserves the exact order of selection/dropping.
    uploadQueue.current = uploadQueue.current.then(async () => {
      try {
        const uploadPromises = files.map((file) =>
          uploadFileToCloudinary(file)
        );
        // Wait for all files in *this* specific batch to finish
        const uploadedMedia = await Promise.all(uploadPromises);

        // Update State (Show previews only after this batch is fully done)
        setFormData((prev) => {
          const currentMedia = prev.media || [];
          // Appending to the end ensures order is preserved based on queue execution
          const allMedia = [...currentMedia, ...uploadedMedia];

          // Find the first non-video item to use as thumbnail if one isn't set
          const firstValidImage = allMedia.find((m) => m.type !== "video");
          const newThumbnail =
            !prev.thumbnail && firstValidImage
              ? getPreviewUrl(firstValidImage)
              : prev.thumbnail;

          return {
            ...prev,
            media: allMedia,
            thumbnail: newThumbnail,
          };
        });

        // Also update tempMedia if we are currently in edit mode
        if (isEditingMedia) {
          setTempMedia((prev) => [...prev, ...uploadedMedia]);
        }
      } catch (error) {
        console.error("Upload failed", error);
        setError("Failed to upload one or more files.");
      } finally {
        // 3. Decrement counter only when this specific batch is truly done
        setUploadCounter((prev) => prev - 1);
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
    e.target.value = ""; // Reset input
  };

  // Drag & Drop + Paste Handlers
  const handleDragOverUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeaveUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // NEW: Check if we are actually leaving the drop zone (modal) vs entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDropUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  };

  const handlePasteUpload = (e) => {
    const items = e.clipboardData.items;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        files.push(items[i].getAsFile());
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  };

  const removeMedia = (index, e) => {
    if (e) e.stopPropagation();
    setFormData((prev) => {
      const itemToRemove = prev.media[index];
      const newMedia = prev.media.filter((_, i) => i !== index);
      let newThumbnail = prev.thumbnail;

      // If we removed the thumbnail, try to find the next valid image
      if (getPreviewUrl(itemToRemove) === prev.thumbnail) {
        const nextValidImage = newMedia.find((m) => m.type !== "video");
        newThumbnail = nextValidImage ? getPreviewUrl(nextValidImage) : "";
      }
      return { ...prev, media: newMedia, thumbnail: newThumbnail };
    });
  };

  const setAsThumbnail = (item, e) => {
    if (e) e.stopPropagation();
    // Prevent videos from being set as thumbnail
    if (item.type === "video") return;

    const url = getPreviewUrl(item);
    setFormData((prev) => ({ ...prev, thumbnail: url }));
    setError(""); // Clear error when a thumbnail is selected
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
      if (selectedRepo.languages_url) {
        try {
          repoTags = await fetchRepoLanguages(
            selectedRepo.languages_url,
            githubToken
          );
        } catch (error) {
          if (selectedRepo.language) repoTags = [selectedRepo.language];
        }
      } else if (selectedRepo.language) {
        repoTags = [selectedRepo.language];
      }

      const newDescription = selectedRepo.description || "";

      // Update State
      setFormData((prev) => ({
        ...prev,
        title: cleanTitle,
        description: newDescription,
        githubLink: selectedRepo.html_url,
        tags: repoTags,
      }));

      // FIX: Manually update the Rich Text Editor visual content
      if (editorRef.current) {
        editorRef.current.innerHTML = newDescription;
      }
    }
  };

  const getPreviewUrl = (item) => {
    if (!item.url) return "";

    // Handle PDFs
    if (
      item.originalFormat === "pdf" ||
      item.type === "pdf" ||
      item.url.toLowerCase().endsWith(".pdf")
    ) {
      return item.url.replace(/\.pdf$/i, ".jpg");
    }

    // Handle Videos: Replace extension with .jpg to get Cloudinary thumbnail
    if (item.type === "video" || item.url.match(/\.(mp4|mov|webm|mkv)$/i)) {
      return item.url.replace(/\.[^/.]+$/, ".jpg");
    }

    return item.url;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const { startDate, endDate, status } = formData;

    // 1. Date & Status Validations
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be earlier than start date");
      return;
    }
    if (startDate && endDate && status !== "Completed") {
      setError(
        "Projects with both start and end dates must be marked as Completed"
      );
      return;
    }
    if (status === "Completed" && (!startDate || !endDate)) {
      setError("Completed projects must have both start and end dates");
      return;
    }
    if ((status === "Ongoing" || status === "On Hold") && endDate) {
      setError("Ongoing or On Hold projects cannot have an end date");
      return;
    }

    // 2. Description Validation (Strip HTML tags to check for real text)
    const plainTextDescription = formData.description
      ? formData.description.replace(/<[^>]+>/g, "").trim()
      : "";

    if (!plainTextDescription) {
      setError("Please add a description for your project.");
      return;
    }

    // 3. Thumbnail Calculation & Validation
    let finalThumbnail = formData.thumbnail;

    // If no manual thumbnail set, try to auto-select first NON-VIDEO media
    if (!finalThumbnail && formData.media && formData.media.length > 0) {
      const firstValidImage = formData.media.find((m) => m.type !== "video");
      if (firstValidImage) {
        finalThumbnail = getPreviewUrl(firstValidImage);
      }
    }

    if (!finalThumbnail) {
      setError("Please upload an image and set it as the project thumbnail.");
      return;
    }

    onSave({ ...formData, image: finalThumbnail });
  };

  const renderPreviewItem = (item) => {
    const previewUrl = getPreviewUrl(item);

    // Render the generated thumbnail for both images and videos
    return (
      <>
        <img
          src={previewUrl}
          alt="preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/150?text=No+Preview";
          }}
        />
        {/* Overlay icon for videos */}
        {item.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <Film size={20} className="text-white/90 drop-shadow-md" />
          </div>
        )}
      </>
    );
  };

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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnter = (e, index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    if (isEditingMedia) {
      setTempMedia((prev) => {
        const newMedia = [...prev];
        const [movedItem] = newMedia.splice(draggedIndex, 1);
        newMedia.splice(index, 0, movedItem);
        return newMedia;
      });
    } else {
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
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
  };
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [tempMedia, setTempMedia] = useState([]);
  const [showMediaHelp, setShowMediaHelp] = useState(false); // NEW STATE
  const [isClearing, setIsClearing] = useState(false); // NEW: Animation state

  // NEW: Smoothly clear all media with transition
  const handleClearMedia = () => {
    if (formData.media.length === 0) return;
    setIsClearing(true);
    // Wait for animation (500ms) to finish before removing data
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, media: [], thumbnail: "" }));
      setIsClearing(false);
    }, 500);
  };

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
      {/* ... [STYLES KEPT AS IS] ... */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active{ -webkit-background-clip: text; -webkit-text-fill-color: #ffffff; transition: background-color 5000s ease-in-out 0s; box-shadow: inset 0 0 20px 20px 23232329; }
        /* Updated selectors from [type="date"] to [type="month"] to style the month picker */
        input[type="month"] { color-scheme: dark; }
        input[type="month"]::-webkit-calendar-picker-indicator { filter: invert(0); cursor: pointer; opacity: 1; transition: all 0.2s; }
        input[type="month"]::-webkit-calendar-picker-indicator:hover { opacity: 1; filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(346deg) brightness(118%) contrast(119%); }
      `}</style>

      {/* ... [PREVIEW MODAL KEPT AS IS] ... */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-[80]">
            <X size={32} />
          </button>
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {formData.media.indexOf(previewItem) > 0 && (
              <button
                onClick={handlePrevMedia}
                className="absolute left-2 md:left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[80]"
              >
                <ChevronLeft size={32} />
              </button>
            )}
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
      {/* Handlers moved to this main container */}
      <div
        ref={modalRef} // Added Ref
        tabIndex={-1} // Added tabIndex to make div focusable
        onDragOver={handleDragOverUpload}
        onDragLeave={handleDragLeaveUpload}
        onDrop={handleDropUpload}
        onPaste={handlePasteUpload}
        className="relative w-full max-w-4xl bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 outline-none"
      >
        {/* NEW: Full Overlay when dragging */}
        {isDragging && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-orange-500 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
            <UploadCloud size={64} className="text-orange-500 mb-4" />
            <h3 className="text-2xl font-bold text-white">Drop files here</h3>
            <p className="text-gray-400 mt-2">to add them to your project</p>
          </div>
        )}

        {/* ... [HEADER KEPT AS IS] ... */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white">
              {initialData ? "Edit Project" : "Create Project"}
            </h2>
            {error && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-left-2">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-xs font-medium text-red-400">
                  {error}
                </span>
              </div>
            )}
            {/* Video Banner Warning */}
            {formData.media.length > 0 &&
              formData.media.every((m) => m.type === "video") && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in slide-in-from-left-2">
                  <Info size={14} className="text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">
                    A non-video media is required for the project thumbnail.
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

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
            {/* ... [MEDIA UPLOAD SECTION KEPT AS IS] ... */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  Project Media & Thumbnail
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    {formData.media?.length || 0}
                  </span>
                </label>
                {!isEditingMedia && formData.media?.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={handleClearMedia}
                      className="text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleEnterEditMode}
                      className="text-xs flex items-center gap-1.5 text-orange-500 hover:text-orange-400 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap"
                    >
                      <Edit size={12} />
                      Edit Details
                    </button>
                  </div>
                )}
              </div>
              {isEditingMedia ? (
                /* ... Edit Mode List ... */
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
                        <div className="flex items-center gap-2 cursor-grab text-gray-500 hover:text-white">
                          <GripVertical size={16} />
                          <span className="text-xs font-mono font-medium text-gray-400">
                            {idx + 1}.
                          </span>
                        </div>
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-white/10 bg-black relative">
                          <img
                            src={getPreviewUrl(item)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {item.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <Film size={16} className="text-white/90" />
                            </div>
                          )}
                        </div>
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
                /* ... Normal Grid View ... */
                <>
                  <div
                    className={`flex flex-wrap gap-3 mb-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isClearing
                        ? "opacity-0 scale-95 blur-sm translate-y-2"
                        : "animate-in fade-in zoom-in duration-300"
                    }`}
                  >
                    {formData.media?.map((item, idx) => {
                      const isThumbnail =
                        getPreviewUrl(item) === formData.thumbnail;
                      return (
                        <div
                          key={item.url || idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, idx)}
                          onDrop={handleDrop}
                          onClick={() => setPreviewItem(item)}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden border group bg-black/40 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] hover:scale-105 hover:z-10 hover:shadow-xl ${
                            isThumbnail
                              ? "border-orange-500 ring-1 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                              : "border-white/10 hover:border-white/30"
                          } ${
                            draggedIndex === idx
                              ? "opacity-50 scale-90"
                              : "opacity-100"
                          }`}
                        >
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 pointer-events-none">
                            {idx + 1}
                          </div>
                          {renderPreviewItem(item)}
                          <div className="absolute inset-0 group-hover:bg-black/10 transition-colors">
                            <div className="absolute top-1 right-1 flex gap-1 bg-black/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              {/* Only show Star button if NOT a video */}
                              {item.type !== "video" && (
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
                              )}
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
                    <label
                      // Handlers removed from here as they are now on the parent
                      className="w-20 h-20 border-2 border-dashed border-white/10 hover:bg-white/5 hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
                    >
                      {uploading ? (
                        <Loader2
                          className="animate-spin text-orange-500"
                          size={18}
                        />
                      ) : (
                        <UploadCloud
                          className={`mb-1 transition-colors ${
                            isDragging
                              ? "text-orange-500"
                              : "text-gray-500 group-hover:text-orange-500"
                          }`}
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

                  {/* NEW: Interactive Help Text */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMediaHelp(!showMediaHelp)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      <Info size={14} />
                      <span>Click media to preview</span>
                    </button>

                    {showMediaHelp && (
                      <div className="absolute top-full left-0 mt-2 z-20 w-64 p-3 bg-[#0B1120] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <ul className="space-y-2 text-xs text-gray-400">
                          <li className="flex gap-2">
                            <Star
                              size={12}
                              className="mt-0.5 text-orange-500"
                            />
                            <span>Click star to set project cover</span>
                          </li>
                          <li className="flex gap-2">
                            <GripVertical
                              size={12}
                              className="mt-0.5 text-gray-500"
                            />
                            <span>Drag and drop to re-arrange</span>
                          </li>
                          <li className="flex gap-2">
                            <Edit size={12} className="mt-0.5 text-blue-500" />
                            <span>Use 'Edit Details' to set titles</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ... [GITHUB & BASIC INFO SECTIONS KEPT AS IS] ... */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Github size={16} />
                <span className="text-sm font-semibold">
                  Import from GitHub
                </span>
              </div>
              <select
                onChange={handleRepoSelect}
                className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none max-w-full"
                disabled={loadingRepos}
              >
                <option value="">Select a repository to auto-fill...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id} className="truncate">
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>

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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Timeline (Optional)
                </label>
                <div className="flex gap-2">
                  <div
                    className={`relative w-1/2 bg-black/30 border rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-orange-500/50 transition-all ${
                      error ? "border-red-500/50" : "border-white/10"
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                      Start Date
                    </span>
                    {/* Changed type="date" to type="month" */}
                    <input
                      type="month"
                      name="startDate"
                      lang="en-GB"
                      value={formData.startDate}
                      onChange={handleChange}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer h-6 p-0"
                    />
                  </div>
                  <div
                    className={`relative w-1/2 bg-black/30 border rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-orange-500/50 transition-all ${
                      error ? "border-red-500/50" : "border-white/10"
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                      End Date
                    </span>
                    {/* Changed type="date" to type="month" */}
                    <input
                      type="month"
                      name="endDate"
                      lang="en-GB"
                      value={formData.endDate}
                      onChange={handleChange}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer h-6 p-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Description (Rich Text Editor) - UPDATED CSS AND LOGIC */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Description
              </label>
              <div className="w-full bg-black/30 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-500/50 transition-colors relative">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5 flex-wrap">
                  {[
                    { cmd: "bold", icon: Bold, title: "Bold" },
                    { cmd: "italic", icon: Italic, title: "Italic" },
                    { cmd: "underline", icon: Underline, title: "Underline" },
                    {
                      cmd: "strikeThrough",
                      icon: Strikethrough,
                      title: "Strikethrough",
                    },
                  ].map(({ cmd, icon: Icon, title }) => (
                    <button
                      key={cmd}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => execCommand(cmd)}
                      className={`p-1.5 rounded transition-colors ${
                        activeFormats[cmd]
                          ? "text-orange-500 bg-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={title}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                  <div className="w-px h-4 bg-white/20 mx-1" />

                  {/* List Controls */}
                  <div className="relative">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        setActiveListMenu(activeListMenu === "ul" ? null : "ul")
                      }
                      className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                        activeFormats.insertUnorderedList
                          ? "text-orange-500 bg-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                      title="Bullet Options"
                    >
                      <List size={16} />
                      <ChevronDown size={10} />
                    </button>
                    {activeListMenu === "ul" && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-[#0B1120] border border-white/20 rounded-lg shadow-xl z-30 overflow-hidden">
                        {[
                          { label: "● Disc", value: "disc" },
                          { label: "○ Circle", value: "circle" },
                          { label: "■ Square", value: "square" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              applyListStyle("insertUnorderedList", opt.value)
                            }
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              activeFormats.ulStyle === opt.value
                                ? "bg-orange-500/20 text-orange-500 font-bold"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        setActiveListMenu(activeListMenu === "ol" ? null : "ol")
                      }
                      className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                        activeFormats.insertOrderedList
                          ? "text-orange-500 bg-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                      title="Number Options"
                    >
                      <ListOrdered size={16} />
                      <ChevronDown size={10} />
                    </button>
                    {activeListMenu === "ol" && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-[#0B1120] border border-white/20 rounded-lg shadow-xl z-30 overflow-hidden">
                        {[
                          { label: "1, 2, 3", value: "1" },
                          { label: "a, b, c", value: "a" },
                          { label: "A, B, C", value: "A" },
                          { label: "i, ii, iii", value: "i" },
                          { label: "I, II, III", value: "I" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              applyListStyle("insertOrderedList", opt.value)
                            }
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              activeFormats.olStyle === opt.value
                                ? "bg-orange-500/20 text-orange-500 font-bold"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-px h-4 bg-white/20 mx-1" />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      saveSelection();
                      if (activeFormats.isLink) {
                        setLinkData((prev) => ({
                          ...prev,
                          url: activeFormats.linkUrl,
                        }));
                      }
                      setShowLinkModal(true);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      activeFormats.isLink
                        ? "text-orange-500 bg-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Hyperlink"
                  >
                    <LinkIcon size={16} />
                  </button>
                </div>

                {/* Editor Content Area - UPDATED CLASSNAME */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={handleEditorKeyDown}
                  onInput={(e) => {
                    const html = e.currentTarget.innerHTML;
                    updateListNumbering(); // Run logic on every input
                    setFormData((prev) => ({ ...prev, description: html }));
                    setError(""); // Clear error when typing description
                  }}
                  onKeyUp={checkFormats}
                  onMouseUp={checkFormats}
                  // FIX: Removed all custom CSS counters.
                  // Now relies on JS `updateListNumbering` to inject `start` attributes, and browser default styles.
                  className="w-full h-64 p-4 text-white overflow-y-auto focus:outline-none scrollbar-hide [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8"
                  style={{ minHeight: "150px" }}
                />

                {/* Link Modal Popup */}
                {showLinkModal && (
                  <div className="absolute top-10 left-2 z-20 bg-[#0B1120] border border-white/20 rounded-lg shadow-xl p-3 w-72 animate-in fade-in zoom-in duration-200">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">
                        Insert Link
                      </h4>
                      <input
                        type="text"
                        placeholder="Text to display"
                        value={linkData.text}
                        onChange={(e) =>
                          setLinkData((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-orange-500/50 outline-none"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={linkData.url}
                        onChange={(e) =>
                          setLinkData((prev) => ({
                            ...prev,
                            url: e.target.value,
                          }))
                        }
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-orange-500/50 outline-none"
                      />
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setShowLinkModal(false)}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        {activeFormats.isLink && (
                          <button
                            type="button"
                            onClick={handleRemoveLink}
                            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 rounded"
                          >
                            Remove Link
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleInsertLink}
                          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-500 font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ... [STATUS & TAGS SECTIONS KEPT AS IS] ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <div className="h-9 flex items-center">
                  <label className="text-sm font-medium text-gray-400">
                    Status
                  </label>
                </div>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between h-9">
                  <label className="text-sm font-medium text-gray-400">
                    Tags (Press Enter)
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="w-1/2 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-orange-500/50 outline-none transition-colors placeholder:text-gray-600"
                    placeholder="Type & Enter to add..."
                  />
                </div>
                <div className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-2 flex flex-wrap gap-2 h-32 overflow-y-auto content-start scrollbar-hide">
                  {formData.tags.map((tag, i) => (
                    <span
                      key={i}
                      title={tag}
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
                </div>
              </div>
            </div>

            {/* ... [LINKS SECTION KEPT AS IS] ... */}
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

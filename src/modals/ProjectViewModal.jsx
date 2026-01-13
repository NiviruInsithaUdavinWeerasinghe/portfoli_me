// FIX: Added useRef to imports
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc } from "firebase/firestore"; // NEW
import { db } from "../lib/firebase"; // NEW
import {
  X,
  ExternalLink,
  Github,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Loader,
  Loader2, // NEW: Added Loader2
  Maximize2, // NEW: Import Maximize icon
  Minimize2, // NEW: Import Minimize icon
  User, // NEW: Import User icon for avatar fallback
} from "lucide-react";
import Lottie from "lottie-react"; // NEW: Import Lottie Player

// NEW: Helper component to fetch and play Lottie JSON from a URL
const LottieRenderer = ({ url, className }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    if (!url) return;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load Lottie:", err));
  }, [url]);

  if (!animationData)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={16} />
      </div>
    );

  return (
    <Lottie animationData={animationData} loop={true} className={className} />
  );
};

export default function ProjectViewModal({
  project,
  isOpen,
  onClose,
  currentUser,
  profileOwnerId,
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // NEW: State for lightbox

  // FIX: Created a ref for the thumbnail scroll container
  const scrollContainerRef = useRef(null);

  // FIX: Reset index to 0 whenever the project changes to prevent out-of-bounds errors
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsMediaLoaded(false);
  }, [project]);

  // NEW: Fetch Project Owner Details for display (Fixes missing name/photo)
  const [ownerData, setOwnerData] = useState(null);
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (project?.ownerId) {
        try {
          const userDoc = await getDoc(doc(db, "users", project.ownerId));
          if (userDoc.exists()) {
            setOwnerData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching owner details:", error);
        }
      }
    };
    fetchOwnerDetails();
  }, [project?.ownerId]);

  // Reset loading state when navigating between media
  useEffect(() => {
    setIsMediaLoaded(false);
  }, [activeMediaIndex]);

  // FIX: Auto-scroll the thumbnail strip when activeMediaIndex changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeThumb = scrollContainerRef.current.children[activeMediaIndex];
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center", // Keeps the active item centered
        });
      }
    }
  }, [activeMediaIndex]);

  if (!isOpen || !project) return null;

  const mediaList = (() => {
    const baseMedia =
      project.media && project.media.length > 0
        ? [...project.media]
        : [{ url: project.image, type: "image" }];

    // If a thumbnail/image exists, move it to the front of the list
    const thumbUrl = project.thumbnail || project.image;

    if (thumbUrl) {
      // Find index by checking direct URL match OR if the item's generated preview matches the thumbnail (for PDFs)
      const thumbIndex = baseMedia.findIndex((m) => {
        if (m.url === thumbUrl) return true;
        // Check if it's a PDF whose preview matches the stored thumbnail URL
        if (
          (m.type === "pdf" || m.url?.toLowerCase().endsWith(".pdf")) &&
          m.url.replace(/\.pdf$/i, ".jpg") === thumbUrl
        ) {
          return true;
        }
        return false;
      });

      if (thumbIndex > -1) {
        const [thumbnailItem] = baseMedia.splice(thumbIndex, 1);
        baseMedia.unshift(thumbnailItem);
      }
    }
    return baseMedia;
  })();

  const currentMedia = mediaList[activeMediaIndex];

  // FIX: Safety check - if currentMedia is undefined, don't render yet
  if (!currentMedia) return null;

  const handleNext = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    setActiveMediaIndex(
      (prev) => (prev - 1 + mediaList.length) % mediaList.length
    );
  };

  // Helper to check if item is PDF
  const isPdf = (item) =>
    item.type === "pdf" ||
    item.originalFormat === "pdf" ||
    (item.url && item.url.toLowerCase().endsWith(".pdf"));

  // Helper to get thumbnail URL (swaps .pdf for .jpg)
  const getThumbnailUrl = (item) => {
    if (isPdf(item)) {
      return item.url.replace(
        "/upload/",
        "/upload/pg_1,w_300,h_300,c_fill,f_jpg/"
      );
    }
    // NEW: Handle Video Thumbnails
    if (item.type === "video" || item.url.match(/\.(mp4|mov|webm|mkv)$/i)) {
      return item.url.replace(/\.[^/.]+$/, ".jpg");
    }
    return item.url;
  };

  // Helper to generate a forced download URL for Cloudinary
  const getDownloadUrl = (url) => {
    if (!url) return "";
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return url;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* FIX: Changed 'md:flex-row' to 'lg:flex-row'. This keeps tablets (md) in vertical column mode like mobile. */}
      <div className="relative w-full max-w-[90vw] h-[90vh] bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
        {" "}
        {/* --- LEFT SIDE: MEDIA VIEWER --- */}
        {/* FIX: Added 'md:h-96' to increase height specifically on tablet screens */}
        <div className="w-full lg:w-2/3 h-64 md:h-96 lg:h-full shrink-0 bg-black/50 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 group">
          {/* Loading Spinner - Shows only when media is NOT loaded, NOT a PDF, and NOT JSON */}
          {!isMediaLoaded &&
            !isPdf(currentMedia) &&
            currentMedia.type !== "json" &&
            !currentMedia.url?.endsWith(".json") && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Loader className="w-12 h-12 text-orange-500 animate-spin" />
              </div>
            )}

          <div className="w-full h-full flex items-center justify-center p-4">
            {currentMedia.type === "video" ? (
              <video
                src={currentMedia.url}
                controls
                // Only show when data is loaded
                onLoadedData={() => setIsMediaLoaded(true)}
                className={`max-w-full max-h-full rounded-lg shadow-lg transition-opacity duration-300 ${
                  isMediaLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : currentMedia.type === "json" ||
              currentMedia.url?.endsWith(".json") ? (
              // NEW: Lottie Player in Main View
              <div className="w-full h-full flex items-center justify-center">
                <LottieRenderer
                  url={currentMedia.url}
                  className="w-full h-full max-w-[80%] max-h-[80%]"
                />
              </div>
            ) : isPdf(currentMedia) ? (
              // PDF viewer usually handles its own loading UI
              <div className="w-full h-full relative bg-white/5 rounded-lg overflow-hidden flex flex-col">
                <embed
                  src={currentMedia.url}
                  type="application/pdf"
                  className="w-full h-full rounded-lg"
                />
                {/* Overlay Download Button */}
                <div className="absolute bottom-4 right-4 z-10">
                  <a
                    href={getDownloadUrl(currentMedia.url)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 hover:bg-orange-500 transition-colors shadow-lg"
                  >
                    <Download size={18} /> Download PDF
                  </a>
                </div>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt="Project Media"
                // Only show when image is loaded
                onLoad={() => setIsMediaLoaded(true)}
                className={`max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-300 ${
                  isMediaLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 p-2 bg-black/50 hover:bg-orange-500 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 p-2 bg-black/50 hover:bg-orange-500 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Media Title Overlay */}
          {currentMedia.caption && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-lg text-white text-sm font-medium z-20 max-w-[90%] text-center animate-in fade-in slide-in-from-bottom-2">
              {currentMedia.caption}
            </div>
          )}

          {/* FIX: Moved Close Button here and grouped with Expand Button. Removed 'opacity-0' so they are visible on mobile. */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="p-2 bg-black/50 hover:bg-orange-600 text-white rounded-full backdrop-blur-sm transition-colors"
              title="Expand View"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Thumbnails Indicator */}
          {mediaList.length > 1 && (
            <div
              // FIX: Attached the ref here so we can control scrolling
              ref={scrollContainerRef}
              className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-full px-4 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {mediaList.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all bg-black/40 relative ${
                    activeMediaIndex === idx
                      ? "border-orange-500 scale-110 opacity-100"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* NEW: Handle Lottie Thumbnails vs Image/Video/PDF Thumbnails */}
                  {m.type === "json" || m.url?.endsWith(".json") ? (
                    <div className="w-full h-full p-1 bg-black/20">
                      <LottieRenderer url={m.url} className="w-full h-full" />
                    </div>
                  ) : (
                    <img
                      src={getThumbnailUrl(m)}
                      className="w-full h-full object-cover"
                      alt="thumb"
                    />
                  )}

                  {/* Overlay Play Icon for Videos */}
                  {m.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play
                        size={16}
                        className="text-white/90 drop-shadow-md"
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* --- RIGHT SIDE: DETAILS --- */}
        {/* FIX: Changed 'md:' classes to 'lg:' so tablets use flex-1 to fill remaining vertical space */}
        <div className="w-full lg:w-1/3 flex flex-col flex-1 lg:h-full min-h-0 bg-[#0B1120]">
          {/* FIX: Removed the separate Header Actions div with the Close button since it moved to the media section */}

          {/* Content Scrollable - Added 'py-8' to give spacing at the top now that the close button header is gone */}
          <div className="flex-1 overflow-y-auto px-8 py-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="mb-6">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${
                  project.status === "Completed"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                }`}
              >
                {project.status}
              </span>
              {/* Added break-all to handle long words without spaces */}
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight break-all">
                {project.title}
              </h2>

              {/* Date Logic: Start - End */}
              {(project.startDate || project.endDate) && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <Calendar size={14} />
                  <span>
                    {project.startDate ? project.startDate : ""}
                    {project.startDate && project.endDate ? " - " : ""}
                    {project.endDate ? project.endDate : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                  About Project
                </h3>
                <div
                  // Updated CSS to support deeper nesting (_) and allow inline styles to work (removed explicit list-style overrides)
                  className="text-gray-400 leading-relaxed font-light break-words 
                  [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:mb-2 
                  [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:mb-2 
                  [&_li]:pl-1
                  [&_a]:text-orange-400 [&_a]:underline [&_a]:hover:text-orange-300
                  [&_b]:font-bold [&_strong]:font-bold
                  [&_i]:italic [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => {
                    const CHAR_LIMIT = 20;
                    const isLong = tag.length > CHAR_LIMIT;
                    return (
                      <span
                        key={i}
                        title={isLong ? tag : ""}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 max-w-full truncate break-all inline-block"
                      >
                        {isLong ? `${tag.substring(0, CHAR_LIMIT)}...` : tag}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* --- NEW: COLLABORATORS SECTION (Conditional Logic Updated) --- */}
              {(() => {
                const projectOwnerId = project.ownerId;

                // 1. Determine Display List
                let displayCollaborators = [...(project.collaborators || [])];

                // --- LOGIC SPLIT: GUEST VS LOGGED IN ---

                if (currentUser) {
                  // === LOGGED IN VIEW ===

                  // 1. Identify User Relation BEFORE filtering
                  const existingUserCollab = displayCollaborators.find(
                    (c) => c.uid === currentUser.uid
                  );
                  const isUserProjectOwner = projectOwnerId === currentUser.uid;

                  // 2. Filter out Profile Owner (Prevent viewing Profile Owner on their own profile)
                  if (profileOwnerId) {
                    displayCollaborators = displayCollaborators.filter(
                      (c) => c.uid !== profileOwnerId
                    );
                  }

                  // 3. Filter out Current User (Prevent redundancy, we will re-inject as "Hey you" if needed)
                  displayCollaborators = displayCollaborators.filter(
                    (c) => c.uid !== currentUser.uid
                  );

                  // 4. "Hey, this is you" Logic
                  // Trigger: User is NOT viewing their own profile AND (User is Owner OR User is Collaborator)
                  if (
                    currentUser.uid !== profileOwnerId &&
                    (isUserProjectOwner || existingUserCollab)
                  ) {
                    // Determine correct role (Don't hardcode "Owner")
                    let displayRole = "Collaborator";
                    if (isUserProjectOwner) {
                      displayRole = ownerData?.role || "Project Owner";
                    } else if (existingUserCollab) {
                      displayRole = existingUserCollab.role || "Collaborator";
                    }

                    displayCollaborators.unshift({
                      uid: currentUser.uid,
                      displayName: "Hey, this is you",
                      photoURL:
                        currentUser.photoURL ||
                        (isUserProjectOwner
                          ? ownerData?.photoURL
                          : existingUserCollab?.photoURL),
                      role: displayRole,
                      isOwnerLabel: isUserProjectOwner,
                      isCurrentUser: true, // Flag to hide "View Portfolio" button
                    });
                  }

                  // 5. Standard Owner Injection
                  // Trigger: Owner is NOT Current User AND Owner is NOT Profile Owner (already filtered) AND Owner not in list
                  if (
                    !isUserProjectOwner &&
                    projectOwnerId &&
                    projectOwnerId !== profileOwnerId
                  ) {
                    const ownerInList = displayCollaborators.some(
                      (c) => c.uid === projectOwnerId
                    );
                    if (!ownerInList) {
                      displayCollaborators.unshift({
                        uid: projectOwnerId,
                        displayName: ownerData?.displayName || "Project Owner",
                        photoURL: ownerData?.photoURL || null,
                        role: ownerData?.role || "Owner",
                        isOwnerLabel: true,
                      });
                    }
                  }
                } else {
                  // === GUEST VIEW (User not logged in) ===

                  // 1. Filter out the Profile Owner to prevent redundancy
                  // (If we are viewing this on John's profile, remove John from the list)
                  if (profileOwnerId) {
                    displayCollaborators = displayCollaborators.filter(
                      (c) => c.uid !== profileOwnerId
                    );
                  }

                  // 2. Ensure Project Owner is visible
                  // (Unless the Project Owner IS the Profile Owner we just filtered out)
                  if (projectOwnerId && projectOwnerId !== profileOwnerId) {
                    const ownerAlreadyInList = displayCollaborators.some(
                      (c) => c.uid === projectOwnerId
                    );

                    if (!ownerAlreadyInList) {
                      displayCollaborators.unshift({
                        uid: projectOwnerId,
                        displayName: ownerData?.displayName || "Project Owner",
                        photoURL: ownerData?.photoURL || null,
                        role: ownerData?.role || "Owner",
                        isOwnerLabel: true,
                      });
                    }
                  }
                }

                if (displayCollaborators.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                      Collaborators
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {displayCollaborators.map((collab) => {
                        // 2. Button Logic
                        // Requirements:
                        // - Hide for Profile Owner.
                        // - Hide for "Hey, this is you" (isCurrentUser flag).
                        const showPortfolioButton =
                          collab.uid !== profileOwnerId &&
                          !collab.isCurrentUser;

                        return (
                          <div
                            key={collab.uid}
                            className={`flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl group hover:border-white/20 transition-all ${
                              collab.isOwnerLabel
                                ? "border-orange-500/30 bg-orange-500/5"
                                : ""
                            }`}
                          >
                            {/* Avatar */}
                            {collab.photoURL ? (
                              <img
                                src={collab.photoURL}
                                alt={collab.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-white/10 mt-1"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10 mt-1">
                                <User size={18} />
                              </div>
                            )}

                            {/* Details Column */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white truncate">
                                  {collab.displayName}
                                </p>
                                {/* Owner Label Visual */}
                                {collab.isOwnerLabel && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white uppercase tracking-wider">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate mb-2">
                                {collab.role || "Collaborator"}
                              </p>

                              {/* Glass Button Under Role */}
                              {showPortfolioButton && (
                                <a
                                  href={`/${collab.uid}/home`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-bold text-gray-300 hover:bg-orange-600 hover:text-white hover:border-orange-500/50 transition-all shadow-sm"
                                >
                                  View Portfolio <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-white/5 flex flex-col gap-3 mt-auto bg-black/20">
            {project.liveLink && (
              <a
                href={project.liveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ExternalLink size={18} /> Visit Live Demo
              </a>
            )}
            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Github size={18} /> View Code
              </a>
            )}
          </div>
        </div>
      </div>
      {/* NEW: Lightbox Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          {/* Close Lightbox */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <Minimize2 size={24} />
          </button>

          {/* Main Lightbox Content */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-12 relative">
            {/* Prev Button (Lightbox) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 md:left-8 p-4 bg-black/50 hover:bg-orange-600 text-white rounded-full transition-all z-50"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Media Display */}
            <div className="w-full h-full flex items-center justify-center">
              {currentMedia.type === "video" ? (
                <video
                  src={currentMedia.url}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
              ) : currentMedia.type === "json" ||
                currentMedia.url?.endsWith(".json") ? (
                // NEW: Lottie Player in Lightbox
                <div className="w-full h-full flex items-center justify-center max-w-4xl max-h-[80vh]">
                  <LottieRenderer
                    url={currentMedia.url}
                    className="w-full h-full"
                  />
                </div>
              ) : isPdf(currentMedia) ? (
                <div className="w-full h-full bg-white rounded-lg overflow-hidden relative max-w-5xl">
                  <embed
                    src={currentMedia.url}
                    type="application/pdf"
                    className="w-full h-full"
                  />
                  <div className="absolute bottom-6 right-6 z-10">
                    <a
                      href={getDownloadUrl(currentMedia.url)}
                      className="px-6 py-3 bg-orange-600 text-white rounded-xl flex items-center gap-2 hover:bg-orange-500 transition-colors shadow-xl font-bold"
                    >
                      <Download size={20} /> Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={currentMedia.url}
                  alt="Full Screen"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Next Button (Lightbox) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 md:right-8 p-4 bg-black/50 hover:bg-orange-600 text-white rounded-full transition-all z-50"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Caption in Lightbox */}
          {currentMedia.caption && (
            <div className="absolute bottom-8 px-6 py-3 bg-black/60 rounded-full text-white font-medium text-lg backdrop-blur-md">
              {currentMedia.caption}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

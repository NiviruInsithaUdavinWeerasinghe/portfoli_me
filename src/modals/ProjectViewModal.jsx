import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";

export default function ProjectViewModal({ project, isOpen, onClose }) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  // FIX: Reset index to 0 whenever the project changes to prevent out-of-bounds errors
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsMediaLoaded(false);
  }, [project]);

  // Reset loading state when navigating between media
  useEffect(() => {
    setIsMediaLoaded(false);
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

      <div className="relative w-full max-w-[90vw] h-[90vh] bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
        {" "}
        {/* --- LEFT SIDE: MEDIA VIEWER --- */}
        <div className="w-full md:w-2/3 bg-black/50 relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10 group">
          {/* Loading Spinner - Shows only when media is NOT loaded and NOT a PDF */}
          {!isMediaLoaded && !isPdf(currentMedia) && (
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

          {/* Thumbnails Indicator */}
          {mediaList.length > 1 && (
            <div className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-full px-4 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  {/* Always render the image thumbnail (works for images, PDFs, and now Videos) */}
                  <img
                    src={getThumbnailUrl(m)}
                    className="w-full h-full object-cover"
                    alt="thumb"
                  />
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
        <div className="w-full md:w-1/3 flex flex-col h-full bg-[#0B1120]">
          {/* Header Actions */}
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
    </div>,
    document.body
  );
}

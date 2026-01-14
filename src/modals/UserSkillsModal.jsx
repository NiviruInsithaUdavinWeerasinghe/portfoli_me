import React from "react";
import ReactDOM from "react-dom";
import { X, ArrowRight, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserSkillsModal({ isOpen, onClose, projects }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleViewProject = (projectId) => {
    onClose();
    // Navigate with state to trigger the glow effect
    navigate("../projects", { state: { highlightProjectId: projectId } });
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500 border border-orange-500/10">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Tech Stack
              </h2>
              <p className="text-xs text-gray-400">
                technologies used across projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {projects.filter((p) => p.tags && p.tags.length > 0).length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No projects with skills found.
            </div>
          ) : (
            projects
              .filter((p) => p.tags && p.tags.length > 0)
              .map((project) => (
                <div
                  key={project.id}
                  className="group bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all hover:bg-white/[0.07]"
                >
                  {/* Row 1: Title and Button */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h3 className="font-bold text-white text-sm truncate pr-2">
                      {project.title}
                    </h3>

                    {/* Button: Fixed to 1 line, strictly aligned */}
                    <button
                      onClick={() => handleViewProject(project.id)}
                      className="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/10 hover:bg-orange-500 hover:text-white transition-all"
                    >
                      View Project <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Row 2: Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0B1120] flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-bold text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

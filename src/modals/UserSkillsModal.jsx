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
      <div className="relative w-full max-w-2xl bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Skills</h2>
              <p className="text-sm text-gray-400">
                {" "}
                Technologies used across projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {projects.filter((p) => p.tags && p.tags.length > 0).length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No projects with skills found.
            </div>
          ) : (
            projects
              .filter((p) => p.tags && p.tags.length > 0)
              .map((project) => (
                <div
                  key={project.id}
                  className="group bg-gray-900/40 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {project.title}
                    </h3>
                    <button
                      onClick={() => handleViewProject(project.id)}
                      className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                    >
                      View Project <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        title={tag}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md max-w-[16ch] truncate cursor-default block"
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
        <div className="p-4 border-t border-white/5 bg-black/20 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

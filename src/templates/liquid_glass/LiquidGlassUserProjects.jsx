import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Trash2,
  Edit2,
  Github,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getUserProjects,
  addProject,
  updateProject,
  deleteProject,
  toggleProjectLike,
  getProjectComments,
} from "../../services/projectService";
import AddEditProjectModal from "../../modals/AddEditProjectModal";
import ProjectViewModal from "../../modals/ProjectViewModal";
import ProjectCommentModal from "../../modals/ProjectCommentModal";

export default function LiquidGlassUserProjects() {
  const { isEditMode } = useOutletContext();
  const { currentUser } = useAuth();

  // Highlighting Logic
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState(null);
  // NEW: State for highlighting the Add Button
  const [highlightAddBtn, setHighlightAddBtn] = useState(false);

  useEffect(() => {
    // 1. Existing Project Highlight Logic
    if (location.state?.highlightProjectId) {
      const id = location.state.highlightProjectId;
      setHighlightedId(id);

      const timer = setTimeout(() => {
        setHighlightedId(null);
        window.history.replaceState({}, document.title);
      }, 10000);
      return () => clearTimeout(timer);
    }

    // 2. NEW: Add Button Highlight Logic
    if (location.state?.highlightAddButton) {
      console.log("✨ [DEBUG] Highlighting 'Add Project' Button");
      setHighlightAddBtn(true);

      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightAddBtn(false);
        // Clear state so refresh doesn't trigger it again
        window.history.replaceState({}, document.title);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null); // For View or Edit
  const [selectedProjectForComments, setSelectedProjectForComments] =
    useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Define fetchProjects with useCallback
  const fetchProjects = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await getUserProjects(currentUser.uid);

      // Fetch comment counts for each project
      const projectsWithCounts = await Promise.all(
        data.map(async (project) => {
          const comments = await getProjectComments(
            currentUser.uid,
            project.id
          );
          return { ...project, commentsCount: comments.length };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch Projects from Firestore
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Handlers ---

  const handleOpenAdd = () => {
    setSelectedProject(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setShowAddEditModal(true);
  };

  const handleCloseAddEdit = () => {
    setShowAddEditModal(false);
    setSelectedProject(null);
  };

  const handleOpenView = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleSaveProject = async (formData) => {
    try {
      if (selectedProject?.id) {
        await updateProject(currentUser.uid, selectedProject.id, formData);
      } else {
        await addProject(currentUser.uid, formData);
      }
      setShowAddEditModal(false);
      fetchProjects();
    } catch (error) {
      alert("Failed to save project.");
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProject(currentUser.uid, projectToDelete);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete));
      setIsDeleteAlertOpen(false);
    } catch (error) {
      alert("Failed to delete project");
    }
  };

  // --- Likes & Comments ---
  const handleLike = async (e, project) => {
    e.stopPropagation();
    if (!currentUser) return; // Prevent if not logged in

    // Optimistic UI Update
    const isLiked = project.likedBy?.includes(currentUser.uid);
    const newLikesCount = (project.appreciation || 0) + (isLiked ? -1 : 1);
    const newLikedBy = isLiked
      ? project.likedBy.filter((id) => id !== currentUser.uid)
      : [...(project.likedBy || []), currentUser.uid];

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, appreciation: newLikesCount, likedBy: newLikedBy }
          : p
      )
    );

    try {
      // Assuming owner is currentUser for this dashboard view, or handle differently for public view
      // For dashboard, ownerId is currentUser.uid
      await toggleProjectLike(currentUser.uid, project.id, currentUser.uid);
    } catch (error) {
      console.error("Failed to toggle like", error);
      fetchProjects(); // Revert on error
    }
  };

  const handleOpenComments = (e, project) => {
    e.stopPropagation();
    setSelectedProjectForComments(project);
    setShowCommentModal(true);
  };

  // --- Filtering ---
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesStatus =
        filterStatus === "All" || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, filterStatus]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Projects
          </h2>
          <p className="text-gray-400">
            Manage and showcase your technical achievements.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 text-white"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
          </div>

          <div className="flex items-center bg-gray-900/40 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ListIcon size={18} />
            </button>
          </div>

          {isEditMode && (
            <button
              onClick={handleOpenAdd}
              className={`
                flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all duration-500 border-2
                ${
                  highlightAddBtn
                    ? "border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.6)] scale-110 z-20"
                    : "border-transparent"
                }
              `}
            >
              <Plus size={18} /> <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {["All", "Completed", "Ongoing", "On Hold"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors border-b-2 ${
              filterStatus === status
                ? "border-orange-500 text-orange-500 bg-orange-500/5"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* --- Grid/List --- */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-gray-900/20">
          <Search className="text-gray-500 mb-4" size={32} />
          <h3 className="text-xl font-semibold text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or add a new project.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {filteredProjects.map((project) =>
            viewMode === "grid" ? (
              <ProjectGridCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                isHighlighted={project.id === highlightedId}
                isEditMode={isEditMode}
                onClick={() => handleOpenView(project)}
                onEdit={(e) => handleOpenEdit(e, project)}
                onDelete={(e) => handleDeleteClick(e, project.id)}
                onLike={(e) => handleLike(e, project)}
                onComment={(e) => handleOpenComments(e, project)}
              />
            ) : (
              <ProjectListCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                isHighlighted={project.id === highlightedId}
                isEditMode={isEditMode}
                onClick={() => handleOpenView(project)}
                onEdit={(e) => handleOpenEdit(e, project)}
                onDelete={(e) => handleDeleteClick(e, project.id)}
                onLike={(e) => handleLike(e, project)}
                onComment={(e) => handleOpenComments(e, project)}
              />
            )
          )}
        </div>
      )}

      {/* --- Modals --- */}
      <ProjectViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        project={selectedProject}
      />

      <AddEditProjectModal
        isOpen={showAddEditModal}
        onClose={handleCloseAddEdit}
        initialData={selectedProject}
        onSave={handleSaveProject}
      />

      {/* New Comment Modal */}
      <ProjectCommentModal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        project={selectedProjectForComments}
        currentUser={currentUser}
      />

      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsDeleteAlertOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Delete Project?
            </h3>
            <p className="text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteAlertOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components ---

const ProjectGridCard = ({
  project,
  isEditMode,
  isHighlighted,
  currentUser,
  onClick,
  onEdit,
  onDelete,
  onLike,
  onComment,
}) => {
  const visibleTags = project.tags?.slice(0, 4) || [];
  const remainingCount = project.tags?.length - visibleTags.length;
  const CHAR_LIMIT = 12;
  const isLiked = project.likedBy?.includes(currentUser?.uid);

  // NEW: Date formatting logic
  const getFormattedDate = () => {
    if (!project.startDate) return null;

    const options = { year: "numeric", month: "short" };
    const start = new Date(project.startDate).toLocaleDateString(
      "en-US",
      options
    );

    const end = project.endDate
      ? new Date(project.endDate).toLocaleDateString("en-US", options)
      : "Present";

    return `${start} - ${end}`;
  };

  const dateString = getFormattedDate();

  return (
    <div
      onClick={onClick}
      className={`
        group relative backdrop-blur-md rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col h-full duration-500
        ${
          isHighlighted
            ? "bg-gray-900/60 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.02] z-20"
            : "bg-gray-900/40 border border-white/10 hover:border-orange-500/30 hover:shadow-2xl"
        }
      `}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.image || "https://via.placeholder.com/400"}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-1.5">
          {project.status === "Completed" ? (
            <CheckCircle2 size={12} className="text-green-400" />
          ) : (
            <Clock size={12} className="text-orange-500" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
            {project.status}
          </span>
        </div>
        {isEditMode && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-orange-400 rounded-lg hover:scale-105 transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-red-400 hover:text-red-500 rounded-lg hover:scale-105 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        {/* Updated Date Display */}
        {dateString && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-medium">
            <Calendar size={14} /> {dateString}
          </div>
        )}

        <h3
          title={project.title}
          className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors truncate"
        >
          {project.title}
        </h3>
        <div
          className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow break-all [&_p]:inline [&_ul]:inline [&_ol]:inline"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
        <div className="flex flex-col gap-4 pt-4 border-t border-white/5 mt-auto">
          <div className="flex flex-wrap items-center gap-2">
            {visibleTags.map((tag, i) => (
              <span
                key={i}
                title={tag.length > CHAR_LIMIT ? tag : ""}
                className="px-2 py-1 text-[10px] bg-white/5 text-gray-400 rounded border border-white/5 whitespace-nowrap"
              >
                {tag.length > CHAR_LIMIT
                  ? `${tag.substring(0, CHAR_LIMIT)}...`
                  : tag}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-[10px] text-orange-500 font-medium whitespace-nowrap">
                +{remainingCount} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Likes & Comments - Bottom Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={onLike}
                disabled={!currentUser}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  isLiked
                    ? "text-blue-500"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                <span>{project.appreciation || 0}</span>
              </button>
              <button
                onClick={onComment}
                disabled={!currentUser}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
              >
                <MessageSquare size={16} />
                <span>{project.commentsCount || 0}</span>
              </button>
            </div>

            {/* Links - Bottom Right */}
            <div className="flex items-center gap-3">
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="View Code"
                >
                  <Github size={18} />
                </a>
              )}
              {project.liveLink && (
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                  title="Live Demo"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectListCard = ({
  project,
  isEditMode,
  isHighlighted,
  currentUser,
  onClick,
  onEdit,
  onDelete,
  onLike,
  onComment,
}) => {
  const visibleTags = project.tags?.slice(0, 4) || [];
  const remainingCount = project.tags?.length - visibleTags.length;
  const CHAR_LIMIT = 15;
  const isLiked = project.likedBy?.includes(currentUser?.uid);

  // NEW: Date formatting logic
  const getFormattedDate = () => {
    if (!project.startDate) return null;

    const options = { year: "numeric", month: "short" };
    const start = new Date(project.startDate).toLocaleDateString(
      "en-US",
      options
    );

    const end = project.endDate
      ? new Date(project.endDate).toLocaleDateString("en-US", options)
      : "Present";

    return `${start} - ${end}`;
  };

  const dateString = getFormattedDate();

  return (
    <div
      onClick={onClick}
      className={`
        group flex flex-col sm:flex-row backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-500
        ${
          isHighlighted
            ? "bg-gray-900/60 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.01] z-20"
            : "bg-gray-900/40 border border-white/5 hover:border-white/10"
        }
      `}
    >
      <div className="sm:w-56 h-48 sm:h-auto relative flex-shrink-0">
        <img
          src={project.image || "https://via.placeholder.com/400"}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 p-6 flex flex-col">
        {/* Date Display Added Here */}
        {dateString && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
            <Calendar size={14} /> {dateString}
          </div>
        )}

        <div className="flex justify-between items-start mb-2 overflow-hidden">
          <h3
            title={project.title}
            className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors truncate pr-2"
          >
            {project.title}
          </h3>
          {isEditMode && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-white"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        <div
          className="text-gray-400 text-sm mb-5 line-clamp-2 break-all [&_p]:inline [&_ul]:inline [&_ol]:inline"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {visibleTags.map((tag, i) => (
              <span
                key={i}
                title={tag.length > CHAR_LIMIT ? tag : ""}
                className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded whitespace-nowrap"
              >
                {tag.length > CHAR_LIMIT
                  ? `${tag.substring(0, CHAR_LIMIT)}...`
                  : tag}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-orange-500 font-medium whitespace-nowrap">
                +{remainingCount} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Likes & Comments */}
            <div className="flex items-center gap-3">
              <button
                onClick={onLike}
                disabled={!currentUser}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  isLiked
                    ? "text-blue-500"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                <span>{project.appreciation || 0}</span>
              </button>
              <button
                onClick={onComment}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
              >
                <MessageSquare size={16} />
                <span>{project.commentsCount || 0}</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Github size={16} /> Code
                </a>
              )}
              {project.liveLink && (
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <ExternalLink size={16} /> Demo
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

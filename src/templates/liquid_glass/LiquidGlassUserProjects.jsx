import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom"; // NEW: Imported createPortal
import {
  useOutletContext,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  Plus,
  Search,
  LogIn,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Github,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MessageSquare,
  Info,
  ImageOff, // NEW: Added ImageOff icon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  addProject,
  updateProject,
  deleteProject,
  toggleProjectLike,
} from "../../services/projectService";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  collectionGroup,
  where,
} from "firebase/firestore";
import AddEditProjectModal from "../../modals/AddEditProjectModal";
import ProjectViewModal from "../../modals/ProjectViewModal";
import ProjectCommentModal from "../../modals/ProjectCommentModal";
import Lottie from "lottie-react"; // NEW: Import Lottie

// NEW: Helper component to fetch and play Lottie JSON from a URL
// NEW: Optimized Renderer that only loads when visible on screen
const LottieRenderer = ({ url, className }) => {
  const [animationData, setAnimationData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible to save resources
        }
      },
      { rootMargin: "100px" } // Start loading 100px before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !url) return;

    // Check if we already have it to prevent double fetching
    if (animationData) return;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load Lottie:", err));
  }, [isVisible, url, animationData]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={true}
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/5">
          {isVisible && (
            <Loader2 className="animate-spin text-orange-500" size={16} />
          )}
        </div>
      )}
    </div>
  );
};

export default function LiquidGlassUserProjects() {
  const navigate = useNavigate(); // NEW: Hook for redirection
  // UPDATED: Get headerLayout AND targetUid from context
  const { isEditMode, headerLayout, targetUid } = useOutletContext();
  const { currentUser } = useAuth();
  // const { username } = useParams(); // UPDATED: Removed

  // Identify who owns the profile we are viewing
  // UPDATED: Use targetUid from context (which is the resolved UID)
  // const targetUid = username || currentUser?.uid; // Removed logic, targetUid comes from context

  // Strict check: User must be logged in AND IDs must match to be owner
  const isOwner =
    currentUser?.uid && targetUid && currentUser.uid === targetUid;

  const effectiveEditMode = isOwner && isEditMode;

  // Highlighting Logic
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightAddBtn, setHighlightAddBtn] = useState(false);

  useEffect(() => {
    if (location.state?.highlightProjectId) {
      const id = location.state.highlightProjectId;
      setHighlightedId(id);
      const timer = setTimeout(() => {
        setHighlightedId(null);
        window.history.replaceState({}, document.title);
      }, 10000);
      return () => clearTimeout(timer);
    }
    if (location.state?.highlightAddButton) {
      setHighlightAddBtn(true);
      const timer = setTimeout(() => {
        setHighlightAddBtn(false);
        window.history.replaceState({}, document.title);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // NEW: Track which project is showing the login prompt
  const [loginPromptProjectId, setLoginPromptProjectId] = useState(null);

  const [projects, setProjects] = useState([]);
  // NEW: Separate states for owned vs. collaborated projects to merge them later
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [collabProjects, setCollabProjects] = useState([]);

  const [commentCounts, setCommentCounts] = useState({}); // New state for live comment counts

  // UPDATED: Granular loading states to ensure both sources load before showing content
  const [isOwnedLoading, setIsOwnedLoading] = useState(true);
  const [isCollabLoading, setIsCollabLoading] = useState(true);

  // Derived loading state: Only false when BOTH have loaded
  const loading = isOwnedLoading || isCollabLoading;

  // UI State
  // UPDATED: Initialize from local storage to remember state on reload, default to "list"
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem("project_view_mode");
    return savedMode || "list";
  });

  // NEW: Persist view mode changes to local storage
  useEffect(() => {
    localStorage.setItem("project_view_mode", viewMode);
  }, [viewMode]);

  // NEW: State for toggling visibility of hidden projects (Persisted)
  const [showHidden, setShowHidden] = useState(() => {
    const saved = localStorage.getItem("project_show_hidden");
    return saved !== null ? JSON.parse(saved) : true; // Default to showing hidden for owner
  });

  useEffect(() => {
    localStorage.setItem("project_show_hidden", JSON.stringify(showHidden));
  }, [showHidden]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectForComments, setSelectedProjectForComments] =
    useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // 1. Live Projects Listener (Handles Owned + Collaborating Projects)
  useEffect(() => {
    if (!targetUid) return;

    // Reset loading states when targetUid changes
    setIsOwnedLoading(true);
    setIsCollabLoading(true);

    // A. Listener for Projects Owned by targetUid
    const projectsRef = collection(db, "users", targetUid, "projects");
    const qOwned = query(projectsRef, orderBy("createdAt", "desc"));

    const unsubOwned = onSnapshot(
      qOwned,
      (snapshot) => {
        const liveOwned = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isOwned: true, // Helper flag
          ownerId: targetUid, // Explicitly set owner
        }));
        setOwnedProjects(liveOwned);
        setIsOwnedLoading(false); // Mark owned as loaded
      },
      (error) => console.error("Error listening to owned projects:", error)
    );

    // B. Listener for Projects where targetUid is a Collaborator
    // Note: This requires the "collaboratorIds" field we added in projectService
    const qCollab = query(
      collectionGroup(db, "projects"),
      where("collaboratorIds", "array-contains", targetUid)
    );

    const unsubCollab = onSnapshot(
      qCollab,
      (snapshot) => {
        const liveCollab = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isOwned: false, // Helper flag
          ownerId: doc.ref.parent.parent.id, // Capture the actual owner's UID from the doc reference
        }));
        setCollabProjects(liveCollab);
        setIsCollabLoading(false); // Mark collab as loaded
      },
      (error) => console.error("Error listening to collab projects:", error)
    );

    return () => {
      unsubOwned();
      unsubCollab();
    };
  }, [targetUid]);

  // Merge and Sort projects whenever source lists change
  useEffect(() => {
    const combined = [...ownedProjects, ...collabProjects];
    // Sort by createdAt desc (handling cases where createdAt might be missing/pending)
    combined.sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
    setProjects(combined);
    // Removed setLoading(false) here because loading is now derived
  }, [ownedProjects, collabProjects]);

  // 2. Live Comments Listener (Handles Comment Counts)
  useEffect(() => {
    const unsubscribers = [];

    projects.forEach((project) => {
      // UPDATED: Use the project's specific ownerId (needed for collab projects)
      const projectOwnerId = project.ownerId || targetUid;

      const commentsRef = collection(
        db,
        "users",
        projectOwnerId,
        "projects",
        project.id,
        "comments"
      );

      const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        setCommentCounts((prev) => ({
          ...prev,
          [project.id]: snapshot.size, // Real-time count
        }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [projects, targetUid]);

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
      // No fetchProjects needed; onSnapshot updates automatically
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

  const handleLike = async (e, project) => {
    e.stopPropagation();

    // NEW: Show beautiful in-card prompt instead of alert
    if (!currentUser) {
      setLoginPromptProjectId(project.id);
      return;
    }

    try {
      // Just call the service. The onSnapshot listener will update the UI.
      // UPDATED: Use project.ownerId to target the correct database path (for collaborator projects)
      await toggleProjectLike(
        project.ownerId || targetUid,
        project.id,
        currentUser.uid
      );
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  // NEW: Handle Profile-Specific Visibility
  const handleToggleVisibility = async (e, project) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      // Ensure we are working with an array
      const currentHiddenBy = Array.isArray(project.hiddenBy)
        ? project.hiddenBy
        : [];
      const isHidden = currentHiddenBy.includes(currentUser.uid);

      console.log(`Toggling Visibility for: ${project.title}`);
      console.log(`Current HiddenBy Array:`, currentHiddenBy);
      console.log(`Am I (${currentUser.uid}) in array?`, isHidden);

      // If hidden, remove ID. If visible, add ID.
      const newHiddenBy = isHidden
        ? currentHiddenBy.filter((id) => id !== currentUser.uid)
        : [...currentHiddenBy, currentUser.uid];

      console.log(`New HiddenBy Array to Save:`, newHiddenBy);

      // Update the project in the database
      // IMPORTANT: We only send { hiddenBy }.
      // If 'updateProject' in your service replaces the whole document, that is the bug.
      // But assuming it uses updateDoc (patch), this is safe.
      console.log(
        `Saving visibility for [${project.title}] to owner [${
          project.ownerId || targetUid
        }]`
      );

      await updateProject(project.ownerId || targetUid, project.id, {
        hiddenBy: newHiddenBy,
      });
    } catch (error) {
      console.error("Failed to toggle visibility", error);
      alert("Error updating visibility. Check console.");
    }
  };

  const handleOpenComments = (e, project) => {
    e.stopPropagation();
    setSelectedProjectForComments(project);
    setShowCommentModal(true);
  };

  const filteredProjects = useMemo(() => {
    // --- DEBUGGING LOGS START ---
    console.log(
      "%c--- Filter Calculation Start ---",
      "color: cyan; font-weight: bold;"
    );

    // 1. Check Permissions
    const amIProfileOwner =
      currentUser?.uid && targetUid && currentUser.uid === targetUid;
    console.log(`User: ${currentUser?.uid} | Target Profile: ${targetUid}`);
    console.log(
      `Permission: ${
        amIProfileOwner ? "OWNER (Show All)" : "VISITOR (Hide Hidden)"
      }`
    );

    // 2. Check Source Data (CRITICAL STEP)
    // If the project is missing from this list, the database update removed it from 'collabProjects'
    console.log("Source Projects Count:", projects.length);
    console.log(
      "Source Projects Titles:",
      projects.map((p) => p.title)
    );

    return projects
      .map((p) => {
        // Ensure hiddenBy is strictly an array
        const hiddenByArray = Array.isArray(p.hiddenBy) ? p.hiddenBy : [];
        const isHidden = hiddenByArray.includes(targetUid);

        return {
          ...p,
          commentsCount: commentCounts[p.id] || 0,
          isHiddenOnThisProfile: isHidden,
        };
      })
      .filter((project) => {
        const matchesSearch =
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          );
        const matchesStatus =
          filterStatus === "All" || project.status === filterStatus;

        // VISIBILITY LOGIC (Refined)
        if (project.isHiddenOnThisProfile) {
          // If it is hidden, we check if we are the owner
          if (amIProfileOwner) {
            // NEW: Respect the toggle state
            if (!showHidden) return false;

            // We are the owner and toggle is ON, so we KEEP it
            console.log(
              `[${project.title}] is Hidden, but I am Owner. -> KEEPING.`
            );
          } else {
            // We are a visitor, so we REMOVE it
            console.log(
              `[${project.title}] is Hidden, and I am Visitor. -> REMOVING.`
            );
            return false;
          }
        }

        return matchesSearch && matchesStatus;
      });
  }, [
    projects,
    searchQuery,
    filterStatus,
    commentCounts,
    currentUser,
    targetUid,
    showHidden, // Added dependency
  ]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );

  return (
    // UPDATED: Dynamic Slide Direction based on Header Layout
    <div
      className={`space-y-8 animate-in fade-in duration-700 ${
        headerLayout === "left"
          ? "slide-in-from-right-4"
          : "slide-in-from-bottom-4"
      }`}
    >
      {/* --- Page Header --- */}
      {/* FIXED: Keep 'lg:flex-row' to stack vertically on tablets. */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        {/* FIXED: Removed 'whitespace-nowrap' so text can wrap naturally on small mobile screens instead of being cut off */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Projects
            </h2>
          </div>
          <p className="text-gray-400">
            Manage and showcase your technical achievements.
          </p>
        </div>

        {/* FIXED: Main container uses sm:flex-row to align items horizontally sooner (on tablet/large phones) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Inner Container: Search and Toggles */}
          <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
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

            {/* NEW: Toggle Hidden Projects Button (Only for Owner) */}
            {isOwner && (
              <button
                onClick={() => setShowHidden(!showHidden)}
                title={
                  showHidden ? "Hide hidden projects" : "Show hidden projects"
                }
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  showHidden
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-500 hover:bg-orange-500/20"
                    : "bg-gray-900/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                }`}
              >
                {showHidden ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            )}

            <div className="flex items-center bg-gray-900/40 border border-white/10 rounded-xl p-1 w-fit">
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
          </div>

          {/* Add Button */}
          {effectiveEditMode && (
            <button
              onClick={handleOpenAdd}
              className={`
                flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all duration-500 border-2 w-full sm:w-auto whitespace-nowrap
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
            // FIXED: Added 'whitespace-nowrap' and 'flex-shrink-0' to prevent text clipping/wrapping and force horizontal scroll
            className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
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
            Try adjusting your filters
            {effectiveEditMode ? " or add a new project." : "."}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
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
                isEditMode={effectiveEditMode}
                isProfileOwner={isOwner} // NEW: Pass ownership status
                showLoginPrompt={loginPromptProjectId === project.id}
                onLoginRedirect={(e) => {
                  e.stopPropagation();
                  navigate("/login");
                }}
                onCloseLoginPrompt={(e) => {
                  e.stopPropagation();
                  setLoginPromptProjectId(null);
                }}
                onClick={() => handleOpenView(project)}
                onEdit={(e) => handleOpenEdit(e, project)}
                onDelete={(e) => handleDeleteClick(e, project.id)}
                onToggleVisibility={(e) => handleToggleVisibility(e, project)}
                onLike={(e) => handleLike(e, project)}
                onComment={(e) => handleOpenComments(e, project)}
              />
            ) : (
              <ProjectListCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                isHighlighted={project.id === highlightedId}
                isEditMode={effectiveEditMode}
                isProfileOwner={isOwner} // NEW: Pass ownership status
                showLoginPrompt={loginPromptProjectId === project.id}
                onLoginRedirect={(e) => {
                  e.stopPropagation();
                  navigate("/login");
                }}
                onCloseLoginPrompt={(e) => {
                  e.stopPropagation();
                  setLoginPromptProjectId(null);
                }}
                onClick={() => handleOpenView(project)}
                onEdit={(e) => handleOpenEdit(e, project)}
                onDelete={(e) => handleDeleteClick(e, project.id)}
                onToggleVisibility={(e) => handleToggleVisibility(e, project)}
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
        currentUser={currentUser}
        profileOwnerId={targetUid}
      />

      <AddEditProjectModal
        isOpen={showAddEditModal}
        onClose={handleCloseAddEdit}
        initialData={selectedProject}
        onSave={handleSaveProject}
      />

      {/* UPDATED: Pass correct ownerId. If it's a collab project, use its ownerId, else targetUid */}
      <ProjectCommentModal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        project={
          selectedProjectForComments
            ? {
                ...selectedProjectForComments,
                ownerId: selectedProjectForComments.ownerId || targetUid,
              }
            : null
        }
        currentUser={currentUser}
      />

      {isDeleteAlertOpen &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsDeleteAlertOpen(false)}
            />
            {/* Modal Card */}
            <div className="relative w-full max-w-sm bg-[#0B1120] border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300 overflow-hidden">
              {/* Red Glow Effect at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 opacity-50" />

              <div className="flex flex-col items-center text-center gap-4">
                {/* Icon Wrapper */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                  <Trash2 className="text-red-500" size={32} />
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Delete Project?
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    This will permanently delete this project and remove all
                    associated media. This action cannot be undone.
                  </p>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  <button
                    onClick={() => setIsDeleteAlertOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20 transition-all"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// Helper to request smaller images from Cloudinary to save RAM
const getOptimizedThumbnail = (url, width = 400) => {
  if (!url) return "https://via.placeholder.com/400";
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    // Insert transformation parameters: width 400, quality auto, format auto
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }
  return url;
};

// --- Sub-Components (Unchanged, included for completeness if needed) ---
// Wrap in React.memo to prevent re-rendering entire list when one thing changes
const ProjectGridCard = React.memo(
  ({
    project,
    isEditMode,
    isHighlighted,
    currentUser,
    isProfileOwner,
    showLoginPrompt,
    onLoginRedirect,
    onCloseLoginPrompt,
    onClick,
    onEdit,
    onDelete,
    onToggleVisibility,
    onLike,
    onComment,
  }) => {
    const isHiddenForMe =
      isProfileOwner && project.hiddenBy?.includes(currentUser?.uid);
    const visibleTags = project.tags?.slice(0, 4) || [];
    const remainingCount = project.tags?.length - visibleTags.length;
    const CHAR_LIMIT = 12;
    const isLiked = project.likedBy?.includes(currentUser?.uid);

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

    // Use optimized image URL
    const optimizedImage = useMemo(
      () => getOptimizedThumbnail(project.image),
      [project.image]
    );

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
        <div className="relative h-32 sm:h-48 overflow-hidden bg-black/20">
          {!project.image ? (
            // NEW: No Image Placeholder Design
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1120] via-[#161b2c] to-[#0B1120] transition-transform duration-500 group-hover:scale-110">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-white/5 border border-white/5 shadow-lg">
                  <ImageOff className="text-gray-600" size={24} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  No Preview
                </span>
              </div>
            </div>
          ) : project.image.endsWith(".json") ? (
            <div className="w-full h-full transition-transform duration-500 group-hover:scale-110 p-2">
              <LottieRenderer url={project.image} className="w-full h-full" />
            </div>
          ) : (
            <img
              src={optimizedImage} // USING OPTIMIZED URL
              alt={project.title}
              loading="lazy" // NATIVE BROWSER LAZY LOADING
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}

          {/* Status Badges */}
          {/* FIX: stacked in col on mobile, row on desktop */}
          <div className="absolute bottom-3 left-3 max-w-[calc(100%-1rem)] px-2.5 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 shadow-lg items-start">
            <div className="flex items-center gap-1.5">
              {project.status === "Completed" ? (
                <CheckCircle2 size={12} className="text-green-400" />
              ) : (
                <Clock size={12} className="text-orange-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 truncate">
                {project.status}
              </span>
            </div>
            {isHiddenForMe && (
              <div className="flex items-center gap-1 text-orange-400 sm:pl-2 sm:border-l sm:border-white/20">
                <EyeOff size={10} strokeWidth={3} />
                <span className="text-[9px] font-bold uppercase tracking-wide">
                  Hidden
                </span>
              </div>
            )}
          </div>

          {/* Edit Controls */}
          {isEditMode && (
            <div className="absolute top-3 right-3 flex gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
              <button
                onClick={onToggleVisibility}
                title={isHiddenForMe ? "Make Visible" : "Hide from others"}
                className={`p-1.5 sm:p-2 backdrop-blur-md border rounded-lg hover:scale-105 transition-all ${
                  isHiddenForMe
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white"
                    : "bg-black/40 border-white/10 text-white hover:text-gray-300"
                }`}
              >
                {isHiddenForMe ? (
                  <EyeOff size={12} className="sm:w-[14px] sm:h-[14px]" />
                ) : (
                  <Eye size={12} className="sm:w-[14px] sm:h-[14px]" />
                )}
              </button>
              {project.isOwned && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1.5 sm:p-2 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-orange-400 rounded-lg hover:scale-105 transition-all"
                  >
                    <Edit2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 sm:p-2 bg-black/40 backdrop-blur-md border border-white/10 text-red-400 hover:text-red-500 rounded-lg hover:scale-105 transition-all"
                  >
                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-6 flex flex-col flex-grow">
          {dateString && (
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-[10px] sm:text-xs text-gray-500 font-medium">
              <Calendar size={12} className="sm:w-[14px] sm:h-[14px]" />{" "}
              {dateString}
            </div>
          )}

          <h3
            title={project.title}
            className="text-sm sm:text-lg font-bold text-white mb-1.5 sm:mb-2 group-hover:text-orange-500 transition-colors truncate"
          >
            {project.title}
          </h3>

          <div
            className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-3 h-8 sm:h-[60px] break-words overflow-hidden leading-4 sm:leading-5 [&_*]:inline [&_*]:m-0 [&_*]:p-0"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />

          <div className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-white/5 mt-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] bg-white/5 text-gray-400 rounded border border-white/5 whitespace-nowrap"
                >
                  {tag.length > CHAR_LIMIT
                    ? `${tag.substring(0, CHAR_LIMIT)}...`
                    : tag}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-[9px] sm:text-[10px] text-orange-500 font-medium whitespace-nowrap">
                  +{remainingCount} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onLike}
                  className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold transition-colors ${
                    isLiked
                      ? "text-blue-500"
                      : "text-gray-500 hover:text-blue-500"
                  }`}
                >
                  <ThumbsUp
                    size={14}
                    className="sm:w-[16px] sm:h-[16px]"
                    fill={isLiked ? "currentColor" : "none"}
                  />
                  <span>{project.appreciation || 0}</span>
                </button>
                <button
                  onClick={onComment}
                  className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-white transition-colors"
                >
                  <MessageSquare
                    size={14}
                    className="sm:w-[16px] sm:h-[16px]"
                  />
                  <span>{project.commentsCount || 0}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Github size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </a>
                )}
                {project.liveLink && (
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    <ExternalLink
                      size={16}
                      className="sm:w-[18px] sm:h-[18px]"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {showLoginPrompt && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6 text-center border-2 border-orange-500/50 rounded-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <LogIn
                className="text-orange-500 sm:w-[24px] sm:h-[24px]"
                size={20}
              />
            </div>
            <h4 className="text-sm sm:text-lg font-bold text-white mb-1">
              Sign in to Like
            </h4>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              Join the community.
            </p>
            <div className="flex gap-2 sm:gap-3 w-full">
              <button
                onClick={onCloseLoginPrompt}
                className="flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onLoginRedirect}
                className="flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/20"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

const ProjectListCard = ({
  project,
  isEditMode,
  isHighlighted,
  currentUser,
  isProfileOwner, // NEW: Receive ownership status
  showLoginPrompt,
  onLoginRedirect,
  onCloseLoginPrompt,
  onClick,
  onEdit,
  onDelete,
  onToggleVisibility,
  onLike,
  onComment,
}) => {
  // Check if hidden for the current user AND we are on their profile
  const isHiddenForMe =
    isProfileOwner && project.hiddenBy?.includes(currentUser?.uid);

  // FIXED: Adjusted tag limits for mobile safety
  const visibleTags = project.tags?.slice(0, 3) || [];
  const remainingCount = project.tags?.length - visibleTags.length;
  const CHAR_LIMIT = 8;
  const isLiked = project.likedBy?.includes(currentUser?.uid);

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
      // REDESIGN: Kept flex-row. Added sm:rounded-2xl for responsive radius.
      className={`
        group flex flex-row backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-500
        ${
          isHighlighted
            ? "bg-gray-900/60 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.01] z-20"
            : "bg-gray-900/40 border border-white/5 hover:border-white/10"
        }
      `}
    >
      {/* REDESIGN: Reduced mobile width (w-24 vs w-28) to help aspect ratio and reduce height */}
      <div className="w-24 sm:w-56 relative flex-shrink-0 bg-black/20 overflow-hidden">
        {/* NEW: Check for Lottie JSON or Image */}
        {!project.image ? (
          // NEW: No Image Placeholder Design (Absolute positioning for List View)
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1120] via-[#161b2c] to-[#0B1120] transition-transform duration-500 group-hover:scale-110">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2">
              <div className="p-2 sm:p-3 rounded-full bg-white/5 border border-white/5 shadow-lg">
                <ImageOff className="text-gray-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              {/* Hidden on very small mobile to save space, visible on sm+ */}
              <span className="hidden sm:block text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                No Preview
              </span>
            </div>
          </div>
        ) : project.image?.endsWith(".json") ? (
          <div className="absolute inset-0 p-1">
            <LottieRenderer url={project.image} className="w-full h-full" />
          </div>
        ) : (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* REDESIGN: Adjusted positioning and sizing of badge for mobile */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-1.5 z-10">
          {project.status === "Completed" ? (
            <CheckCircle2
              size={10}
              className="text-green-400 sm:w-[12px] sm:h-[12px]"
            />
          ) : (
            <Clock
              size={10}
              className="text-orange-500 sm:w-[12px] sm:h-[12px]"
            />
          )}
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white/90">
            {project.status}
          </span>
        </div>
      </div>

      {/* REDESIGN: Reduced padding (p-2.5) and gap (gap-1) for compact height */}
      <div className="flex-1 p-2.5 sm:p-5 flex flex-col gap-1 sm:gap-1.5 min-w-0 justify-center">
        {/* Header: Date & Controls */}
        <div className="flex items-center justify-between">
          {dateString && (
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500 font-medium">
              <Calendar size={10} /> {dateString}
              {/* NEW: Indicator in list view */}
              {isHiddenForMe && (
                <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[8px] uppercase font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                  <EyeOff size={8} /> Hidden
                </span>
              )}
            </div>
          )}
          {/* UPDATED: Show actions if in edit mode. Hide is available for all, Edit/Delete only for owners */}
          {isEditMode && (
            <div className="flex gap-1">
              {/* NEW: Hide Button */}
              <button
                onClick={onToggleVisibility}
                title={isHiddenForMe ? "Make Visible" : "Hide from others"}
                className={`p-1 transition-colors ${
                  isHiddenForMe
                    ? "text-orange-500 hover:text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {isHiddenForMe ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              {project.isOwned && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          title={project.title}
          className="text-sm sm:text-xl font-bold text-white leading-tight truncate group-hover:text-orange-500 transition-colors"
        >
          {project.title}
        </h3>

        {/* REDESIGN: 
            1. line-clamp-1 on mobile to prevent height growth.
            2. text-[10px] for better fit.
        */}
        <div className="text-[10px] sm:text-sm text-gray-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: project.description }} />
        </div>

        {/* Footer: Tags & Stats */}
        {/* REDESIGN: border-t hidden on mobile to save space, added mt-1 */}
        <div className="mt-1 sm:mt-auto pt-1 sm:pt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 sm:border-0">
          {/* REDESIGN: HIDDEN Tags on mobile. This is the key fix for "too tall". Tags will only show on sm screens. */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] sm:text-xs bg-white/5 text-gray-400 rounded border border-white/5 whitespace-nowrap"
              >
                {tag.length > CHAR_LIMIT
                  ? `${tag.substring(0, CHAR_LIMIT)}...`
                  : tag}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-[9px] text-orange-500 font-medium">
                +{remainingCount}
              </span>
            )}
          </div>

          {/* Stats & Links - Always visible, pushed to right on mobile via w-full/justify-between */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-gray-500">
              <button
                onClick={onLike}
                className={`flex items-center gap-1 text-[10px] sm:text-xs transition-colors ${
                  isLiked
                    ? "text-blue-500"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <ThumbsUp size={12} fill={isLiked ? "currentColor" : "none"} />{" "}
                {project.appreciation || 0}
              </button>
              <button
                onClick={onComment}
                className="flex items-center gap-1 text-[10px] sm:text-xs hover:text-white"
              >
                <MessageSquare size={12} /> {project.commentsCount || 0}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  className="text-gray-500 hover:text-white"
                >
                  <Github size={14} />
                </a>
              )}
              {project.liveLink && (
                <a
                  href={project.liveLink}
                  target="_blank"
                  className="text-gray-500 hover:text-orange-500"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Login Prompt Overlay (List View) */}
      {showLoginPrompt && (
        <div className="absolute inset-0 z-50 flex flex-row items-center justify-between bg-gray-900/95 backdrop-blur-sm animate-in fade-in duration-200 px-2 sm:px-6 py-2 border-2 border-orange-500/50 rounded-xl sm:rounded-2xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center flex-shrink-0">
              <LogIn className="text-orange-500" size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Sign in to Like
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-400">
                Please login to continue.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onCloseLoginPrompt}
              className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onLoginRedirect}
              className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/20"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

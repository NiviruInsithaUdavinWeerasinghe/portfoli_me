import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  X,
  ArrowRight,
  Layers,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  LayoutGrid,
  List,
  Code2,
  Tag,
  Loader2, // Imported Loader
  Save, // Imported Save icon
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- FIREBASE IMPORTS ---
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function UserSkillsModal({
  isOpen,
  onClose,
  projects,
  profileOwnerId,
  isEditMode,
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 1. GET CONTEXT
  const outletContext = useOutletContext() || {};

  // 2. DETERMINE EFFECTIVE VALUES
  const effectiveEditMode = isEditMode ?? outletContext.isEditMode ?? false;
  const effectiveOwnerId = profileOwnerId ?? outletContext.targetUid;

  // --- CHECK PERMISSIONS ---
  const isOwner = currentUser?.uid === effectiveOwnerId;
  const canEdit = isOwner && effectiveEditMode;

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("organizer");
  const [categories, setCategories] = useState([]);
  const [pool, setPool] = useState([]);
  const [draggedSkill, setDraggedSkill] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [error, setError] = useState(null);

  // New Loading States
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. Filter Visible Projects ---
  const visibleProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    return projects.filter(
      (p) =>
        p.tags && p.tags.length > 0 && (!p.hiddenBy || p.hiddenBy.length === 0)
    );
  }, [projects]);

  // --- 2. Initialize Data (FETCH FROM FIRESTORE) ---
  useEffect(() => {
    const fetchSkillData = async () => {
      if (!isOpen || !effectiveOwnerId) return;

      setIsLoadingData(true);
      setError(null);

      try {
        // A. Get all available tags from visible projects
        const allTags = new Set(visibleProjects.flatMap((p) => p.tags));

        // B. Fetch the User's Profile to get the saved Skill Matrix
        const userRef = doc(db, "users", effectiveOwnerId);
        const userSnap = await getDoc(userRef);

        let savedCategories = [];
        if (userSnap.exists() && userSnap.data().skillMatrix) {
          savedCategories = userSnap.data().skillMatrix;
        }

        setCategories(savedCategories);

        // C. Calculate the Pool (All Tags - Categorized Skills)
        const categorizedSkills = new Set(
          savedCategories.flatMap((c) => c.skills)
        );
        const newPool = [...allTags].filter(
          (tag) => !categorizedSkills.has(tag)
        );
        setPool(newPool);
      } catch (err) {
        console.error("Error fetching skill matrix:", err);
        setError("Failed to load skills.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSkillData();
  }, [isOpen, effectiveOwnerId, visibleProjects]);

  // --- 3. SAVE HANDLER (Writes to Firestore) ---
  const handleSaveAndClose = async () => {
    // If not in edit mode, just close
    if (!canEdit) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", effectiveOwnerId);

      // Save the categories structure to 'skillMatrix' field
      await updateDoc(userRef, {
        skillMatrix: categories,
      });

      onClose();
    } catch (err) {
      console.error("Error saving skill matrix:", err);
      setError("Failed to save changes. Please try again.");
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // --- NAVIGATION HANDLER ---
  const handleViewProject = (projectId) => {
    onClose();
    navigate("../projects", { state: { highlightProjectId: projectId } });
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e, skill, source) => {
    if (!canEdit) return;
    setDraggedSkill(skill);
    setDragSource(source);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetId) => {
    if (!canEdit) return;
    e.preventDefault();
    if (!draggedSkill) return;

    // 1. Remove from source
    if (dragSource === "pool") {
      setPool((prev) => prev.filter((s) => s !== draggedSkill));
    } else {
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === dragSource) {
            return {
              ...cat,
              skills: cat.skills.filter((s) => s !== draggedSkill),
            };
          }
          return cat;
        })
      );
    }

    // 2. Add to target
    if (targetId === "pool") {
      setPool((prev) => [...prev, draggedSkill]);
    } else {
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === targetId) {
            if (!cat.skills.includes(draggedSkill)) {
              return { ...cat, skills: [...cat.skills, draggedSkill] };
            }
          }
          return cat;
        })
      );
    }
    setDraggedSkill(null);
    setDragSource(null);
  };

  // --- CATEGORY MANAGEMENT HANDLERS ---
  const addCategory = () => {
    setError(null);
    const newId = `cat-${Date.now()}`;
    const defaultTitle = "New Section";
    let titleToUse = defaultTitle;
    let counter = 1;

    while (
      categories.some((c) => c.title.toLowerCase() === titleToUse.toLowerCase())
    ) {
      titleToUse = `${defaultTitle} ${counter}`;
      counter++;
    }

    setCategories((prev) => [
      ...prev,
      { id: newId, title: titleToUse, skills: [] },
    ]);
    setEditingCategoryId(newId);
    setEditTitleValue(titleToUse);
  };

  const deleteCategory = (catId) => {
    const categoryToDelete = categories.find((c) => c.id === catId);
    if (categoryToDelete) {
      setPool((prev) => [...prev, ...categoryToDelete.skills]);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    }
  };

  const startEditing = (cat) => {
    setError(null);
    setEditingCategoryId(cat.id);
    setEditTitleValue(cat.title);
  };

  const saveTitle = (catId) => {
    const trimmedTitle = editTitleValue.trim();
    if (!trimmedTitle) {
      setError("Title cannot be empty");
      return;
    }
    const isDuplicate = categories.some(
      (c) =>
        c.id !== catId && c.title.toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (isDuplicate) {
      setError("Section name already exists");
      return;
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, title: trimmedTitle } : c))
    );
    setEditingCategoryId(null);
    setError(null);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/10">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Technical Expertise
              </h2>
              <p className="text-xs text-gray-400">
                {canEdit
                  ? "Manage your skill matrix and view project details"
                  : "Overview of technical skills and project breakdown"}
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

        {/* --- Tabs --- */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
            <button
              onClick={() => setActiveTab("organizer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "organizer"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={14} />
              Skill Matrix
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "projects"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <List size={14} />
              Project Breakdown
            </button>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isLoadingData ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : (
            <>
              {/* ================= TAB 1: SKILL ORGANIZER ================= */}
              {activeTab === "organizer" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Toolbar (Only Visible if Editing is Allowed) */}
                  {canEdit && (
                    <div className="flex items-center justify-between bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        <h3 className="text-sm font-bold text-orange-200 uppercase tracking-wider">
                          Editor Mode Active
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {error && (
                          <span className="text-xs text-red-400 font-medium animate-pulse bg-red-500/10 px-2 py-1 rounded">
                            {error}
                          </span>
                        )}
                        <button
                          onClick={addCategory}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded-lg shadow-lg shadow-orange-900/20 transition-all"
                        >
                          <Plus size={14} /> Add Section
                        </button>
                      </div>
                    </div>
                  )}

                  {/* === VIEW 1: EDITOR MODE (Drag & Drop) === */}
                  {canEdit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Uncategorized Pool */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "pool")}
                        className={`flex flex-col bg-[#0F1623] border border-white/10 rounded-xl p-4 min-h-[300px] transition-all ${
                          draggedSkill && dragSource !== "pool"
                            ? "border-orange-500/40 bg-orange-500/5 ring-1 ring-orange-500/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                          <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <List size={14} /> Uncategorized
                          </span>
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                            {pool.length}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-wrap content-start gap-2">
                          {pool.length === 0 && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 text-xs italic">
                              <Check size={24} className="mb-2 opacity-20" />
                              All skills categorized!
                            </div>
                          )}
                          {pool.map((skill) => (
                            <SkillPill
                              key={skill}
                              skill={skill}
                              source="pool"
                              canEdit={canEdit}
                              onDragStart={handleDragStart}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Categories */}
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, cat.id)}
                          className={`flex flex-col bg-white/5 border border-white/10 rounded-xl p-4 min-h-[300px] transition-all group relative ${
                            draggedSkill && dragSource !== cat.id
                              ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 h-9">
                            {editingCategoryId === cat.id ? (
                              <div className="flex items-center gap-1 w-full animate-in fade-in duration-200">
                                <input
                                  autoFocus
                                  type="text"
                                  value={editTitleValue}
                                  onChange={(e) =>
                                    setEditTitleValue(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && saveTitle(cat.id)
                                  }
                                  className={`bg-black/40 border rounded px-2 py-1.5 text-sm text-white w-full focus:outline-none ${
                                    error
                                      ? "border-red-500"
                                      : "border-orange-500"
                                  }`}
                                />
                                <button
                                  onClick={() => saveTitle(cat.id)}
                                  className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span
                                  className="text-sm font-bold text-white truncate max-w-[150px]"
                                  title={cat.title}
                                >
                                  {cat.title}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditing(cat)}
                                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex-1 flex flex-wrap content-start gap-2">
                            {cat.skills.length === 0 && (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs py-4 border-2 border-dashed border-white/5 rounded-lg">
                                Drop skills here
                              </div>
                            )}
                            {cat.skills.map((skill) => (
                              <SkillPill
                                key={skill}
                                skill={skill}
                                source={cat.id}
                                canEdit={canEdit}
                                onDragStart={handleDragStart}
                                variant="blue"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* === VIEW 2: VIEWER MODE (Clean Read-Only) === */
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {/* If NO categories created, simply show all skills in a cloud */}
                      {categories.length === 0 ? (
                        <div className="bg-[#0F1623] border border-white/5 rounded-2xl p-8 text-center">
                          {pool.length > 0 ? (
                            <>
                              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
                                <Code2 size={16} className="text-orange-500" />
                                All Technologies
                              </h4>
                              <div className="flex flex-wrap justify-center gap-2.5">
                                {pool.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 transition-colors"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                              <Layers size={48} className="mb-4 opacity-20" />
                              <p>No skills recorded yet.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* If categories exist, show them in a nice grid */
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((cat) => (
                              <div
                                key={cat.id}
                                className="bg-[#0F1623] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
                                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                  <h4 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                                    {cat.title}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {cat.skills.length > 0 ? (
                                    cat.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-200 border border-blue-500/20"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-600 italic">
                                      No skills listed.
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Show "Other Skills" if the pool still has items */}
                          {pool.length > 0 && (
                            <div className="bg-[#0F1623]/50 border border-dashed border-white/10 rounded-2xl p-6">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Tag size={14} /> Other Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {pool.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/5"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: PROJECTS LIST (Same for all) ================= */}
              {activeTab === "projects" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Visible Projects
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleProjects.length === 0 ? (
                      <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p className="text-gray-500 text-sm">
                          No visible projects found.
                        </p>
                      </div>
                    ) : (
                      visibleProjects.map((project) => (
                        <div
                          key={project.id}
                          className="group bg-[#0F1623] border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all hover:bg-[#131b2c] flex flex-col"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-orange-500 transition-colors">
                              {project.title}
                            </h4>
                            <button
                              onClick={() => handleViewProject(project.id)}
                              className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                            >
                              View <ArrowRight size={10} />
                            </button>
                          </div>
                          <div className="mt-auto flex flex-wrap gap-1.5">
                            {project.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-[4px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-4 border-t border-white/5 bg-[#0B1120] flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-500 italic">
            {canEdit ? "* Changes are saved when you click Done." : ""}
          </p>
          <button
            onClick={handleSaveAndClose}
            disabled={isSaving || isLoadingData}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
              isSaving
                ? "bg-orange-600 text-white cursor-wait"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {isSaving && <Loader2 size={12} className="animate-spin" />}
            {canEdit ? (isSaving ? "Saving..." : "Done & Save") : "Done"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Helper Component: Draggable Pill ---
const SkillPill = ({
  skill,
  source,
  onDragStart,
  canEdit, // Renamed for clarity
  variant = "default",
}) => {
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, skill, source)}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm select-none
        ${
          variant === "blue"
            ? "bg-blue-500/20 text-blue-200 border-blue-500/30"
            : "bg-white/5 text-gray-300 border-white/10"
        }
        ${
          canEdit
            ? "cursor-grab active:cursor-grabbing hover:border-white/30 hover:text-white"
            : "cursor-default"
        }
      `}
    >
      {canEdit && <GripVertical size={10} className="opacity-50" />}
      {skill}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Github,
  ExternalLink,
  Calendar,
  Layers,
  X,
  UploadCloud,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";

// --- MOCK DATA ---
const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "Finix - Personal Finance Tracker",
    description:
      "A comprehensive mobile application built for tracking personal expenses and income. Features include budget planning, visual analytics using MPAndroidChart, and local SQLite database storage for offline access.",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
    tags: ["Java", "Android SDK", "SQLite", "XML"],
    status: "Completed",
    date: "Nov 2025",
    githubLink: "https://github.com",
    liveLink: "https://play.google.com",
  },
  {
    id: 2,
    title: "River Range Resort Web App",
    description:
      "A hotel management booking system designed for a luxury resort. Includes a guest booking engine, admin dashboard for room management, and automated email confirmations using Nodemailer.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
    tags: ["React", "Node.js", "MongoDB", "Tailwind"],
    status: "Ongoing",
    date: "Dec 2025",
    githubLink: "https://github.com",
    liveLink: "https://riverrangeresort.com",
  },
  {
    id: 3,
    title: "GymTrack IoT System",
    description:
      "Smart gym equipment tracker using ESP8266 microcontrollers. Monitors usage patterns of gym machines and syncs data to Firebase Realtime Database for live analytics displayed on a React dashboard.",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000",
    tags: ["C++", "IoT", "Firebase", "ESP8266"],
    status: "Completed",
    date: "Nov 2025",
    githubLink: "https://github.com",
    liveLink: null,
  },
  {
    id: 4,
    title: "Mufaddal Traders POS",
    description:
      "Desktop-based Point of Sale and Inventory Management system developed for a local hardware store. Handles stock levels, invoicing, supplier management, and generates daily sales reports.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=1000",
    tags: ["C#", ".NET", "MSSQL", "WPF"],
    status: "Completed",
    date: "Dec 2024",
    githubLink: null,
    liveLink: null,
  },
  {
    id: 5,
    title: "PortfoliMe Platform",
    description:
      "A SaaS-like multi-user portfolio builder allows developers to showcase their work with dynamic themes. Built with high performance and scalability in mind using the MERN stack.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
    tags: ["React", "Vite", "Firebase Auth", "Tailwind"],
    status: "Ongoing",
    date: "Jan 2026",
    githubLink: "https://github.com",
    liveLink: "https://portfoli.me",
  },
];

export default function UserProjects() {
  const { isEditMode } = useOutletContext(); // Context from Layout
  const [projects, setProjects] = useState(INITIAL_PROJECTS);

  // UI State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // 'All' | 'Completed' | 'Ongoing'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // If null, we are adding. If set, we are editing.
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // --- Handlers ---

  const handleOpenAddModal = () => {
    setCurrentProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setCurrentProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = (formData) => {
    if (currentProject) {
      // Update existing
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProject.id
            ? { ...formData, id: currentProject.id }
            : p
        )
      );
    } else {
      // Add new
      const newId = Math.max(...projects.map((p) => p.id), 0) + 1;
      setProjects((prev) => [{ ...formData, id: newId }, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id) => {
    setProjectToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    setProjects((prev) => prev.filter((p) => p.id !== projectToDelete));
    setIsDeleteAlertOpen(false);
    setProjectToDelete(null);
  };

  // --- Filtering Logic ---
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- Page Header & Controls --- */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Projects</h2>
          <p className="text-gray-400">
            Manage and showcase your technical achievements.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[#0B1120] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-white placeholder:text-gray-600"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#0B1120] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ListIcon size={18} />
            </button>
          </div>

          {/* Add Button (Only in Edit Mode) */}
          {isEditMode && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5 active:scale-95"
            >
              <Plus size={18} />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* --- Filter Tabs --- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white/5">
        {["All", "Completed", "Ongoing"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
              filterStatus === status
                ? "border-orange-500 text-orange-500 bg-orange-500/5"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* --- Projects Grid/List --- */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-[#0B1120]/30">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 max-w-sm">
            We couldn't find any projects matching your search. Try adjusting
            your filters or search terms.
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
                isEditMode={isEditMode}
                onEdit={() => handleOpenEditModal(project)}
                onDelete={() => handleDeleteClick(project.id)}
              />
            ) : (
              <ProjectListCard
                key={project.id}
                project={project}
                isEditMode={isEditMode}
                onEdit={() => handleOpenEditModal(project)}
                onDelete={() => handleDeleteClick(project.id)}
              />
            )
          )}
        </div>
      )}

      {/* --- Modals --- */}
      {isModalOpen && (
        <ProjectFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={currentProject}
          onSave={handleSaveProject}
        />
      )}

      {isDeleteAlertOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteAlertOpen}
          onClose={() => setIsDeleteAlertOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Project Grid Card
// ============================================================================
const ProjectGridCard = ({ project, isEditMode, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/10 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] to-transparent opacity-80" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center gap-1.5">
          {project.status === "Completed" ? (
            <CheckCircle2 size={12} className="text-green-500" />
          ) : (
            <Clock size={12} className="text-orange-500" />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/90">
            {project.status}
          </span>
        </div>

        {/* Edit Actions Overlay */}
        {isEditMode && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-lg"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500">{project.date}</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
          {project.title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 text-xs rounded bg-white/5 text-gray-300 border border-white/5"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-500 border border-white/5">
              +{project.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer Links */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Github size={16} />
              <span>Code</span>
            </a>
          )}
          {project.liveLink && (
            <a
              href={project.liveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors ml-auto"
            >
              <ExternalLink size={16} />
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Project List Card
// ============================================================================
const ProjectListCard = ({ project, isEditMode, onEdit, onDelete }) => {
  return (
    <div className="group flex flex-col sm:flex-row bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
      {/* Image Thumbnail */}
      <div className="sm:w-48 h-48 sm:h-auto relative flex-shrink-0">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 sm:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">
                {project.title}
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  project.status === "Completed"
                    ? "border-green-500/30 text-green-500 bg-green-500/10"
                    : "border-orange-500/30 text-orange-500 bg-orange-500/10"
                }`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">{project.date}</p>
          </div>

          {/* Edit Actions (Desktop List View) */}
          {isEditMode && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {project.githubLink && (
              <a
                href={project.githubLink}
                className="text-gray-500 hover:text-white transition-colors"
                title="View Code"
              >
                <Github size={18} />
              </a>
            )}
            {project.liveLink && (
              <a
                href={project.liveLink}
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
  );
};

// ============================================================================
// SUB-COMPONENT: Delete Confirmation Modal
// ============================================================================
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#0B1120] border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Delete Project?
            </h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete this project? This action cannot
              be undone and will remove it from your portfolio permanently.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Project Form Modal (Add/Edit)
// ============================================================================
const ProjectFormModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Ongoing",
    date: "",
    githubLink: "",
    liveLink: "",
    tags: [],
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000", // Default placeholder
  });

  const [tagInput, setTagInput] = useState("");

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#020617] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">
            {initialData ? "Edit Project" : "Add New Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Image Upload Section (Mock) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Project Thumbnail
              </label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all cursor-pointer group text-center">
                {formData.image ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden group-hover:opacity-50 transition-opacity">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full">
                        Change Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud
                      className="text-gray-500 group-hover:text-orange-500 mb-3 transition-colors"
                      size={32}
                    />
                    <p className="text-sm text-gray-300 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      SVG, PNG, JPG or GIF (max. 3MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 2. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Project Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., E-Commerce Dashboard"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Completion Date
                </label>
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  placeholder="e.g., Dec 2025"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* 3. Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Project Status
              </label>
              <div className="flex gap-4">
                {["Ongoing", "Completed", "On Hold"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.status === status
                          ? "border-orange-500"
                          : "border-gray-600"
                      }`}
                    >
                      {formData.status === status && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span
                      className={`text-sm ${
                        formData.status === status
                          ? "text-white"
                          : "text-gray-500 group-hover:text-gray-300"
                      }`}
                    >
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the key features and goals of the project..."
                className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all resize-none"
              />
            </div>

            {/* 5. Tech Stack (Tags) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Tech Stack (Press Enter to add)
              </label>
              <div className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-2 py-2 flex flex-wrap gap-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-white/10 text-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1 animate-in zoom-in-50 duration-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={
                    formData.tags.length === 0
                      ? "e.g. React, Java, Firebase"
                      : ""
                  }
                  className="bg-transparent text-white outline-none flex-grow min-w-[100px] px-2 py-1 h-8"
                />
              </div>
            </div>

            {/* 6. Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Github size={14} /> GitHub Repository
                </label>
                <input
                  type="url"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleChange}
                  placeholder="https://github.com/username/repo"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <ExternalLink size={14} /> Live Demo URL
                </label>
                <input
                  type="url"
                  name="liveLink"
                  value={formData.liveLink}
                  onChange={handleChange}
                  placeholder="https://myproject.com"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0B1120]/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20 transition-all transform active:scale-95"
          >
            {initialData ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom"; // NEW: Import useNavigate
import {
  X,
  Send,
  Trash2,
  MessageCircle,
  LogIn, // NEW: Import LogIn Icon
  MoreVertical,
  CornerDownRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Edit2, // Added Edit Icon
  Check, // Added Check Icon for save
} from "lucide-react";
import {
  addProjectComment,
  deleteProjectComment,
  addCommentReply,
  updateProjectComment,
} from "../services/projectService";
import { db } from "../lib/firebase";
// UPDATED: Added doc, getDoc to fetch user profile for avatar
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

// --- Recursive Component for Comment Nodes ---
const CommentNode = ({
  comment,
  allComments,
  projectOwnerId,
  collaborators = [], // NEW: Accept collaborators list
  currentUser,
  activeMenuId,
  setActiveMenuId,
  deleteConfirmId,
  setDeleteConfirmId,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  // NEW PROPS FOR EDITING
  editingCommentId,
  setEditingCommentId,
  editText,
  setEditText,
  onEditSubmit,
  // ----------------
  onReplySubmit,
  onDeleteSubmit,
  depth = 0,
  onNavigate,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwnerComment = comment.userId === projectOwnerId;
  // NEW: Check if user is a collaborator (and not the owner)
  const isCollaborator =
    !isOwnerComment && collaborators?.some((c) => c.uid === comment.userId);

  const canReply = !!currentUser;
  // User can delete if they own the comment OR they own the project
  const canDelete =
    currentUser?.uid === comment.userId || currentUser?.uid === projectOwnerId;
  // User can ONLY edit if they own the specific comment
  const canEdit = currentUser?.uid === comment.userId;

  const isEditing = editingCommentId === comment.id;

  // Filter children for this node
  const children = allComments.filter((c) => c.parentId === comment.id);
  const hasChildren = children.length > 0;

  // Logic: If depth is 3 and has children, show "View replies" link instead of recursion
  const isMaxDepth = depth >= 3;

  // Text truncation logic
  const MAX_LENGTH = 150;
  const text = comment.text || "";
  const isLongText = text.length > MAX_LENGTH;

  return (
    <div className="flex flex-col mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      {/* Comment Row: Avatar + Content */}
      <div className="flex gap-3 group relative">
        {/* Avatar */}
        <div className="flex-shrink-0 z-10">
          {comment.userAvatar ? (
            <img
              src={comment.userAvatar}
              alt={comment.userName}
              // UPDATED: Added Border Logic for Collaborator (Blue) vs Owner (Orange)
              className={`w-8 h-8 rounded-full object-cover border-2 transition-all duration-300 group-hover:scale-105 ${
                isOwnerComment
                  ? "border-orange-500"
                  : isCollaborator
                  ? "border-blue-500"
                  : "border-white/10"
              }`}
            />
          ) : (
            <div
              // UPDATED: Added Background/Text Logic for Collaborator
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 group-hover:scale-105 ${
                isOwnerComment
                  ? "bg-orange-500/10 text-orange-500 border-orange-500"
                  : isCollaborator
                  ? "bg-blue-500/10 text-blue-500 border-blue-500"
                  : "bg-white/10 text-white border-white/10"
              }`}
            >
              {comment.userName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: Name + Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              // UPDATED: Name Color Logic
              className={`text-sm font-bold truncate transition-colors duration-200 ${
                isOwnerComment
                  ? "text-orange-500"
                  : isCollaborator
                  ? "text-blue-500"
                  : "text-white"
              }`}
            >
              {comment.userName}
            </span>
            {isOwnerComment && (
              <span className="text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1.5 rounded select-none">
                Owner
              </span>
            )}
            {/* NEW: Collaborator Badge */}
            {isCollaborator && (
              <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 rounded select-none">
                Collaborator
              </span>
            )}
          </div>

          {/* Content Logic */}
          {deleteConfirmId === comment.id ? (
            /* ... Delete Confirmation UI ... */
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle size={14} />
                <span>Delete?</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDeleteSubmit(comment.id)}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-black/40 border border-orange-500/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={() => onEditSubmit(comment.id)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
          ) : (
            // Normal Comment Bubble
            <div className="relative">
              <div
                // UPDATED: Bubble Background Logic
                className={`
                  p-3 rounded-2xl rounded-tl-none text-sm break-words leading-relaxed shadow-sm transition-colors duration-300
                  ${
                    isOwnerComment
                      ? "bg-gradient-to-br from-orange-500/20 to-orange-900/10 border border-orange-500/20 text-white"
                      : isCollaborator
                      ? "bg-gradient-to-br from-blue-500/20 to-blue-900/10 border border-blue-500/20 text-white"
                      : "bg-white/5 border border-white/5 text-gray-200 hover:bg-white/10 hover:border-white/10"
                  }
                `}
              >
                {/* Text Truncation Logic */}
                {isLongText && !isExpanded ? (
                  <>
                    {text.slice(0, MAX_LENGTH)}...
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="ml-2 text-xs font-bold text-orange-500 hover:text-orange-400 hover:underline transition-colors duration-200"
                    >
                      See more
                    </button>
                  </>
                ) : (
                  text
                )}
                {comment.editedAt && (
                  <span className="text-[10px] text-gray-500 ml-2 italic">
                    (edited)
                  </span>
                )}
              </div>

              {/* Dot Menu */}
              {(canReply || canDelete) && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out z-20 transform translate-y-1 group-hover:translate-y-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(
                        activeMenuId === comment.id ? null : comment.id
                      );
                    }}
                    className="p-1.5 text-gray-400 hover:text-white bg-[#0F1623] border border-white/10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-90"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Dropdown */}
                  {activeMenuId === comment.id && (
                    <div
                      className="absolute right-0 top-8 w-32 bg-[#0F1623] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out z-50 ring-1 ring-white/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canReply && (
                        <button
                          onClick={() => {
                            setReplyingTo(comment.id);
                            setActiveMenuId(null);
                            setShowReplies(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors duration-200 text-left active:bg-white/10"
                        >
                          <CornerDownRight
                            size={14}
                            className="text-orange-500"
                          />
                          Reply
                        </button>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditText(comment.text);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors duration-200 text-left active:bg-white/10"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteConfirmId(comment.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-left border-t border-white/5 active:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reply Input Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2 animate-in slide-in-from-left-4 fade-in duration-300 ease-out">
              <div className="w-4 border-b-2 border-l-2 border-gray-700 rounded-bl-xl h-4 -mt-2 opacity-50" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.userName}...`}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all duration-300"
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && onReplySubmit(comment.id)
                  }
                />
                <button
                  onClick={() => onReplySubmit(comment.id)}
                  className="p-2 bg-orange-600 rounded-xl text-white hover:bg-orange-500 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send size={16} />
                </button>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 active:rotate-90"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children or "New Page" Link */}
      {hasChildren && (
        <div className="ml-4 pl-4 border-l-2 border-white/5 mt-2 transition-all duration-300">
          {isMaxDepth ? (
            <button
              onClick={() => onNavigate(comment)}
              className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-all duration-200 py-2 group hover:translate-x-1"
            >
              <div className="w-4 h-px bg-orange-500/50 group-hover:bg-orange-400 transition-colors duration-200" />
              View {children.length}
              {" more "}
              {children.length === 1 ? "reply" : "replies"}
              <CornerDownRight size={12} />
            </button>
          ) : (
            <>
              {showReplies ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out origin-top">
                  {children.map((child) => (
                    <CommentNode
                      key={child.id}
                      comment={child}
                      allComments={allComments}
                      projectOwnerId={projectOwnerId}
                      collaborators={collaborators} // NEW: Pass recursively
                      currentUser={currentUser}
                      activeMenuId={activeMenuId}
                      setActiveMenuId={setActiveMenuId}
                      deleteConfirmId={deleteConfirmId}
                      setDeleteConfirmId={setDeleteConfirmId}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      // Pass Edit Props Down
                      editingCommentId={editingCommentId}
                      setEditingCommentId={setEditingCommentId}
                      editText={editText}
                      setEditText={setEditText}
                      onEditSubmit={onEditSubmit}
                      // ----------------
                      onReplySubmit={onReplySubmit}
                      onDeleteSubmit={onDeleteSubmit}
                      depth={depth + 1}
                      onNavigate={onNavigate}
                    />
                  ))}
                  {/* Collapser only if there are many items */}
                  {children.length > 2 && (
                    <button
                      onClick={() => setShowReplies(false)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-400 transition-all duration-200 mt-3 hover:-translate-y-0.5"
                    >
                      <div className="w-4 h-px bg-gray-800 transition-colors" />
                      <ChevronUp size={14} />
                      Hide replies
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowReplies(true)}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-orange-500 transition-all duration-200 py-1 hover:translate-x-1"
                >
                  <div className="w-4 h-px bg-gray-700 transition-colors duration-200 group-hover:bg-orange-500" />
                  <ChevronDown size={14} />
                  View {children.length}{" "}
                  {children.length === 1 ? "reply" : "replies"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function ProjectCommentModal({
  isOpen,
  onClose,
  project,
  currentUser,
}) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const [dbPhotoURL, setDbPhotoURL] = useState(null);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!currentUser?.uid) return;
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setDbPhotoURL(userDocSnap.data().photoURL);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };
    fetchUserAvatar();
  }, [currentUser]);

  // Navigation Stack for "New Page" Logic
  const [navStack, setNavStack] = useState([]);

  // Shared Interaction State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // NEW: State for Editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");

  const commentsEndRef = useRef(null);
  const projectOwnerId = project?.ownerId;
  // NEW: Extract Collaborators List
  const collaborators = project?.collaborators || [];

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenuId]);

  // LIVE DATA LISTENER
  useEffect(() => {
    if (!isOpen || !project || !projectOwnerId) return;

    setLoading(true);
    const commentsRef = collection(
      db,
      "users",
      projectOwnerId,
      "projects",
      project.id,
      "comments"
    );
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to comments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, project, projectOwnerId]);

  const handleSend = async () => {
    if (!newComment.trim() || !currentUser || !projectOwnerId) return;
    try {
      await addProjectComment(projectOwnerId, project.id, {
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        userAvatar: dbPhotoURL || currentUser.photoURL,
        text: newComment,
      });
      setNewComment("");
      setTimeout(
        () =>
          commentsEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        100
      );
    } catch (error) {
      console.error("Failed to send comment", error);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() || !projectOwnerId) return;
    try {
      await addCommentReply(projectOwnerId, project.id, parentId, {
        text: replyText,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        userAvatar: dbPhotoURL || currentUser.photoURL,
        text: replyText,
      });
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to reply", error);
    }
  };

  const handleDeleteSubmit = async (commentId) => {
    try {
      await deleteProjectComment(projectOwnerId, project.id, commentId);
      setDeleteConfirmId(null);

      // Auto-navigate back if this was the last comment in the thread
      if (navStack.length > 0) {
        const currentRoot = navStack[navStack.length - 1];
        const commentsInView = comments.filter(
          (c) => c.parentId === currentRoot.id
        );
        if (commentsInView.length === 1 && commentsInView[0].id === commentId) {
          setNavStack((prev) => prev.slice(0, -1));
        }
      }
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleEditSubmit = async (commentId) => {
    if (!editText.trim() || !projectOwnerId) return;
    try {
      await updateProjectComment(
        projectOwnerId,
        project.id,
        commentId,
        editText
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to edit comment", error);
    }
  };

  // Navigation Handlers
  const handleNavigate = (comment) => {
    setNavStack((prev) => [...prev, comment]);
  };

  const handleBack = () => {
    setNavStack((prev) => prev.slice(0, -1));
  };

  const handleModalClose = () => {
    setNavStack([]);
    onClose();
  };

  // Determine what to display based on navigation stack
  const currentThreadRoot =
    navStack.length > 0 ? navStack[navStack.length - 1] : null;

  // Filter comments for current view
  const visibleComments = comments.filter((c) =>
    currentThreadRoot ? c.parentId === currentThreadRoot.id : !c.parentId
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ease-in-out"
        onClick={handleModalClose}
      />

      <div className="relative w-full max-w-lg h-[80vh] bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            {navStack.length > 0 ? (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 hover:-translate-x-1 flex items-center gap-1 pr-3"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back</span>
              </button>
            ) : (
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <MessageCircle size={20} />
              </div>
            )}

            <div
              className={`transition-all duration-300 ${
                navStack.length > 0 ? "border-l border-white/10 pl-3" : ""
              }`}
            >
              <h3 className="text-white font-bold text-lg leading-tight animate-in fade-in duration-300">
                {navStack.length > 0 ? "Thread" : "Discussion"}
              </h3>
              <p className="text-xs text-gray-400">
                {navStack.length > 0
                  ? `Replying to ${currentThreadRoot?.userName}`
                  : `${comments.length} ${
                      comments.length === 1 ? "comment" : "comments"
                    }`}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200 hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thread Context (Top comment in new page) */}
        {currentThreadRoot && (
          <div className="bg-black/20 p-4 border-b border-white/5 animate-in slide-in-from-right-4 duration-300 ease-out">
            <div className="flex gap-3 opacity-80">
              {currentThreadRoot.userAvatar ? (
                <img
                  src={currentThreadRoot.userAvatar}
                  className="w-6 h-6 rounded-full border border-white/10 object-cover"
                  alt=""
                />
              ) : (
                <div className="w-6 h-6 rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                  {currentThreadRoot.userName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">
                    {currentThreadRoot.userName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(
                      currentThreadRoot.createdAt?.toDate()
                    ).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {currentThreadRoot.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 animate-in fade-in duration-500">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
              <span className="text-sm">Loading thoughts...</span>
            </div>
          ) : visibleComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 animate-in fade-in zoom-in-95 duration-500">
              <MessageCircle size={40} className="text-gray-700" />
              <p>No replies yet. Start the conversation!</p>
            </div>
          ) : (
            visibleComments.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                allComments={comments}
                projectOwnerId={projectOwnerId}
                collaborators={collaborators} // NEW: Pass collaborators here
                currentUser={currentUser}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                deleteConfirmId={deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onReplySubmit={handleReplySubmit}
                // Pass Edit Props
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                editText={editText}
                setEditText={setEditText}
                onEditSubmit={handleEditSubmit}
                // ----------------
                onDeleteSubmit={handleDeleteSubmit}
                depth={0}
                onNavigate={handleNavigate}
              />
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Footer Input or Login Prompt */}
        {currentUser ? (
          <div className="p-5 bg-black/20 border-t border-white/5 backdrop-blur-md z-20">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-2 py-2 focus-within:bg-white/10 focus-within:border-orange-500/30 focus-within:shadow-lg focus-within:shadow-orange-500/10 transition-all duration-300 ease-in-out">
              {dbPhotoURL || currentUser.photoURL ? (
                <img
                  src={dbPhotoURL || currentUser.photoURL}
                  alt="Me"
                  className="w-8 h-8 rounded-full object-cover border border-white/10 ml-2 transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-bold border border-white/10 ml-2 transition-transform duration-300 hover:scale-105">
                  {(currentUser.displayName || currentUser.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:ring-0 focus:outline-none py-2"
              />
              <button
                onClick={handleSend}
                disabled={!newComment.trim()}
                className="p-2.5 bg-orange-600 rounded-xl text-white hover:bg-orange-500 disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-sm text-gray-400">
              Sign in to share your thoughts and ask questions.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-900/20"
            >
              <LogIn size={16} />
              Log in to Comment
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

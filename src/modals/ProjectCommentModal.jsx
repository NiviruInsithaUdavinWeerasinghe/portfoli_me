import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  CornerDownRight,
} from "lucide-react";
import {
  getProjectComments,
  addProjectComment,
  deleteProjectComment,
  addCommentReply,
} from "../services/projectService";

export default function ProjectCommentModal({
  isOpen,
  onClose,
  project,
  currentUser,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // commentId

  // Ref for the comments end to auto-scroll
  const commentsEndRef = useRef(null);

  const isOwner =
    currentUser?.uid === project?.ownerId ||
    currentUser?.uid === project?.userId; // Adjust based on how ownerId is stored

  useEffect(() => {
    if (isOpen && project) {
      loadComments();
    }
  }, [isOpen, project]);

  const loadComments = async () => {
    setLoading(true);
    // Assuming project has an ownerId field, or we use the passed prop logic.
    // In LiquidGlassUserProjects context, the project belongs to the profile being viewed.
    // If viewing own projects, currentUser.uid is the owner.
    const ownerId = project.ownerId || currentUser?.uid;
    const data = await getProjectComments(ownerId, project.id);
    setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      const ownerId = project.ownerId || currentUser?.uid;
      await addProjectComment(ownerId, project.id, {
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        userAvatar: currentUser.photoURL,
        text: newComment,
      });
      setNewComment("");
      loadComments();
    } catch (error) {
      console.error("Failed to send comment", error);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const ownerId = project.ownerId || currentUser?.uid;
      await deleteProjectComment(ownerId, project.id, commentId);
      loadComments();
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const ownerId = project.ownerId || currentUser?.uid;
      await addCommentReply(ownerId, project.id, commentId, {
        text: replyText,
        createdAt: new Date(),
        userName: currentUser.displayName || "Owner",
        userAvatar: currentUser.photoURL,
      });
      setReplyText("");
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error("Failed to reply", error);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-md h-[600px] bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0B1120] z-10">
          <h3 className="text-white font-bold">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List (Scrollable, Hidden Scrollbar) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {loading ? (
            <div className="text-center text-gray-500 py-10">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <img
                    src={comment.userAvatar || "https://via.placeholder.com/40"}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full border border-white/10 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white mr-2">
                        {comment.userName}
                      </span>
                      {/* Delete option for comment owner */}
                      {currentUser?.uid === comment.userId && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{comment.text}</p>

                    {/* Reply Button (Owner only, no nested replies) */}
                    {isOwner && !comment.reply && !replyingTo && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-orange-500 font-medium mt-2 hover:underline"
                      >
                        Reply
                      </button>
                    )}

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleReply(comment.id)}
                          className="p-1.5 bg-orange-600 rounded-lg text-white hover:bg-orange-700"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="p-1.5 text-gray-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Reply */}
                {comment.reply && (
                  <div className="ml-11 mt-3 flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <img
                      src={
                        comment.reply.userAvatar ||
                        "https://via.placeholder.com/40"
                      }
                      alt={comment.reply.userName}
                      className="w-6 h-6 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-500">
                          {comment.reply.userName}
                        </span>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          Owner
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-0.5">
                        {comment.reply.text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Footer Input */}
        {currentUser && (
          <div className="p-4 bg-[#0B1120] border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-gray-600"
              />
              <button
                onClick={handleSend}
                disabled={!newComment.trim()}
                className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

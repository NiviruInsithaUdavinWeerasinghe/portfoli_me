import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const getUserProjects = async (userId) => {
  try {
    const projectsRef = collection(db, "users", userId, "projects");
    const q = query(projectsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const addProject = async (userId, projectData) => {
  try {
    const projectsRef = collection(db, "users", userId, "projects");
    await addDoc(projectsRef, {
      ...projectData,
      appreciation: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding project:", error);
    throw error;
  }
};

export const updateProject = async (userId, projectId, projectData) => {
  try {
    const projectRef = doc(db, "users", userId, "projects", projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (userId, projectId) => {
  try {
    const projectRef = doc(db, "users", userId, "projects", projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// --- LIKES SYSTEM ---
export const toggleProjectLike = async (projectOwnerId, projectId, userId) => {
  try {
    const projectRef = doc(db, "users", projectOwnerId, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const data = projectSnap.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        await updateDoc(projectRef, {
          likedBy: arrayRemove(userId),
          appreciation: increment(-1),
        });
      } else {
        await updateDoc(projectRef, {
          likedBy: arrayUnion(userId),
          appreciation: increment(1),
        });
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

// --- COMMENTS SYSTEM ---
export const getProjectComments = async (projectOwnerId, projectId) => {
  try {
    const commentsRef = collection(
      db,
      "users",
      projectOwnerId,
      "projects",
      projectId,
      "comments"
    );
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const addProjectComment = async (
  projectOwnerId,
  projectId,
  commentData
) => {
  try {
    const commentsRef = collection(
      db,
      "users",
      projectOwnerId,
      "projects",
      projectId,
      "comments"
    );
    await addDoc(commentsRef, {
      ...commentData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const deleteProjectComment = async (
  projectOwnerId,
  projectId,
  commentId
) => {
  try {
    const commentRef = doc(
      db,
      "users",
      projectOwnerId,
      "projects",
      projectId,
      "comments",
      commentId
    );
    await deleteDoc(commentRef);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export const addCommentReply = async (
  projectOwnerId,
  projectId,
  commentId,
  replyData
) => {
  try {
    const commentRef = doc(
      db,
      "users",
      projectOwnerId,
      "projects",
      projectId,
      "comments",
      commentId
    );
    await updateDoc(commentRef, {
      reply: replyData, // Single level reply embedded
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
};

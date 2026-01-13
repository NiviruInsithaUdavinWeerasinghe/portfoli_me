import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where, // NEW: Added for querying child comments
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

    // NEW: Extract just the UIDs into a separate array for efficient querying
    // This allows us to use 'array-contains' in Firestore queries
    const collaboratorIds = projectData.collaborators?.map((c) => c.uid) || [];

    await addDoc(projectsRef, {
      ...projectData,
      collaboratorIds, // Saved as ["uid1", "uid2"]
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

    // 1. Create a payload with the basic data
    const updatePayload = {
      ...projectData,
      updatedAt: serverTimestamp(),
    };

    // 2. ONLY update collaboratorIds if 'collaborators' is actually in the update data
    // This prevents wiping them out when doing partial updates (like hiding)
    if (projectData.collaborators) {
      updatePayload.collaboratorIds = projectData.collaborators.map(
        (c) => c.uid
      );
    }

    await updateDoc(projectRef, updatePayload);
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
    // We order by CreatedAt to keep the conversation linear in time
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
    const commentsRef = collection(
      db,
      "users",
      projectOwnerId,
      "projects",
      projectId,
      "comments"
    );

    // 1. Find all direct replies (children) where parentId matches this comment
    const q = query(commentsRef, where("parentId", "==", commentId));
    const snapshot = await getDocs(q);

    // 2. Recursively delete each child first
    // This ensures that if a child has its own replies, they get deleted too
    const deletePromises = snapshot.docs.map((doc) =>
      deleteProjectComment(projectOwnerId, projectId, doc.id)
    );
    await Promise.all(deletePromises);

    // 3. Delete the actual comment document
    const commentRef = doc(commentsRef, commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error("Error deleting comment and replies:", error);
    throw error;
  }
};

// NEW: Update function for editing comments
export const updateProjectComment = async (
  projectOwnerId,
  projectId,
  commentId,
  newText
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
      text: newText,
      // Optional: Add an editedAt timestamp if you want to show "(edited)" later
      editedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

// REFACTORED: Now adds a new document with a parentId instead of updating a field.
// This supports infinite nesting.
export const addCommentReply = async (
  projectOwnerId,
  projectId,
  parentId,
  replyData
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
      ...replyData,
      parentId: parentId, // Link to the parent comment
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
};

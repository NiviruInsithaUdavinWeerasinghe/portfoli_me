//C:\PortfoliMe\portfoli_me\src\services\profileOverviewService.jsx

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Fetches the user's profile data (Name, Role, Bio, Images).
 */
export const fetchUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("No user profile found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Updates specific fields in the user profile (Bio, Role, Images).
 */
export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Updates the User's Online Status.
 */
export const updateUserStatus = async (userId, isOnline) => {
  try {
    const userRef = doc(db, "users", userId);
    // We use setDoc with merge: true in case the doc doesn't exist yet
    await setDoc(
      userRef,
      {
        isOnline: isOnline,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

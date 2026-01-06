import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFileToCloudinary } from "./cloudinaryService";

export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.warn("User document not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const uploadProfilePicture = async (file) => {
  try {
    const result = await uploadFileToCloudinary(file);
    return result.url;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

// api/profile.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

// 1. Setup Firebase (We define it here because api/ runs separately from src/)
const firebaseConfig = {
  apiKey: "AIzaSyDMMf-S1kzNMIWBxU5jFonGIfWcWh7S0c8",
  authDomain: "portfolime-d977a.firebaseapp.com",
  projectId: "portfolime-d977a",
  storageBucket: "portfolime-d977a.firebasestorage.app",
  messagingSenderId: "618987266334",
  appId: "1:618987266334:web:1a26d2f5b247916a75690f",
  measurementId: "G-PVQE0QZBGW",
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    // 2. Fetch the LIVE index.html
    const builtFileUrl = "https://portfolime-roan.vercel.app/index.html";
    const response = await fetch(builtFileUrl);
    if (!response.ok) throw new Error("Failed to fetch index.html");
    let html = await response.text();

    // 3. Fetch User Data from Firestore
    let userData = null;

    try {
      // Strategy A: Try to find user by 'username' field
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data();
      } else {
        // Strategy B: If not found, maybe the URL contains the UID directly?
        // Let's check if a doc exists with ID = username
        const docRef = doc(db, "users", username);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          userData = docSnap.data();
        }
      }
    } catch (dbError) {
      console.error("Database Error:", dbError);
    }

    // 4. Determine final Dynamic Data
    // Use fetched data, or fallbacks if user not found
    const realName = userData?.displayName || userData?.name || username;
    const realBio =
      userData?.bio ||
      `Check out ${realName}'s projects and skills on PortfoliMe.`;

    // IMAGE LOGIC:
    // If they have a custom avatar, use it.
    // If not, generate a specialized avatar using their name (Free service).
    const realImage =
      userData?.avatar ||
      userData?.photoURL ||
      `https://ui-avatars.com/api/?name=${realName}&background=0D8ABC&color=fff&size=512`;

    // 5. Replace tags in HTML
    html = html
      .replace(
        /PortfoliMe - Create Your Portfolio/g,
        `${realName}'s Portfolio | PortfoliMe`
      )
      .replace(
        /Showcase your projects and skills with a beautiful portfolio./g,
        realBio
      )
      .replace(/https:\/\/portfolime-roan.vercel.app\/logo512.png/g, realImage);

    // 6. Send response
    res.setHeader("Content-Type", "text/html");
    // Cache for 10 seconds to reduce DB reads, but allow quick updates
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error in profile preview:", error);
    return res.status(500).send("Internal Server Error");
  }
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
} from "firebase/auth"; // Updated import
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMMf-S1kzNMIWBxU5jFonGIfWcWh7S0c8",
  authDomain: "portfolime-d977a.firebaseapp.com",
  projectId: "portfolime-d977a",
  storageBucket: "portfolime-d977a.firebasestorage.app",
  messagingSenderId: "618987266334",
  appId: "1:618987266334:web:1a26d2f5b247916a75690f",
  measurementId: "G-PVQE0QZBGW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider(); // Initialize Twitter/X Provider

// Export them for use in other files
export { auth, db, app, googleProvider, githubProvider, twitterProvider };

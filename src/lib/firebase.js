// src/lib/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Added for Authentication
import { getFirestore } from "firebase/firestore"; // Added for Database

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

// Export them for use in other files
export { auth, db, app };

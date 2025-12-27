import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  githubProvider,
  twitterProvider,
} from "../lib/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  function googleSignIn() {
    return signInWithPopup(auth, googleProvider);
  }

  // Sign in with GitHub
  function githubSignIn() {
    return signInWithPopup(auth, githubProvider);
  }

  // Sign in with Twitter/X
  function twitterSignIn() {
    return signInWithPopup(auth, twitterProvider);
  }

  // Sign up with Email/Password
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login with Email/Password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Reset Password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Monitor Auth State (Logged in or not)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    googleSignIn,
    githubSignIn,
    twitterSignIn,
    signup,
    login,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser 
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export interface UserAuth {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserAuth | null;
  loading: boolean;
  isFirebaseActive: boolean;
  googleAccessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  connectYouTubeSubscriptions: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseActive: false,
  googleAccessToken: null,
  signInWithGoogle: async () => {},
  connectYouTubeSubscriptions: async () => null,
  signOut: async () => {},
});

const DEMO_USER_KEY = "citradhara_demo_user";
const YT_TOKEN_KEY = "citradhara_google_yt_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing saved token
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem(YT_TOKEN_KEY);
      if (savedToken) setGoogleAccessToken(savedToken);
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          setUser(null);
          setGoogleAccessToken(null);
          localStorage.removeItem(YT_TOKEN_KEY);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local demo mode: check stored demo user
      try {
        const saved = localStorage.getItem(DEMO_USER_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          setUser({
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL,
          });
        }

        // Extract Google OAuth Access Token for YouTube API calls
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || null;
        if (token) {
          setGoogleAccessToken(token);
          localStorage.setItem(YT_TOKEN_KEY, token);
        }
      } catch (error: any) {
        console.warn("Google Sign-in status:", error?.code, error?.message);
        // If Google provider is not yet enabled in Firebase Console, fallback gracefully
        if (
          error?.code === "auth/configuration-not-found" ||
          error?.code === "auth/operation-not-allowed" ||
          error?.message?.includes("CONFIGURATION_NOT_FOUND")
        ) {
          console.info(
            "Firebase Google Sign-In is not yet enabled in Firebase Console. Logging in via Community Creator session so you can test immediately."
          );
          const mockUser: UserAuth = {
            uid: "user_citradhara_creator",
            displayName: "Citradhara Creator",
            email: "creator@codershigh.dev",
            photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          };
          setUser(mockUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
          return;
        }
        throw error;
      }
    } else {
      // Demo simulated Google sign-in
      const mockUser: UserAuth = {
        uid: "user_codershigh_explorer",
        displayName: "CodersHigh Creator",
        email: "creator@codershigh.dev",
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      };
      setUser(mockUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    }
  };

  const connectYouTubeSubscriptions = async (): Promise<string | null> => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || null;
        if (token) {
          setGoogleAccessToken(token);
          localStorage.setItem(YT_TOKEN_KEY, token);
          return token;
        }
      } catch (err) {
        console.warn("connectYouTubeSubscriptions status:", err);
      }
    }
    return null;
  };

  const signOut = async () => {
    localStorage.removeItem(YT_TOKEN_KEY);
    setGoogleAccessToken(null);

    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    } else {
      localStorage.removeItem(DEMO_USER_KEY);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        googleAccessToken,
        signInWithGoogle,
        connectYouTubeSubscriptions,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

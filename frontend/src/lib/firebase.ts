// Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if config is provided
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    console.warn('Firebase configuration is missing. Please set environment variables.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, googleProvider };

// Auth helper functions
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) throw new Error('Firebase not initialized');
  const { signInWithPopup } = await import('firebase/auth');
  return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not initialized');
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not initialized');
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  if (!auth) throw new Error('Firebase not initialized');
  return firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // If Firebase is not initialized, immediately call callback with null
    callback(null);
    return () => {}; // Return no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

// Store auth globally for API access
if (typeof window !== 'undefined' && auth) {
  (window as any).__firebaseAuth = auth;
}

export default app;


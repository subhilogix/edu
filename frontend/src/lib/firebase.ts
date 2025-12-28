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
    
    // Set custom parameters for Google sign-in
    googleProvider.setCustomParameters({
      prompt: 'select_account', // Always show account picker
    });
    
    // Add scopes
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
  } else {
    console.warn('Firebase configuration is missing. Please set environment variables.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, googleProvider };

// Check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  return auth !== null && googleProvider !== null;
};

// Get Firebase initialization status message
export const getFirebaseInitError = (): string | null => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return 'Firebase configuration is missing. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your .env file.';
  }
  if (!auth || !googleProvider) {
    return 'Firebase failed to initialize. Please check your environment variables and Firebase configuration.';
  }
  return null;
};

// Auth helper functions
export const signInWithGoogle = async () => {
  const initError = getFirebaseInitError();
  if (initError || !auth || !googleProvider) {
    throw new Error(initError || 'Firebase not initialized. Please configure Firebase environment variables.');
  }
  const { signInWithPopup } = await import('firebase/auth');
  return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, password: string) => {
  const initError = getFirebaseInitError();
  if (initError || !auth) {
    throw new Error(initError || 'Firebase not initialized. Please configure Firebase environment variables.');
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  const initError = getFirebaseInitError();
  if (initError || !auth) {
    throw new Error(initError || 'Firebase not initialized. Please configure Firebase environment variables.');
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  const initError = getFirebaseInitError();
  if (initError || !auth) {
    throw new Error(initError || 'Firebase not initialized. Please configure Firebase environment variables.');
  }
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


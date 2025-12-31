import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../services/firebase';

interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const updateUserProfile = useCallback(async (data: ProfileUpdateData) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateProfile(auth.currentUser, {
      displayName: data.displayName,
      photoURL: data.photoURL,
    });
    // Force refresh the user state to get updated profile
    setUser({ ...auth.currentUser });
  }, []);

  const reauthenticate = useCallback(async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  }, []);

  const deleteAccount = useCallback(async (password?: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    // Check if user signed in with Google
    const isGoogleUser = auth.currentUser.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );

    // Re-authenticate before deletion for security
    if (isGoogleUser) {
      // For Google users, re-authenticate with popup
      await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
    } else if (password) {
      // For email/password users, use provided password
      await reauthenticate(password);
    } else {
      throw new Error('Password is required for account deletion');
    }

    // Delete the user account
    await deleteUser(auth.currentUser);
  }, [reauthenticate]);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    updateUserProfile,
    deleteAccount,
    reauthenticate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


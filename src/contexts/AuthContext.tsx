import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  enableDemoMode: () => void;
  logout: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_ID = 'demo_user_dayflow';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  useEffect(() => {
    // Check if demo session was stored
    const storedDemo = localStorage.getItem('dayflow_is_demo');
    if (storedDemo === 'true') {
      setIsDemoUser(true);
      setUserProfile({
        uid: DEMO_USER_ID,
        email: 'demo@dayflow.app',
        displayName: 'Dayflow Explorer',
        createdAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        onboardingCompleted: true,
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemoUser(false);
        localStorage.removeItem('dayflow_is_demo');

        // Fetch or create profile
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Dayflow User',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              onboardingCompleted: true,
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (e) {
          console.warn('Error fetching user profile doc:', e);
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Dayflow User',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            onboardingCompleted: true,
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsDemoUser(false);
    localStorage.removeItem('dayflow_is_demo');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setIsDemoUser(false);
    localStorage.removeItem('dayflow_is_demo');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      uid: res.user.uid,
      email: res.user.email || email,
      displayName: name || 'Dayflow User',
      createdAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboardingCompleted: true,
    };
    try {
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
    } catch {}
    setUserProfile(newProfile);
  };

  const loginWithGoogle = async () => {
    setIsDemoUser(false);
    localStorage.removeItem('dayflow_is_demo');
    await signInWithPopup(auth, googleProvider);
  };

  const enableDemoMode = () => {
    setIsDemoUser(true);
    localStorage.setItem('dayflow_is_demo', 'true');
    setUserProfile({
      uid: DEMO_USER_ID,
      email: 'demo@dayflow.app',
      displayName: 'Dayflow Explorer',
      createdAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboardingCompleted: true,
    });
  };

  const logout = async () => {
    setIsDemoUser(false);
    localStorage.removeItem('dayflow_is_demo');
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileName = async (name: string) => {
    if (userProfile) {
      const updated = { ...userProfile, displayName: name };
      setUserProfile(updated);
      if (!isDemoUser) {
        try {
          await setDoc(doc(db, 'users', userProfile.uid), updated, { merge: true });
        } catch (e) {
          console.warn('Profile name update error:', e);
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isDemoUser,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        enableDemoMode,
        logout,
        resetPassword,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

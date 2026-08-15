"use client"

import * as React from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (doc) => {
          if (doc.exists()) {
            setProfile(doc.data());
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error fetching profile:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);

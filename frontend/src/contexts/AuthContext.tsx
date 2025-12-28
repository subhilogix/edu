import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthChange } from '@/lib/firebase';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Bootstrap user on backend if needed
        try {
          await authApi.bootstrap('student'); // Default role, can be changed
        } catch (error) {
          console.error('Failed to bootstrap user:', error);
        }

        // Get user role from backend if needed
        // For now, we'll default to 'student' or get it from user claims
        // This can be enhanced based on your auth structure
      } else {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
};


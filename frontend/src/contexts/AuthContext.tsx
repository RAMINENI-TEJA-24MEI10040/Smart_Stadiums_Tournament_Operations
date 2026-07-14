import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'OpsManager' | 'Director' | 'Security' | 'Volunteer';

interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedToken = localStorage.getItem('stadium-token');
    const cachedUser = localStorage.getItem('stadium-user');

    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(JSON.parse(cachedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('stadium-token', newToken);
    localStorage.setItem('stadium-user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stadium-token');
    localStorage.removeItem('stadium-user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

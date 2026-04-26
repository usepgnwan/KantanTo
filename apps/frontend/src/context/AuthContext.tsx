import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  user_id: number;
  nama: string;
  phone: string;
  email: string;
  roleid: number;
  deskripsi_role: string;
  exp: number;
}

// Backward-compatible User shape used by Navbar, Dashboard, Profile, etc.
export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  payload: JwtPayload | null;
  user: AuthUser | null; // Compatibility alias
  roleId: number | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isStudent: () => boolean;
}

const TOKEN_KEY = 'kantan_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [payload, setPayload] = useState<JwtPayload | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? decodeToken(t) : null;
  });

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      if (!decoded) {
        // Token expired, clean up
        setToken(null);
        setPayload(null);
        localStorage.removeItem(TOKEN_KEY);
      } else {
        setPayload(decoded);
      }
    }
  }, [token]);

  const login = (newToken: string) => {
    const decoded = decodeToken(newToken);
    if (decoded) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setPayload(decoded);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPayload(null);
  };

  const isAdmin = () => payload?.roleid === 1;
  const isStudent = () => payload?.roleid === 2;

  // Derive user from payload for backward compatibility
  const user: AuthUser | null = payload ? {
    name: payload.nama,
    email: payload.email,
    phone: payload.phone,
  } : null;

  return (
    <AuthContext.Provider value={{
      isLoggedIn: !!payload,
      token,
      payload,
      user,
      roleId: payload?.roleid ?? null,
      login,
      logout,
      isAdmin,
      isStudent,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

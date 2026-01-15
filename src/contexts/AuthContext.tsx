import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PIN_CONFIGS, hashPin, type AccessLevel } from '../lib/pinConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  currentAccessLevel: AccessLevel | null;
  isLoading: boolean; // Track if we're still checking localStorage
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  hasPageAccess: (path: string) => boolean;
  canExport: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pst-auth-token';

/**
 * Generate a simple obfuscated token from access level ID
 * This is stored in localStorage to persist authentication
 */
function generateAuthToken(accessLevelId: string): string {
  // Simple obfuscation - not encryption, just to avoid storing plain IDs
  const timestamp = Date.now();
  return btoa(`${accessLevelId}:${timestamp}`).replace(/=/g, '');
}

/**
 * Validate and extract access level from stored token
 */
function validateAuthToken(token: string): AccessLevel | null {
  try {
    const decoded = atob(token);
    const [accessLevelId] = decoded.split(':');
    const config = PIN_CONFIGS.find(c => c.accessLevel.id === accessLevelId);
    return config ? config.accessLevel : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccessLevel, setCurrentAccessLevel] = useState<AccessLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedToken) {
      const accessLevel = validateAuthToken(storedToken);
      if (accessLevel) {
        setCurrentAccessLevel(accessLevel);
        setIsAuthenticated(true);
      } else {
        // Invalid token, clear it
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    // Mark loading as complete after checking localStorage
    setIsLoading(false);
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const pinHash = await hashPin(pin);
      const config = PIN_CONFIGS.find(c => c.hash === pinHash);
      
      if (config) {
        const token = generateAuthToken(config.accessLevel.id);
        localStorage.setItem(AUTH_STORAGE_KEY, token);
        setCurrentAccessLevel(config.accessLevel);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentAccessLevel(null);
    setIsAuthenticated(false);
  }, []);

  const hasPageAccess = useCallback((path: string): boolean => {
    if (!currentAccessLevel) return false;
    
    // If allowAllPages is true, grant access to all pages
    if (currentAccessLevel.allowAllPages) return true;
    
    // Check if path is in allowedPages
    return currentAccessLevel.allowedPages.includes(path);
  }, [currentAccessLevel]);

  const canExport = useCallback((): boolean => {
    if (!currentAccessLevel) return false;
    return currentAccessLevel.allowExports;
  }, [currentAccessLevel]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentAccessLevel,
        isLoading,
        login,
        logout,
        hasPageAccess,
        canExport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

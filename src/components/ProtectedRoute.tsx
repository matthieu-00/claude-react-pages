import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { HomeIcon, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
}

export function ProtectedRoute({ children, path }: ProtectedRouteProps) {
  const { isAuthenticated, hasPageAccess, isLoading } = useAuth();

  // Wait for auth check to complete before making routing decisions
  if (isLoading) {
    return null; // Or a loading spinner if preferred
  }

  // If not authenticated, redirect to home (PIN modal will show)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has access to this specific path
  if (!hasPageAccess(path)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="access-denied">
        <Card variant="elevated-xl" padding="lg" className="max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page with your current access level.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              variant="default"
              data-testid="access-denied-return-home"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

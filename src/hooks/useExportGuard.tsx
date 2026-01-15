import { useAuth } from '../contexts/AuthContext';
import React from 'react';

/**
 * Hook to check export permissions and provide a guard component
 * that can wrap export functionality
 */
export function useExportGuard() {
  const { canExport } = useAuth();
  const hasExportPermission = canExport();

  /**
   * Component that conditionally renders children based on export permission
   */
  const ExportGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!hasExportPermission) {
      return null;
    }
    return <>{children}</>;
  };

  /**
   * Wrapper that disables export functionality when permission is denied
   */
  const DisabledExportWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!hasExportPermission) {
      return (
        <div className="opacity-50 pointer-events-none" aria-disabled="true">
          {children}
        </div>
      );
    }
    return <>{children}</>;
  };

  return {
    canExport: hasExportPermission,
    ExportGuard,
    DisabledExportWrapper,
  };
}

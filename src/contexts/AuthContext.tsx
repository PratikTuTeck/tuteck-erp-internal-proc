import React, { createContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType, DecodedToken, UserAccess } from "../types/auth.types";
import { AuthService } from "../services/auth.service";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [procAccesses, setProcAccesses] = useState<UserAccess[]>([]);

  const isAuthenticated = !!user;

  const validateToken = async () => {
    try {
      setIsLoading(true);
      const response = await AuthService.validateTokenWithAccess();

      if (response.success && response.data.decoded) {
        const decodedData = response.data.decoded;
        console.log("Decoded Token Data:", decodedData);
        setUser(decodedData);

        // Filter accesses for PROC module only
        const procOnlyAccesses = decodedData.accesses.filter((access) => {
          // Include MODULE level PROC access
          if (access.level_type === "MODULE" && access.name === "PROC") {
            return true;
          }
          // Include MENU level accesses where parent_name is PROC
          if (access.level_type === "MENU" && access.parent_name === "PROC") {
            return true;
          }
          // Include SUBMENU level accesses where grandparent_name is PROC
          if (
            access.level_type === "SUBMENU" &&
            access.grandparent_name === "PROC"
          ) {
            return true;
          }
          if (
            access.level_type === "ACTION" &&
            access.grand_grandparent_name === "PROC"
          ) {
            return true;
          }
          return false;
        });
        // console.log("Filtered PROC Accesses:", procOnlyAccesses);
        setProcAccesses(procOnlyAccesses);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      setUser(null);
      setProcAccesses([]);
      // Remove invalid token
      localStorage.removeItem("auth_token");
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccess = (menuName: string, submenuName?: string, actionName?: string): boolean => {
    // console.log("Checking access for menu:", menuName);
    // console.log("Checking submenu access for:", submenuName);
    // console.log("Checking Action access for:", actionName);
    if (!user || procAccesses.length === 0) {
      return false;
    }

    // Special case: check for PROC module access
    if (menuName === "PROC" && !submenuName) {
      return procAccesses.some(
        (access) => access.level_type === "MODULE" && access.name === "PROC"
      );
    }

    // Check if user has PROC module access first
    const hasModuleAccess = procAccesses.some(
      (access) => access.level_type === "MODULE" && access.name === "PROC"
    );

    if (!hasModuleAccess) {
      return false;
    }

    // If checking for submenu access
    if (submenuName && !actionName) {
      return procAccesses.some(
        (access) =>
          access.level_type === "SUBMENU" &&
          access.name === submenuName &&
          access.parent_name === menuName &&
          access.grandparent_name === "PROC"
      );
    }

    // If checking for Action access
    if (actionName) {
      return procAccesses.some(
        (access) =>
          access.level_type === "ACTION" &&
          access.name === actionName &&
          access.parent_name === submenuName &&
          access.grandparent_name === menuName &&
          access.grand_grandparent_name === "PROC"
      );
    }


    // If checking for menu access
    return procAccesses.some(
      (access) =>
        access.level_type === "MENU" &&
        access.name === menuName &&
        access.parent_name === "PROC"
    );
  };

  useEffect(() => {
    // Check for token in URL parameters (existing logic)
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get("token");

    if (rawToken) {
      const decodedToken = decodeURIComponent(rawToken);
      localStorage.setItem("auth_token", decodedToken);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Validate token on component mount
    const token = localStorage.getItem("auth_token");
    if (token) {
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    procAccesses,
    hasAccess,
    validateToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export interface UserAccess {
  access_id: string;
  name: string;
  level_type: "MODULE" | "MENU" | "SUBMENU";
  access_type: "READ" | "WRITE" | "DELETE";
  assigned_at: string;
  description: string | null;
  parent_name: string | null;
  grandparent_name: string | null;
}

export interface DecodedToken {
  id: string;
  name: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  accesses: UserAccess[];
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  data: {
    decoded: DecodedToken;
  };
  clientMessage: string;
  devMessage: string;
}

export interface AuthContextType {
  user: DecodedToken | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  procAccesses: UserAccess[];
  hasAccess: (menuName: string, submenuName?: string) => boolean;
  validateToken: () => Promise<void>;
}

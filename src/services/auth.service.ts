import axios from "axios";
import { AuthResponse } from "../types/auth.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export class AuthService {
  static async validateTokenWithAccess(): Promise<AuthResponse> {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/user-access/validate-with-access-proc`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Authentication failed"
        );
      }
      throw new Error("Authentication failed");
    }
  }
}

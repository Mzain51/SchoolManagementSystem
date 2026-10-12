import { UserContext, DashboardStatsResponse, School } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

class ApiClient {
  private getAuthToken(): string {
    if (typeof window === "undefined") return "dev-token-admin";
    // Check localStorage dev override first, or fallback to dev token
    const token = localStorage.getItem("sms_auth_token");
    return token || "dev-token-admin";
  }

  private getActiveSchoolId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("sms_active_school_id");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const token = this.getAuthToken();
    const activeSchoolId = this.getActiveSchoolId();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (activeSchoolId) {
      headers["X-School-ID"] = activeSchoolId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `API Error: ${response.statusText}`;
        let errorData = null;
        try {
          errorData = await response.json();
          if (errorData?.detail) {
            errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
          }
        } catch {
          // Non-JSON response
        }
        throw new ApiError(response.status, errorMsg, errorData);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, err.message || "Network error. Backend might be unreachable.");
    }
  }

  // --- Auth & User ---
  async getMe(): Promise<UserContext> {
    return this.request<UserContext>("/auth/me");
  }

  // --- Schools ---
  async getMySchools(): Promise<School[]> {
    return this.request<School[]>("/schools");
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return this.request<DashboardStatsResponse>("/dashboard/stats");
  }
}

export const api = new ApiClient();

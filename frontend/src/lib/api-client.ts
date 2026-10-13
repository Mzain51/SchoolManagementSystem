import { UserContext, DashboardStatsResponse, School, Student, StudentInput, StudentListResponse, AcademicYear, SchoolClass, SchoolSection, SchoolSubject } from "@/types/api";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
let browserSupabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!browserSupabase) browserSupabase = createClient();
  return browserSupabase;
}

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
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    if (process.env.NODE_ENV === "development") {
      const devOverride = localStorage.getItem("sms_auth_token");
      if (devOverride?.startsWith("dev-token-")) return devOverride;
    }
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw new ApiError(401, "Could not read the Supabase session.");
    if (data.session?.access_token) return data.session.access_token;
    return process.env.NODE_ENV === "development" ? "dev-token-admin" : null;
  }

  private getActiveSchoolId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("sms_active_school_id");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const token = await this.getAuthToken();
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

  async getStudents(params: URLSearchParams, signal?: AbortSignal): Promise<StudentListResponse> {
    return this.request<StudentListResponse>(`/students?${params.toString()}`, { signal });
  }

  async getStudent(id: string): Promise<Student> {
    return this.request<Student>(`/students/${encodeURIComponent(id)}`);
  }

  async createStudent(input: StudentInput): Promise<Student> {
    return this.request<Student>("/students", { method: "POST", body: JSON.stringify(input) });
  }

  async updateStudent(id: string, input: Partial<StudentInput>): Promise<Student> {
    return this.request<Student>(`/students/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  }

  async getAcademicYears(): Promise<AcademicYear[]> {
    return this.request<AcademicYear[]>("/academic/academic-years");
  }

  async createAcademicYear(input: Omit<AcademicYear, "id" | "school_id">): Promise<AcademicYear> {
    return this.request<AcademicYear>("/academic/academic-years", { method: "POST", body: JSON.stringify(input) });
  }

  async getClasses(academicYearId?: string): Promise<SchoolClass[]> {
    const params = new URLSearchParams();
    if (academicYearId) params.set("academic_year_id", academicYearId);
    return this.request<SchoolClass[]>(`/academic/classes${params.size ? `?${params}` : ""}`);
  }

  async createClass(input: Pick<SchoolClass, "academic_year_id" | "name" | "sort_order">): Promise<SchoolClass> {
    return this.request<SchoolClass>("/academic/classes", { method: "POST", body: JSON.stringify(input) });
  }

  async getSections(classId?: string): Promise<SchoolSection[]> {
    const params = new URLSearchParams();
    if (classId) params.set("class_id", classId);
    return this.request<SchoolSection[]>(`/academic/sections${params.size ? `?${params}` : ""}`);
  }

  async createSection(input: Pick<SchoolSection, "class_id" | "name" | "capacity">): Promise<SchoolSection> {
    return this.request<SchoolSection>("/academic/sections", { method: "POST", body: JSON.stringify(input) });
  }

  async getSubjects(academicYearId?: string): Promise<SchoolSubject[]> {
    const params = new URLSearchParams();
    if (academicYearId) params.set("academic_year_id", academicYearId);
    return this.request<SchoolSubject[]>(`/academic/subjects${params.size ? `?${params}` : ""}`);
  }

  async createSubject(input: { academic_year_id: string; name: string; code: string }): Promise<SchoolSubject> {
    return this.request("/academic/subjects", { method: "POST", body: JSON.stringify(input) });
  }
}

export const api = new ApiClient();

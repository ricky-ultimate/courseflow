import {
  ApiResponse,
  PaginatedResponse,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
  CreateExamData,
  UpdateExamData,
  CreateDepartmentData,
  UpdateDepartmentData,
  CreateCourseData,
  UpdateCourseData,
  CreateScheduleData,
  UpdateScheduleData,
  GenerateScheduleData,
  CreateComplaintData,
  CreateVerificationCodeData,
  UpdateVerificationCodeData,
  CreateUserData,
  UpdateUserData,
  RegisterData,
  UserFilterParams,
  CourseFilterParams,
  ScheduleFilterParams,
  DepartmentFilterParams,
  ExamFilterParams,
  ComplaintStatus,
} from "@/types";

const API_BASE_URL = "https://courseflow-backend-s16i.onrender.com/api/v1";

type On401Callback = () => void;
type On403Callback = () => void;
type OnNetworkErrorCallback = (retry: () => Promise<ApiResponse<any>>) => void;

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private on401: On401Callback | null = null;
  private on403: On403Callback | null = null;
  private onNetworkError: OnNetworkErrorCallback | null = null;

  setOn401(callback: On401Callback | null) {
    this.on401 = callback;
  }

  setOn403(callback: On403Callback | null) {
    this.on403 = callback;
  }

  setOnNetworkError(callback: OnNetworkErrorCallback | null) {
    this.onNetworkError = callback;
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private normalizeResponse(data: any, endpoint: string): ApiResponse<any> {
    if (data.user && data.access_token) {
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    if (data.data && Array.isArray(data.data) && data.total !== undefined) {
      return {
        success: true,
        data: {
          data: {
            items: data.data,
            pagination: {
              page: data.page || 1,
              limit: data.limit || 10,
              total: data.total,
              totalPages:
                data.totalPages || Math.ceil(data.total / (data.limit || 10)),
              hasNext: (data.page || 1) < (data.totalPages || 1),
              hasPrev: (data.page || 1) > 1,
            },
          },
        },
        timestamp: new Date().toISOString(),
      };
    }

    if (Array.isArray(data)) {
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    if (data.success !== undefined) return data;

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || `HTTP ${response.status}`;
        if (response.status === 401 && this.on401) {
          this.on401();
        }
        if (response.status === 403 && this.on403) {
          this.on403();
        }
        return {
          success: false,
          error: message,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, endpoint);
    } catch (error) {
      if (this.onNetworkError) {
        const retry = () => this.request<T>(endpoint, options);
        this.onNetworkError(retry);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async uploadFile(
    endpoint: string,
    file: File
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || "Upload failed";
        if (response.status === 401 && this.on401) {
          this.on401();
        }
        if (response.status === 403 && this.on403) {
          this.on403();
        }
        return {
          success: false,
          error: message,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, endpoint);
    } catch (error) {
      if (this.onNetworkError) {
        const retry = () => this.uploadFile(endpoint, file);
        this.onNetworkError(retry);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async downloadFile(endpoint: string): Promise<ApiResponse<string>> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 && this.on401) {
          this.on401();
        }
        if (response.status === 403 && this.on403) {
          this.on403();
        }
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: await response.text(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (this.onNetworkError) {
        const retry = () => this.downloadFile(endpoint);
        this.onNetworkError(retry);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private buildQuery(params?: Record<string, any>): string {
    if (!params) return "";
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const qs = new URLSearchParams(clean as any).toString();
    return qs ? `?${qs}` : "";
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(data: RegisterData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getCurrentUser() {
    return this.request("/auth/me");
  }

  forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ─── Verification Codes ────────────────────────────────────────────────────

  getVerificationCodes() {
    return this.request("/auth/verification-codes");
  }

  getVerificationCodeById(id: string) {
    return this.request(`/auth/verification-codes/${id}`);
  }

  createVerificationCode(data: CreateVerificationCodeData) {
    return this.request("/auth/verification-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateVerificationCode(id: string, data: UpdateVerificationCodeData) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteVerificationCode(id: string) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "DELETE",
    });
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  getUsers(params?: UserFilterParams) {
    return this.request(`/users${this.buildQuery(params)}`);
  }

  getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  createUser(data: CreateUserData) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateUser(id: string, data: UpdateUserData) {
    return this.request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: "DELETE" });
  }

  getLecturerDashboard() {
    return this.request("/users/me/dashboard");
  }

  getLecturerCourses() {
    return this.request("/users/me/courses");
  }

  getLecturerSchedule() {
    return this.request("/users/me/schedule");
  }

  // ─── Departments ───────────────────────────────────────────────────────────

  getDepartments(params?: DepartmentFilterParams) {
    return this.request(`/departments${this.buildQuery(params)}`);
  }

  getDepartmentByCode(code: string) {
    return this.request(`/departments/${code}`);
  }

  getDepartmentFullDetails(code: string) {
    return this.request(`/departments/${code}/full-details`);
  }

  getDepartmentStatistics() {
    return this.request("/departments/statistics");
  }

  createDepartment(data: CreateDepartmentData) {
    return this.request("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateDepartment(code: string, data: UpdateDepartmentData) {
    return this.request(`/departments/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteDepartment(code: string) {
    return this.request(`/departments/${code}`, { method: "DELETE" });
  }

  lockDepartmentSchedule(code: string) {
    return this.request(`/departments/${code}/schedule/lock`, {
      method: "PATCH",
    });
  }

  unlockDepartmentSchedule(code: string) {
    return this.request(`/departments/${code}/schedule/unlock`, {
      method: "PATCH",
    });
  }

  getDepartmentsBulkTemplate() {
    return this.downloadFile("/departments/bulk/template");
  }

  uploadDepartmentsBulk(file: File) {
    return this.uploadFile("/departments/bulk/upload", file);
  }

  // ─── Courses ───────────────────────────────────────────────────────────────

  getCourses(params?: CourseFilterParams) {
    return this.request(`/courses${this.buildQuery(params)}`);
  }

  getCourseByCode(code: string) {
    return this.request(`/courses/${code}`);
  }

  getCoursesWithoutSchedules() {
    return this.request("/courses/without-schedules");
  }

  getCourseStatistics() {
    return this.request("/courses/statistics");
  }

  createCourse(data: CreateCourseData) {
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateCourse(code: string, data: UpdateCourseData) {
    return this.request(`/courses/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteCourse(code: string) {
    return this.request(`/courses/${code}`, { method: "DELETE" });
  }

  getCoursesBulkTemplate() {
    return this.downloadFile("/courses/bulk/template");
  }

  uploadCoursesBulk(file: File) {
    return this.uploadFile("/courses/bulk/upload", file);
  }

  // ─── Schedules ─────────────────────────────────────────────────────────────

  getSchedules(params?: ScheduleFilterParams) {
    return this.request(`/schedules${this.buildQuery(params)}`);
  }

  getScheduleById(id: string) {
    return this.request(`/schedules/${id}`);
  }

  getScheduleStatistics() {
    return this.request("/schedules/statistics");
  }

  createSchedule(data: CreateScheduleData) {
    return this.request("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSchedule(id: string, data: UpdateScheduleData) {
    return this.request(`/schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteSchedule(id: string) {
    return this.request(`/schedules/${id}`, { method: "DELETE" });
  }

  generateSchedules(data: GenerateScheduleData) {
    return this.request("/schedules/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ─── Academic Sessions ─────────────────────────────────────────────────────

  getAcademicSessions(params?: { page?: number; limit?: number }) {
    return this.request(`/academic-sessions${this.buildQuery(params)}`);
  }

  getAcademicSessionById(id: string) {
    return this.request(`/academic-sessions/${id}`);
  }

  getActiveAcademicSession() {
    return this.request("/academic-sessions/active");
  }

  getSessionStatistics(id: string) {
    return this.request(`/academic-sessions/${id}/statistics`);
  }

  createAcademicSession(data: CreateAcademicSessionData) {
    return this.request("/academic-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateAcademicSession(id: string, data: UpdateAcademicSessionData) {
    return this.request(`/academic-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  activateAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}/activate`, {
      method: "PATCH",
    });
  }

  archiveAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}/archive`, {
      method: "PATCH",
    });
  }

  deleteAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}`, { method: "DELETE" });
  }

  // ─── Exams ─────────────────────────────────────────────────────────────────

  getExams(params?: ExamFilterParams) {
    return this.request(`/exams${this.buildQuery(params)}`);
  }

  getExamById(id: string) {
    return this.request(`/exams/${id}`);
  }

  createExam(data: CreateExamData) {
    return this.request("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateExam(id: string, data: UpdateExamData) {
    return this.request(`/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteExam(id: string) {
    return this.request(`/exams/${id}`, { method: "DELETE" });
  }

  // ─── Complaints ────────────────────────────────────────────────────────────

  getComplaints(params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: string;
  }) {
    return this.request(`/complaints${this.buildQuery(params)}`);
  }

  getMyComplaints() {
    return this.request("/complaints/my-complaints");
  }

  getPendingComplaints() {
    return this.request("/complaints/pending");
  }

  getResolvedComplaints() {
    return this.request("/complaints/resolved");
  }

  createComplaint(data: CreateComplaintData) {
    return this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateComplaintStatus(id: string, status: ComplaintStatus) {
    return this.request(`/complaints/${id}/status?status=${status}`, {
      method: "PATCH",
    });
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  healthCheck() {
    return this.request("/health");
  }

  simpleHealthCheck() {
    return this.request("/health/simple");
  }

  databaseHealthCheck() {
    return this.request("/health/database");
  }

  readinessCheck() {
    return this.request("/health/readiness");
  }

  livenessCheck() {
    return this.request("/health/liveness");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
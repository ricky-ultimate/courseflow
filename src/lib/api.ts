import type {
  AcademicSession,
  AdminDeleteAllResult,
  AdminDeleteResult,
  AdminSeedAllResult,
  AdminSeedResult,
  ApiResponse,
  AuthResponse,
  BatchGenerateScheduleResult,
  BulkOperationResult,
  Complaint,
  ComplaintStatus,
  Course,
  CourseAlias,
  CourseFilterParams,
  CourseStatistics,
  CreateAcademicSessionData,
  CreateComplaintData,
  CreateCourseData,
  CreateDepartmentData,
  CreateExamData,
  CreateScheduleData,
  CreateUserData,
  CurrentUser,
  DatabaseHealth,
  Department,
  DepartmentFilterParams,
  DepartmentStatistics,
  Exam,
  ExamFilterParams,
  GenerateExamTimetableData,
  GenerateExamTimetableResult,
  GenerateScheduleData,
  GenerateScheduleResult,
  HealthCheckResult,
  LecturerCourses,
  LecturerDashboard,
  LecturerSchedule,
  ListResult,
  LivenessCheck,
  MessageResponse,
  MultiFileBulkOperationResult,
  PageResult,
  Programme,
  QueryParams,
  ReadinessCheck,
  RecommendedSlot,
  RegisterData,
  Schedule,
  ScheduleFilterParams,
  ScheduleStatistics,
  SessionStatistics,
  SimpleHealth,
  UpdateAcademicSessionData,
  UpdateCourseData,
  UpdateDepartmentData,
  UpdateExamData,
  UpdateScheduleData,
  UpdateUserData,
  User,
  UserFilterParams,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

type On401Callback = () => void;
type On403Callback = () => void;
type OnNetworkErrorCallback = (
  retry: () => Promise<ApiResponse<unknown>>,
) => void;

interface RequestOptions {
  silent?: boolean;
  responseType?: "json" | "text";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectMessages(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (isRecord(value)) {
    if (typeof value.message === "string")
      return collectMessages(value.message);
    return Object.values(value).flatMap(collectMessages);
  }
  return [];
}

function resolveErrorMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    const messages = collectMessages(body.message);
    if (messages.length > 0) return Array.from(new Set(messages)).join(", ");
    const fallback = collectMessages(body.error);
    if (fallback.length > 0) return fallback.join(", ");
  }
  return `HTTP ${status}`;
}

function resolveErrorCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.errorCode === "string"
    ? body.errorCode
    : undefined;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private on401: On401Callback | null = null;
  private on403: On403Callback | null = null;
  private onNetworkError: OnNetworkErrorCallback | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setOn401(callback: On401Callback | null) {
    this.on401 = callback;
  }

  setOn403(callback: On403Callback | null) {
    this.on403 = callback;
  }

  setOnNetworkError(callback: OnNetworkErrorCallback | null) {
    this.onNetworkError = callback;
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

  private normalize<T>(payload: unknown): ApiResponse<T> {
    const timestamp = new Date().toISOString();

    if (!isRecord(payload)) {
      return { success: true, data: payload as T, timestamp };
    }

    if (Array.isArray(payload.data) && typeof payload.total === "number") {
      const items: unknown[] = payload.data;
      const total = payload.total;
      const limit =
        typeof payload.limit === "number" && payload.limit > 0
          ? payload.limit
          : Math.max(items.length, 1);
      const page = typeof payload.page === "number" ? payload.page : 1;
      const totalPages =
        typeof payload.totalPages === "number"
          ? payload.totalPages
          : Math.max(1, Math.ceil(total / limit));
      const result: PageResult<unknown> = {
        items,
        total,
        page,
        limit,
        totalPages,
      };
      return { success: true, data: result as T, timestamp };
    }

    if (typeof payload.success === "boolean") {
      return {
        success: payload.success,
        data: payload.data as T | undefined,
        message:
          typeof payload.message === "string" ? payload.message : undefined,
        timestamp,
      };
    }

    return { success: true, data: payload as T, timestamp };
  }

  private handleAuthFailure(status: number, silent: boolean): void {
    if (status === 401) {
      if (silent) {
        this.setToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      }
      this.on401?.();
      return;
    }
    if (status === 403 && !silent) {
      this.on403?.();
    }
  }

  private async send<T>(
    endpoint: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const silent = options.silent ?? false;
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };

    if (!(init.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...init,
        headers,
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        this.handleAuthFailure(response.status, silent);
        return {
          success: false,
          error: resolveErrorMessage(body, response.status),
          errorCode: resolveErrorCode(body),
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      if (options.responseType === "text") {
        return {
          success: true,
          data: (await response.text()) as T,
          timestamp: new Date().toISOString(),
        };
      }

      const payload: unknown = await response.json().catch(() => null);
      return this.normalize<T>(payload);
    } catch (error) {
      if (!silent && this.onNetworkError) {
        this.onNetworkError(() => this.send<T>(endpoint, init, options));
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private buildQuery(params?: object): string {
    if (!params) return "";
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        search.append(key, String(value));
      }
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  }

  private get<T>(endpoint: string, params?: object, options?: RequestOptions) {
    return this.send<T>(`${endpoint}${this.buildQuery(params)}`, {}, options);
  }

  private post<T>(endpoint: string, body?: unknown) {
    return this.send<T>(endpoint, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  private patch<T>(endpoint: string, body?: unknown) {
    return this.send<T>(endpoint, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  private remove<T>(endpoint: string) {
    return this.send<T>(endpoint, { method: "DELETE" });
  }

  private upload<T>(endpoint: string, field: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append(field, file));
    return this.send<T>(endpoint, { method: "POST", body: formData });
  }

  request<T>(endpoint: string, options: RequestInit = {}) {
    return this.send<T>(endpoint, options);
  }

  downloadFile(endpoint: string) {
    return this.send<string>(
      endpoint,
      { method: "GET" },
      {
        responseType: "text",
      },
    );
  }

  login(email: string, password: string) {
    return this.post<AuthResponse>("/auth/login", { email, password });
  }

  register(data: RegisterData) {
    return this.post<AuthResponse>("/auth/register", data);
  }

  getCurrentUser() {
    return this.get<CurrentUser>("/auth/me");
  }

  getCurrentUserSilent() {
    return this.get<CurrentUser>("/auth/me", undefined, { silent: true });
  }

  forgotPassword(email: string) {
    return this.post<MessageResponse>("/auth/forgot-password", { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.post<MessageResponse>("/auth/reset-password", {
      token,
      newPassword,
    });
  }

  getUsers(params?: UserFilterParams) {
    return this.get<ListResult<User>>("/users", params);
  }

  getUserById(id: string) {
    return this.get<User>(`/users/${id}`);
  }

  createUser(data: CreateUserData) {
    return this.post<User>("/users", data);
  }

  updateUser(id: string, data: UpdateUserData) {
    return this.patch<User>(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.remove<User>(`/users/${id}`);
  }

  getLecturerDashboard() {
    return this.get<LecturerDashboard>("/users/me/dashboard");
  }

  getLecturerCourses() {
    return this.get<LecturerCourses>("/users/me/courses");
  }

  getLecturerSchedule() {
    return this.get<LecturerSchedule>("/users/me/schedule");
  }

  getDepartments(params?: DepartmentFilterParams) {
    return this.get<ListResult<Department>>("/departments", params);
  }

  getDepartmentByCode(code: string) {
    return this.get<Department>(`/departments/${code}`);
  }

  getDepartmentFullDetails(code: string) {
    return this.get<Department>(`/departments/${code}/full-details`);
  }

  getDepartmentStatistics() {
    return this.get<DepartmentStatistics>("/departments/statistics");
  }

  getDepartmentProgrammes(code: string) {
    return this.get<Programme[]>(`/departments/${code}/programmes`);
  }

  createDepartment(data: CreateDepartmentData) {
    return this.post<Department>("/departments", data);
  }

  updateDepartment(code: string, data: UpdateDepartmentData) {
    return this.patch<Department>(`/departments/${code}`, data);
  }

  deleteDepartment(code: string) {
    return this.remove<Department>(`/departments/${code}`);
  }

  lockDepartmentSchedule(code: string) {
    return this.patch<Department>(`/departments/${code}/schedule/lock`);
  }

  unlockDepartmentSchedule(code: string) {
    return this.patch<Department>(`/departments/${code}/schedule/unlock`);
  }

  getDepartmentsBulkTemplate() {
    return this.downloadFile("/departments/bulk/template");
  }

  uploadDepartmentsBulk(file: File) {
    return this.upload<BulkOperationResult<Department>>(
      "/departments/bulk/upload",
      "file",
      [file],
    );
  }

  getCourses(params?: CourseFilterParams) {
    return this.get<ListResult<Course>>("/courses", params);
  }

  getCourseByCode(code: string) {
    return this.get<Course>(`/courses/${code}`);
  }

  getCoursesWithoutSchedules() {
    return this.get<Course[]>("/courses/without-schedules");
  }

  getUniversityCoursesWithoutSchedules() {
    return this.get<Course[]>("/courses/without-schedules/university");
  }

  getCoursesWithoutExams() {
    return this.get<Course[]>("/exams/without-exams");
  }

  getCourseStatistics() {
    return this.get<CourseStatistics>("/courses/statistics");
  }

  createCourse(data: CreateCourseData) {
    return this.post<Course>("/courses", data);
  }

  updateCourse(code: string, data: UpdateCourseData) {
    return this.patch<Course>(`/courses/${code}`, data);
  }

  deleteCourse(code: string) {
    return this.remove<Course>(`/courses/${code}`);
  }

  getCoursesBulkTemplate() {
    return this.downloadFile("/courses/bulk/template");
  }

  uploadCoursesBulk(file: File) {
    return this.upload<BulkOperationResult<Course>>(
      "/courses/bulk/upload",
      "file",
      [file],
    );
  }

  uploadCoursesBulkMulti(files: File[]) {
    return this.upload<MultiFileBulkOperationResult<Course>>(
      "/courses/bulk/upload-multi",
      "files",
      files,
    );
  }

  getCourseAliases() {
    return this.get<CourseAlias[]>("/course-aliases");
  }

  getCourseAliasesForCourse(code: string) {
    return this.get<CourseAlias[]>(`/course-aliases/course/${code}`);
  }

  createCourseAlias(data: { primaryCode: string; aliasCode: string }) {
    return this.post<CourseAlias>("/course-aliases", data);
  }

  deleteCourseAlias(id: string) {
    return this.remove<CourseAlias>(`/course-aliases/${id}`);
  }

  getSchedules(params?: ScheduleFilterParams) {
    return this.get<ListResult<Schedule>>("/schedules", params);
  }

  getScheduleById(id: string) {
    return this.get<Schedule>(`/schedules/${id}`);
  }

  getScheduleStatistics() {
    return this.get<ScheduleStatistics>("/schedules/statistics");
  }

  createSchedule(data: CreateScheduleData) {
    return this.post<Schedule>("/schedules", data);
  }

  updateSchedule(id: string, data: UpdateScheduleData) {
    return this.patch<Schedule>(`/schedules/${id}`, data);
  }

  deleteSchedule(id: string) {
    return this.remove<Schedule>(`/schedules/${id}`);
  }

  toggleScheduleFixed(id: string) {
    return this.patch<Schedule>(`/schedules/${id}/toggle-fixed`);
  }

  recommendUniversitySlots(courseCodes: string[]) {
    return this.post<RecommendedSlot[]>(
      "/schedules/recommend-university-slots",
      {
        courseCodes,
      },
    );
  }

  generateSchedules(data: GenerateScheduleData) {
    return this.post<GenerateScheduleResult>("/schedules/generate", data);
  }

  generateSchedulesBatch(data: GenerateScheduleData) {
    return this.post<BatchGenerateScheduleResult>(
      "/schedules/generate/batch",
      data,
    );
  }

  getAcademicSessions(params?: QueryParams) {
    return this.get<ListResult<AcademicSession>>("/academic-sessions", params);
  }

  getAcademicSessionById(id: string) {
    return this.get<AcademicSession>(`/academic-sessions/${id}`);
  }

  getActiveAcademicSession() {
    return this.get<AcademicSession | null>("/academic-sessions/active");
  }

  getSessionStatistics(id: string) {
    return this.get<SessionStatistics>(`/academic-sessions/${id}/statistics`);
  }

  createAcademicSession(data: CreateAcademicSessionData) {
    return this.post<AcademicSession>("/academic-sessions", data);
  }

  updateAcademicSession(id: string, data: UpdateAcademicSessionData) {
    return this.patch<AcademicSession>(`/academic-sessions/${id}`, data);
  }

  activateAcademicSession(id: string) {
    return this.patch<AcademicSession>(`/academic-sessions/${id}/activate`);
  }

  archiveAcademicSession(id: string) {
    return this.patch<AcademicSession>(`/academic-sessions/${id}/archive`);
  }

  deleteAcademicSession(id: string) {
    return this.remove<AcademicSession>(`/academic-sessions/${id}`);
  }

  getExams(params?: ExamFilterParams) {
    return this.get<ListResult<Exam>>("/exams", params);
  }

  getExamById(id: string) {
    return this.get<Exam>(`/exams/${id}`);
  }

  createExam(data: CreateExamData) {
    return this.post<Exam>("/exams", data);
  }

  updateExam(id: string, data: UpdateExamData) {
    return this.patch<Exam>(`/exams/${id}`, data);
  }

  deleteExam(id: string) {
    return this.remove<Exam>(`/exams/${id}`);
  }

  generateExamTimetable(data: GenerateExamTimetableData) {
    return this.post<GenerateExamTimetableResult>("/exams/generate", data);
  }

  getComplaints(params?: QueryParams) {
    return this.get<ListResult<Complaint>>("/complaints", params);
  }

  getMyComplaints() {
    return this.get<Complaint[]>("/complaints/my-complaints");
  }

  getPendingComplaints() {
    return this.get<Complaint[]>("/complaints/pending");
  }

  getResolvedComplaints() {
    return this.get<Complaint[]>("/complaints/resolved");
  }

  createComplaint(data: CreateComplaintData) {
    return this.post<Complaint>("/complaints", data);
  }

  updateComplaintStatus(id: string, status: ComplaintStatus) {
    return this.patch<Complaint>(`/complaints/${id}/status?status=${status}`);
  }

  healthCheck() {
    return this.get<HealthCheckResult>("/health");
  }

  simpleHealthCheck() {
    return this.get<SimpleHealth>("/health/simple");
  }

  databaseHealthCheck() {
    return this.get<DatabaseHealth>("/health/database");
  }

  readinessCheck() {
    return this.get<ReadinessCheck>("/health/readiness");
  }

  livenessCheck() {
    return this.get<LivenessCheck>("/health/liveness");
  }

  deleteAllSchedules() {
    return this.remove<AdminDeleteResult>("/admin/schedules");
  }

  deleteAllSchedulesExceptGeneral() {
    return this.remove<AdminDeleteResult>("/admin/schedules-except-general");
  }

  deleteAllExamSchedules() {
    return this.remove<AdminDeleteResult>("/admin/exam-schedules");
  }

  deleteAllCourses() {
    return this.remove<AdminDeleteResult>("/admin/courses");
  }

  deleteAllDepartments() {
    return this.remove<AdminDeleteResult>("/admin/departments");
  }

  deleteAllData() {
    return this.remove<AdminDeleteAllResult>("/admin/all");
  }

  seedDepartments() {
    return this.post<AdminSeedResult>("/admin/seed/departments");
  }

  seedCourses() {
    return this.post<AdminSeedResult>("/admin/seed/courses");
  }

  seedAll() {
    return this.post<AdminSeedAllResult>("/admin/seed/all");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

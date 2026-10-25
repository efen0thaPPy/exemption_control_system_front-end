import { apiClient, API_BASE_URL } from './apiClient';
import type {
  ApplicationRequestDto,
  ApplicationResponseDto,
  ApplicationStatus,
  ApplicationUserResponseDto,
  CourseContentDto,
  ErciyesCourseResponseDto,
  ExemptionResponseDto,
  ExemptionStatus,
  SelectedCourseRequestDto,
  SelectedCourseResponse,
  SimpleApplicationResponseDto,
  TranscriptDto,
  TransferType,
  ValidateResponseDto,
} from '../types';

export const exemptionApi = {
  /**
   * Fetch active / maximum academic year from backend
   */
  async getMaxAcademicYear(): Promise<string> {
    const response = await apiClient.get<string>('/api/erciyes/academic-years');
    return response.data;
  },

  /**
   * Fetch Erciyes courses for a specific academic year
   */
  async getCoursesByAcademicYear(academicYear: string): Promise<ErciyesCourseResponseDto[]> {
    const response = await apiClient.get<ErciyesCourseResponseDto[]>(
      `/api/erciyes/academic-years/${encodeURIComponent(academicYear.trim())}`
    );
    return response.data;
  },

  /**
   * Get available Erciyes courses for a given transfer type
   */
  async getErciyesCourses(transferType: TransferType): Promise<ErciyesCourseResponseDto[]> {
    const response = await apiClient.get<ErciyesCourseResponseDto[]>('/api/erciyes/courses', {
      params: { transferType },
    });
    return response.data;
  },

  /**
   * Pre-validate complete student application before final submission
   */
  async validateApplication(
    dto: ApplicationRequestDto,
    transcriptFile: File,
    courseFiles: Record<string, File>
  ): Promise<ValidateResponseDto> {
    const formData = new FormData();

    const jsonBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('applicationRequestDto', jsonBlob);
    formData.append('transcriptFile', transcriptFile);

    for (const [courseCode, file] of Object.entries(courseFiles)) {
      if (file) {
        formData.append(courseCode, file);
      }
    }

    const response = await apiClient.post<ValidateResponseDto>(
      '/api/applications/validations?courseFiles=',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Submit complete student application with transcript and course syllabus PDFs
   */
  async submitApplication(
    dto: ApplicationRequestDto,
    transcriptFile: File,
    courseFiles: Record<string, File>
  ): Promise<ApplicationUserResponseDto> {
    const formData = new FormData();

    const jsonBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('applicationRequestDto', jsonBlob);
    formData.append('transcriptFile', transcriptFile);

    for (const [courseCode, file] of Object.entries(courseFiles)) {
      if (file) {
        formData.append(courseCode, file);
      }
    }

    const response = await apiClient.post<ApplicationUserResponseDto>(
      '/api/applications/submissions?courseFiles=',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * List all applications with optional status filter
   */
  async getApplications(status?: ApplicationStatus): Promise<SimpleApplicationResponseDto[]> {
    const params: Record<string, string> = {};
    if (status) {
      params.applicationStatus = status;
    }
    const response = await apiClient.get<SimpleApplicationResponseDto[]>('/api/applications', {
      params,
    });
    return response.data;
  },

  /**
   * Get application details by tracking code
   */
  async getApplication(trackingCode: string): Promise<ApplicationResponseDto> {
    const response = await apiClient.get<ApplicationResponseDto>(
      `/api/applications/${encodeURIComponent(trackingCode.trim())}`
    );
    return response.data;
  },

  /**
   * Manage / update overall application status (e.g. PENDING -> CONCLUDED)
   */
  async updateApplicationStatus(
    trackingCode: string,
    applicationStatus: ApplicationStatus
  ): Promise<ApplicationResponseDto> {
    const response = await apiClient.put<ApplicationResponseDto>(
      `/api/applications/${encodeURIComponent(trackingCode.trim())}`,
      null,
      {
        params: { applicationStatus },
      }
    );
    return response.data;
  },

  /**
   * Manage / update specific selected course status or target course
   */
  async updateCourseStatus(
    trackingCode: string,
    courseId: number,
    params?: {
      newTargetCourseCode?: string;
      newCourseCode?: string;
      exemptionStatus?: ExemptionStatus;
    }
  ): Promise<SelectedCourseResponse> {
    const queryParams: Record<string, string | undefined> = {};
    const targetCode = params?.newTargetCourseCode || params?.newCourseCode;
    if (targetCode) {
      queryParams.newTargetCourseCode = targetCode;
    }
    if (params?.exemptionStatus) {
      queryParams.exemptionStatus = params.exemptionStatus;
    }

    const response = await apiClient.put<SelectedCourseResponse>(
      `/api/applications/${encodeURIComponent(trackingCode.trim())}/courses/${courseId}`,
      null,
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /**
   * Delete a selected course from an application
   */
  async deleteCourse(trackingCode: string, courseId: number): Promise<void> {
    await apiClient.delete(
      `/api/applications/${encodeURIComponent(trackingCode.trim())}/courses/${courseId}`
    );
  },

  /**
   * Add a new course to an existing application with syllabus PDF
   * POST /api/applications/{trackingCode}/courses
   */
  async addCourse(
    trackingCode: string,
    courseDto: SelectedCourseRequestDto,
    multipartFile: File
  ): Promise<SelectedCourseResponse> {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(courseDto)], { type: 'application/json' });
    formData.append('selectedCourseRequestDto', jsonBlob);
    formData.append('multipartFile', multipartFile);
    formData.append('trackingCode', trackingCode.trim());

    const response = await apiClient.post<SelectedCourseResponse>(
      `/api/applications/${encodeURIComponent(trackingCode.trim())}/courses?trackingCode=${encodeURIComponent(trackingCode.trim())}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Call LLM-based exemption evaluation for a specific course in an application
   */
  async evaluateExemption(
    trackingCode: string,
    courseId: number
  ): Promise<ExemptionResponseDto[]> {
    const response = await apiClient.post<ExemptionResponseDto[] | ExemptionResponseDto>(
      '/api/exemptions/exemption',
      null,
      {
        params: {
          trackingCode: trackingCode.trim(),
          courseId,
        },
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [response.data];
  },

  /**
   * Returns direct URL for viewing/downloading the transcript PDF
   */
  getTranscriptPdfUrl(trackingCode: string): string {
    return `${API_BASE_URL}/api/applications/${encodeURIComponent(trackingCode)}/pdfs/transcripts`;
  },

  /**
   * Returns direct URL for viewing/downloading a specific course syllabus PDF
   */
  getCourseContentPdfUrl(trackingCode: string, courseId: number | string): string {
    return `${API_BASE_URL}/api/applications/${encodeURIComponent(trackingCode)}/pdfs/coursecontents/${encodeURIComponent(courseId)}`;
  },

  /**
   * Upload transcript PDF and extract student info + courses using AI
   */
  async parseTranscript(file: File): Promise<TranscriptDto> {
    const formData = new FormData();
    formData.append('transcript', file);

    const response = await apiClient.post<TranscriptDto>('/api/ai/transcript', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * AI Course Content Analysis
   */
  async analyzeCourseContent(file: File): Promise<CourseContentDto> {
    const formData = new FormData();
    formData.append('courseContent', file);
    const response = await apiClient.post<CourseContentDto>('/api/ai/coursecontent', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Raw PDF text extraction
   */
  async extractPdfText(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<string>('/api/pdfs/extract-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Course Seeder helper
   */
  async seedCourses(payload: string = ''): Promise<unknown> {
    const response = await apiClient.post('/api/courses/seed', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};

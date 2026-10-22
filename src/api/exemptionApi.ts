import { apiClient, API_BASE_URL } from './apiClient';
import type {
  ApplicationRequestDto,
  ApplicationResponseDto,
  ApplicationStatus,
  ApplicationUserResponseDto,
  CourseContentDto,
  ErciyesCourseResponseDto,
  ExemptionResponseDto,
  SimpleApplicationResponseDto,
  TranscriptDto,
  TransferType,
  ValidateResponseDto,
} from '../types';

export const exemptionApi = {
  /**
   * Pre-validate complete student application before final submission
   */
  async validateApplication(
    dto: ApplicationRequestDto,
    transcriptFile: File,
    courseFiles: Record<string, File>
  ): Promise<ValidateResponseDto> {
    const formData = new FormData();

    // Attach applicationRequestDto JSON blob
    const jsonBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('applicationRequestDto', jsonBlob);

    // Attach transcript PDF
    formData.append('transcriptFile', transcriptFile);

    // Attach each course syllabus PDF
    for (const [courseCode, file] of Object.entries(courseFiles)) {
      if (file) {
        formData.append(courseCode, file);
        formData.append(`courseFiles[${courseCode}]`, file);
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
   * Get available Erciyes courses for a given transfer type
   */
  async getErciyesCourses(transferType: TransferType): Promise<ErciyesCourseResponseDto[]> {
    const response = await apiClient.get<ErciyesCourseResponseDto[]>('/api/erciyes/courses', {
      params: { transferType },
    });
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

    // Attach applicationRequestDto JSON blob
    const jsonBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('applicationRequestDto', jsonBlob);

    // Attach transcript PDF
    formData.append('transcriptFile', transcriptFile);

    // Attach each course syllabus PDF
    // We attach both direct courseCode and indexed key so Spring resolves whichever way it is mapped
    for (const [courseCode, file] of Object.entries(courseFiles)) {
      if (file) {
        formData.append(courseCode, file);
        formData.append(`courseFiles[${courseCode}]`, file);
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
   * Returns the direct URL for viewing/downloading the transcript PDF
   */
  getTranscriptPdfUrl(trackingCode: string): string {
    return `${API_BASE_URL}/api/applications/${encodeURIComponent(trackingCode)}/pdfs/transcripts`;
  },

  /**
   * Returns the direct URL for viewing/downloading a specific course syllabus PDF
   */
  getCourseContentPdfUrl(trackingCode: string, courseCode: string): string {
    return `${API_BASE_URL}/api/applications/${encodeURIComponent(trackingCode)}/pdfs/coursecontents/${encodeURIComponent(courseCode)}`;
  },

  /**
   * Call LLM-based exemption evaluation for a specific course in an application
   */
  async evaluateExemption(
    trackingCode: string,
    courseCode: string
  ): Promise<ExemptionResponseDto[]> {
    const response = await apiClient.post<ExemptionResponseDto[] | ExemptionResponseDto>(
      '/api/exemptions/exemption',
      null,
      {
        params: {
          trackingCode: trackingCode.trim(),
          courseCode: courseCode.trim(),
        },
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [response.data];
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
   * Course Seeder helper
   */
  async seedCourses(payload: string = ''): Promise<unknown> {
    const response = await apiClient.post('/api/courses/seed', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};

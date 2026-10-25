export type TransferType = 'LATERAL_TRANSFER' | 'VERTICAL_TRANSFER';

export type CourseLanguage = 'TURKISH' | 'ENGLISH';

export type CourseType = 'COMMON_MANDATORY' | 'MANDATORY' | 'ELECTIVE';

export type Grade = 'AA' | 'BA' | 'BB' | 'CB' | 'CC' | 'DC' | 'DD' | 'FD' | 'FF' | 'S' | 'U' | 'M' | 'ET';

export const PASSING_GRADES: readonly Grade[] = ['AA', 'BA', 'BB', 'CB', 'CC', 'S', 'M', 'ET'] as const;

export const isPassingGrade = (grade?: Grade | null): boolean => {
  if (!grade) return false;
  return PASSING_GRADES.includes(grade);
};

export type ExemptionStatus = 'PASSED' | 'PENDING' | 'FAILED';

export type ApplicationStatus = 'PENDING' | 'CONCLUDED';

export interface ValidateResponseDto {
  errors: string[];
  warnings: string[];
  valid: boolean;
}

export interface TranscriptCourses {
  courseCode: string;
  courseName: string;
  semester?: string;
  courseLanguage?: CourseLanguage;
  ects: number;
  grade?: Grade;
}

export interface TranscriptDto {
  firstName: string;
  lastName: string;
  university: string;
  transcriptCourses: TranscriptCourses[];
}

export interface ErciyesCourseResponseDto {
  courseCode: string;
  courseName: string;
  semesterName?: string;
  courseType: CourseType;
  ects: number;
}

export interface SelectedCourseRequestDto {
  courseCode: string;
  courseName: string;
  semesterName?: string;
  semester?: string;
  courseLanguage?: CourseLanguage;
  courseType: CourseType;
  ects: number;
  grade?: Grade;
  targetCourseCode: string;
  exemptionStatus?: ExemptionStatus;
}

export interface TranscriptRequestDto {
  firstName: string;
  lastName: string;
  university: string;
}

export interface ApplicationRequestDto {
  transcriptRequestDto: TranscriptRequestDto;
  courses: SelectedCourseRequestDto[];
  transferType: TransferType;
  academicYear: string;
}

export interface ApplicationUserResponseDto {
  trackingCode: string;
  message: string;
}

export interface Student {
  firstName: string;
  lastName: string;
  university: string;
}

export interface SelectedCourseResponse {
  id?: number;
  courseCode: string;
  courseName: string;
  semesterName?: string;
  semester?: string;
  courseLanguage?: CourseLanguage;
  courseType: CourseType;
  ects: number;
  grade?: Grade;
  targetCourseCode: string;
  exemptionStatus: ExemptionStatus;
}

export interface ApplicationResponseDto {
  student: Student;
  trackingCode: string;
  applicationStatus: ApplicationStatus;
  transferType: TransferType;
  selectedCourses: SelectedCourseResponse[];
  academicYear?: string;
}

export interface SimpleApplicationResponseDto {
  firstName: string;
  lastName: string;
  university: string;
  trackingCode: string;
  applicationStatus: ApplicationStatus;
  transferType: TransferType;
}

export interface ExemptionResponseDto {
  sourceCourseName?: string;
  targetCourseName?: string;
  academicYear?: string;
  llmReport?: string;
  missingTopics?: string;
  llmSimilarityPercent?: number;
  vectorSimilarityPercent?: number;
}

export interface CourseContentDto {
  courseContents: string;
}

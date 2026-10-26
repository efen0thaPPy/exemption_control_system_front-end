import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  ApplicationRequestDto, 
  ApplicationUserResponseDto, 
  SelectedCourseRequestDto, 
  TranscriptDto, 
  TransferType 
} from '../types';
import { exemptionApi } from '../api/exemptionApi';

interface StudentFlowContextType {
  currentStep: 1 | 2 | 3;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  transferType: TransferType;
  setTransferType: (t: TransferType) => void;
  transcriptFile: File | null;
  setTranscriptFile: (f: File | null) => void;
  transcriptData: TranscriptDto | null;
  setTranscriptData: (d: TranscriptDto | null) => void;
  isAnalyzing: boolean;
  analyzeError: string | null;
  selectedCoursesMap: Map<string, SelectedCourseRequestDto>;
  setSelectedCoursesMap: React.Dispatch<React.SetStateAction<Map<string, SelectedCourseRequestDto>>>;
  courseFiles: Record<string, File>;
  setCourseFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  isSubmitting: boolean;
  submitError: string | null;
  submissionSuccessData: ApplicationUserResponseDto | null;
  setSubmissionSuccessData: (d: ApplicationUserResponseDto | null) => void;
  handleAnalyzeTranscript: () => Promise<void>;
  handleSubmitApplication: (academicYear: string) => Promise<void>;
  handleReset: () => void;
}

const StudentFlowContext = createContext<StudentFlowContextType | undefined>(undefined);

export const StudentFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    try {
      const saved = sessionStorage.getItem('student_flow_step');
      if (saved === '2' || saved === '3') return Number(saved) as 2 | 3;
    } catch {
      // ignore
    }
    return 1;
  });

  const [transferType, setTransferType] = useState<TransferType>(() => {
    try {
      const saved = sessionStorage.getItem('student_flow_transfer_type');
      if (saved === 'LATERAL_TRANSFER' || saved === 'VERTICAL_TRANSFER') return saved;
    } catch {
      // ignore
    }
    return 'LATERAL_TRANSFER';
  });

  // In-memory File object, preserved across all SPA route transitions
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  const [transcriptData, setTranscriptData] = useState<TranscriptDto | null>(() => {
    try {
      const saved = sessionStorage.getItem('student_flow_transcript_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [selectedCoursesMap, setSelectedCoursesMap] = useState<Map<string, SelectedCourseRequestDto>>(() => {
    try {
      const saved = sessionStorage.getItem('student_flow_selected_courses');
      if (saved) {
        const arr = JSON.parse(saved);
        return new Map(arr);
      }
    } catch {
      // ignore
    }
    return new Map();
  });

  const [courseFiles, setCourseFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<ApplicationUserResponseDto | null>(null);

  // Sync serializable state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('student_flow_step', String(currentStep));
    } catch {
      // ignore
    }
  }, [currentStep]);

  useEffect(() => {
    try {
      sessionStorage.setItem('student_flow_transfer_type', transferType);
    } catch {
      // ignore
    }
  }, [transferType]);

  useEffect(() => {
    try {
      if (transcriptData) {
        sessionStorage.setItem('student_flow_transcript_data', JSON.stringify(transcriptData));
      } else {
        sessionStorage.removeItem('student_flow_transcript_data');
      }
    } catch {
      // ignore
    }
  }, [transcriptData]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'student_flow_selected_courses',
        JSON.stringify(Array.from(selectedCoursesMap.entries()))
      );
    } catch {
      // ignore
    }
  }, [selectedCoursesMap]);

  const handleAnalyzeTranscript = async () => {
    if (!transcriptFile) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const result = await exemptionApi.parseTranscript(transcriptFile);
      setTranscriptData(result);
      setSelectedCoursesMap(new Map());
      setCourseFiles({});
    } catch (err: unknown) {
      const error = err as Error;
      setAnalyzeError(error.message || 'Transkript okunurken bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitApplication = async (academicYear: string) => {
    if (!transcriptData || !transcriptFile) return;

    const coursesArray = Array.from(selectedCoursesMap.values());
    if (coursesArray.length === 0) {
      setSubmitError('Lütfen en az bir ders seçiniz.');
      return;
    }

    const payload: ApplicationRequestDto = {
      transcriptRequestDto: {
        firstName: transcriptData.firstName,
        lastName: transcriptData.lastName,
        university: transcriptData.university,
      },
      courses: coursesArray,
      transferType,
      academicYear,
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await exemptionApi.submitApplication(
        payload,
        transcriptFile,
        courseFiles
      );
      setSubmissionSuccessData(response);
      if (response.trackingCode) {
        sessionStorage.setItem('last_tracking_code', response.trackingCode);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSubmitError(
        error.message ||
          'Başvuru kaydedilirken bir hata oluştu. Lütfen bilgilerinizi kontrol ediniz.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setTranscriptFile(null);
    setTranscriptData(null);
    setSelectedCoursesMap(new Map());
    setCourseFiles({});
    setSubmissionSuccessData(null);
    setSubmitError(null);
    try {
      sessionStorage.removeItem('student_flow_step');
      sessionStorage.removeItem('student_flow_transcript_data');
      sessionStorage.removeItem('student_flow_selected_courses');
    } catch {
      // ignore
    }
  };

  return (
    <StudentFlowContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        transferType,
        setTransferType,
        transcriptFile,
        setTranscriptFile,
        transcriptData,
        setTranscriptData,
        isAnalyzing,
        analyzeError,
        selectedCoursesMap,
        setSelectedCoursesMap,
        courseFiles,
        setCourseFiles,
        isSubmitting,
        submitError,
        submissionSuccessData,
        setSubmissionSuccessData,
        handleAnalyzeTranscript,
        handleSubmitApplication,
        handleReset,
      }}
    >
      {children}
    </StudentFlowContext.Provider>
  );
};

export const useStudentFlow = (): StudentFlowContextType => {
  const context = useContext(StudentFlowContext);
  if (!context) {
    throw new Error('useStudentFlow must be used within a StudentFlowProvider');
  }
  return context;
};

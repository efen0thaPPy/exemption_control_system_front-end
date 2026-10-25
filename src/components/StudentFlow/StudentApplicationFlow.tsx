import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { exemptionApi } from '../../api/exemptionApi';
import { Step1TransferAndUpload } from './Step1TransferAndUpload';
import { Step2CourseSelection } from './Step2CourseSelection';
import { Step3ReviewSubmit } from './Step3ReviewSubmit';
import { ApplicationSuccessModal } from './ApplicationSuccessModal';
import type { 
  ApplicationRequestDto, 
  ApplicationUserResponseDto, 
  SelectedCourseRequestDto, 
  TranscriptDto, 
  TransferType 
} from '../../types';
import { Check } from 'lucide-react';

interface StudentApplicationFlowProps {
  onGoToTracking?: (trackingCode: string) => void;
}

export const StudentApplicationFlow: React.FC<StudentApplicationFlowProps> = ({
  onGoToTracking,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [transferType, setTransferType] = useState<TransferType>('LATERAL_TRANSFER');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptDto | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Selected courses and files
  const [selectedCoursesMap, setSelectedCoursesMap] = useState<Map<string, SelectedCourseRequestDto>>(
    new Map()
  );
  const [courseFiles, setCourseFiles] = useState<Record<string, File>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<ApplicationUserResponseDto | null>(null);

  // Query Erciyes courses based on transferType
  const { data: erciyesCourses = [] } = useQuery({
    queryKey: ['erciyes-courses', transferType],
    queryFn: () => exemptionApi.getErciyesCourses(transferType),
  });

  // Query active academic year
  const { data: activeAcademicYear = '2023-2024' } = useQuery({
    queryKey: ['academic-year-active'],
    queryFn: () => exemptionApi.getMaxAcademicYear(),
  });

  // Action: Read Transcript and extract courses
  const handleAnalyzeTranscript = async () => {
    if (!transcriptFile) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const result = await exemptionApi.parseTranscript(transcriptFile);
      setTranscriptData(result);
      // Pre-clear selections if new transcript
      setSelectedCoursesMap(new Map());
      setCourseFiles({});
    } catch (err: unknown) {
      const error = err as Error;
      setAnalyzeError(error.message || 'Transkript okunurken bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: Submit Application
  const handleSubmitApplication = async () => {
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
      academicYear: activeAcademicYear,
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
  };

  const handleTrackNavigation = (code: string) => {
    if (onGoToTracking) {
      onGoToTracking(code);
    } else {
      navigate(`/sorgula/${code}`);
    }
  };

  const steps = [
    { num: 1, title: 'Geçiş Türü & Transkript', desc: 'Transkript yükleme ve derslerin okunması' },
    { num: 2, title: 'Ders Seçimi & Eşleştirme', desc: 'Ders türü, Erciyes karşılığı ve içerik PDF' },
    { num: 3, title: 'Özet & Gönderim', desc: 'Son kontrol ve başvuru onayı' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 w-full flex-1 flex flex-col">
      {/* Stepper Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`flex items-center gap-4 lg:gap-5 p-5 lg:p-6 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/60 shadow-sm ring-1 ring-brand-500/20'
                    : isCompleted
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/40'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <div
                  className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl lg:text-2xl flex-shrink-0 transition-transform ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-7 h-7 lg:w-8 lg:h-8 stroke-[3]" /> : s.num}
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {s.title}
                  </h4>
                  <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Wrapper */}
      <div className="flex-1 flex flex-col w-full">
        {/* Step 1 */}
        {currentStep === 1 && (
          <Step1TransferAndUpload
            transferType={transferType}
            setTransferType={setTransferType}
            academicYear={activeAcademicYear}
            transcriptFile={transcriptFile}
            setTranscriptFile={setTranscriptFile}
            transcriptData={transcriptData}
            setTranscriptData={setTranscriptData}
            onAnalyzeTranscript={handleAnalyzeTranscript}
            isAnalyzing={isAnalyzing}
            analyzeError={analyzeError}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {/* Step 2 */}
        {currentStep === 2 && transcriptData && (
          <Step2CourseSelection
            parsedCourses={transcriptData.transcriptCourses || []}
            selectedCoursesMap={selectedCoursesMap}
            setSelectedCoursesMap={setSelectedCoursesMap}
            courseFiles={courseFiles}
            setCourseFiles={setCourseFiles}
            erciyesCourses={erciyesCourses}
            transferType={transferType}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {/* Step 3 */}
        {currentStep === 3 && transcriptData && transcriptFile && (
          <Step3ReviewSubmit
            transcriptData={transcriptData}
            transcriptFile={transcriptFile}
            transferType={transferType}
            academicYear={activeAcademicYear}
            selectedCourses={Array.from(selectedCoursesMap.values())}
            courseFiles={courseFiles}
            erciyesCourses={erciyesCourses}
            onBack={() => setCurrentStep(2)}
            onSubmit={handleSubmitApplication}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
      </div>

      {/* Success Modal */}
      {submissionSuccessData && (
        <ApplicationSuccessModal
          data={submissionSuccessData}
          onTrack={handleTrackNavigation}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

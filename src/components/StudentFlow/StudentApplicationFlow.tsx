import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { exemptionApi } from '../../api/exemptionApi';
import { Step1TransferAndUpload } from './Step1TransferAndUpload';
import { Step2CourseSelection } from './Step2CourseSelection';
import { Step3ReviewSubmit } from './Step3ReviewSubmit';
import { ApplicationSuccessModal } from './ApplicationSuccessModal';
import { useStudentFlow } from '../../context/StudentFlowContext';
import { Check, RotateCcw, UploadCloud, FileText } from 'lucide-react';

interface StudentApplicationFlowProps {
  onGoToTracking?: (trackingCode: string) => void;
}

export const StudentApplicationFlow: React.FC<StudentApplicationFlowProps> = ({
  onGoToTracking,
}) => {
  const navigate = useNavigate();
  const {
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
    handleAnalyzeTranscript,
    handleSubmitApplication,
    handleReset,
  } = useStudentFlow();

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
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Ders Muafiyet & İntibak Başvuru Süreci
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sayfalar arasında gezinirken yüklediğiniz transkript ve seçimleriniz otomatik olarak korunur.
            </p>
          </div>

          {(transcriptFile || transcriptData || selectedCoursesMap.size > 0) && (
            <button
              onClick={() => {
                if (confirm('Yüklenen transkript ve yapılan ders seçimleri sıfırlanacaktır. Emin misiniz?')) {
                  handleReset();
                }
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800"
              title="Tüm form verilerini sıfırla ve baştan başla"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Formu Sıfırla</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            const canClick = s.num === 1 || (s.num === 2 && transcriptData) || (s.num === 3 && transcriptData && selectedCoursesMap.size > 0);

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (canClick) setCurrentStep(s.num as 1 | 2 | 3);
                }}
                className={`flex items-center gap-4 lg:gap-5 p-5 lg:p-6 rounded-2xl border transition-all ${
                  canClick ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700' : 'cursor-default opacity-70'
                } ${
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
        {currentStep === 3 && transcriptData && (
          transcriptFile ? (
            <Step3ReviewSubmit
              transcriptData={transcriptData}
              transcriptFile={transcriptFile}
              transferType={transferType}
              academicYear={activeAcademicYear}
              selectedCourses={Array.from(selectedCoursesMap.values())}
              courseFiles={courseFiles}
              erciyesCourses={erciyesCourses}
              onBack={() => setCurrentStep(2)}
              onSubmit={() => handleSubmitApplication(activeAcademicYear)}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-12 border border-slate-200 dark:border-slate-800 text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Transkript PDF Belgesini Seçiniz
                </h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
                  Tarayıcınız tam sayfa yenilendiğinde güvenlik gereği dosya referansı sıfırlanır. Yapmış olduğunuz tüm ders seçimleri ve transkript verileriniz eksiksiz korunmuştur.
                </p>
              </div>
              <div className="pt-2">
                <input
                  type="file"
                  accept="application/pdf"
                  id="reselect-transcript-file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setTranscriptFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="reselect-transcript-file"
                  className="cursor-pointer inline-flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md shadow-brand-500/25"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Transkript Belgesini Seç</span>
                </label>
              </div>
            </div>
          )
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

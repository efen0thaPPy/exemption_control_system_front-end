import React from 'react';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  User, 
  ArrowRightLeft,
  GraduationCap
} from 'lucide-react';
import type { 
  ErciyesCourseResponseDto, 
  SelectedCourseRequestDto, 
  TranscriptDto, 
  TransferType 
} from '../../types';
import { isPassingGrade } from '../../types';

interface Step3Props {
  transcriptData: TranscriptDto;
  transcriptFile: File;
  transferType: TransferType;
  academicYear?: string;
  selectedCourses: SelectedCourseRequestDto[];
  courseFiles: Record<string, File>;
  erciyesCourses: ErciyesCourseResponseDto[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export const Step3ReviewSubmit: React.FC<Step3Props> = ({
  transcriptData,
  transcriptFile,
  transferType,
  academicYear,
  selectedCourses,
  courseFiles,
  erciyesCourses,
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const totalAkts = selectedCourses.reduce((sum, c) => sum + (c.ects || 0), 0);

  const getTargetCourseInfo = (code: string) => {
    return erciyesCourses.find((c) => c.courseCode === code);
  };

  const getCourseTypeLabel = (type: string) => {
    switch (type) {
      case 'COMMON_MANDATORY':
        return 'Ortak Zorunlu';
      case 'MANDATORY':
        return 'Zorunlu';
      case 'ELECTIVE':
        return 'Seçmeli';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 3xl:space-y-8 w-full">
      {/* Title & Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-xl sm:text-2xl 3xl:text-3xl font-extrabold text-slate-900 dark:text-white">
          Başvuru Özeti ve Onay
        </h2>
        <p className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Lütfen öğrenci bilgilerinizi, seçtiğiniz dersleri ve eşleştirdiğiniz Erciyes derslerini son bir kez kontrol ettikten sonra başvurunuzu sisteme iletiniz.
        </p>
      </div>

      {/* Student & Transfer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 3xl:gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 3xl:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 3xl:space-y-6 transition-colors">
          <h3 className="text-base sm:text-lg 3xl:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <User className="w-5 h-5 3xl:w-6 3xl:h-6 text-brand-600 dark:text-brand-400" />
            <span>Öğrenci Bilgileri</span>
          </h3>
          <div className="space-y-3 3xl:space-y-4 text-sm sm:text-base 3xl:text-lg">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Ad Soyad:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {transcriptData.firstName} {transcriptData.lastName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Önceki Üniversite:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {transcriptData.university}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Transkript Belgesi:</span>
              <span className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <FileText className="w-4 h-4 3xl:w-5 3xl:h-5" />
                {transcriptFile.name}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 3xl:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 3xl:space-y-6 transition-colors">
          <h3 className="text-base sm:text-lg 3xl:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {transferType === 'LATERAL_TRANSFER' ? (
              <ArrowRightLeft className="w-5 h-5 3xl:w-6 3xl:h-6 text-brand-600 dark:text-brand-400" />
            ) : (
              <GraduationCap className="w-5 h-5 3xl:w-6 3xl:h-6 text-brand-600 dark:text-brand-400" />
            )}
            <span>Başvuru Kapsamı</span>
          </h3>
          <div className="space-y-3 3xl:space-y-4 text-sm sm:text-base 3xl:text-lg">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Geçiş Tipi:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş (DGS)'}
              </span>
            </div>
            {academicYear && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Akademik Yıl:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {academicYear}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Muafiyet Talep Edilen Ders Sayısı:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedCourses.length} Ders
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Toplam AKTS Kredisi:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {totalAkts} AKTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Courses Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 3xl:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg 3xl:text-xl font-bold text-slate-900 dark:text-white">
            Muafiyet Talep Edilen Dersler ve Erciyes Eşleşmeleri
          </h3>
          <span className="text-sm 3xl:text-base bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-1 3xl:px-4 3xl:py-1.5 rounded-full font-bold">
            {selectedCourses.length} Ders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base 3xl:text-lg">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm sm:text-base 3xl:text-lg uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 3xl:px-8 3xl:py-5">Kaynak Ders</th>
                <th className="px-6 py-4 3xl:px-8 3xl:py-5">Tür & Not</th>
                <th className="px-6 py-4 3xl:px-8 3xl:py-5">Hedef Erciyes Dersi</th>
                <th className="px-6 py-4 3xl:px-8 3xl:py-5">İçerik Belgesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedCourses.map((course) => {
                const targetObj = getTargetCourseInfo(course.targetCourseCode);
                const file = courseFiles[course.courseCode];

                return (
                  <tr key={course.courseCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5">
                      <div className="font-bold text-slate-900 dark:text-white text-base sm:text-lg 3xl:text-xl">
                        {course.courseName}
                      </div>
                      <div className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                          {course.courseCode}
                        </span>
                        <span>{course.ects} AKTS</span>
                        {course.semester && <span>• {course.semester}. Yarıyıl</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 3xl:px-8 3xl:py-5">
                      <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm 3xl:text-base font-bold px-3.5 py-1.5 rounded-lg">
                        {getCourseTypeLabel(course.courseType)}
                      </div>
                      {course.grade && (
                        <div
                          className={`text-sm sm:text-base 3xl:text-lg font-bold mt-1.5 ${
                            isPassingGrade(course.grade)
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Not: {course.grade} {!isPassingGrade(course.grade) && '(Başarısız)'}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 3xl:px-8 3xl:py-5">
                      {targetObj ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-base sm:text-lg 3xl:text-xl">
                            {targetObj.courseCode} - {targetObj.courseName}
                          </div>
                          <div className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1">
                            {targetObj.semesterName || (targetObj as { semester?: number }).semester ? `${targetObj.semesterName || `Yarıyıl ${(targetObj as { semester?: number }).semester}`} • ` : ''}{targetObj.ects} AKTS
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold text-base 3xl:text-lg">Eşleştirilmedi</span>
                      )}
                    </td>

                    <td className="px-6 py-4 3xl:px-8 3xl:py-5">
                      {file ? (
                        <div className="flex items-center gap-2 text-base 3xl:text-lg text-emerald-800 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-5 h-5 3xl:w-6 3xl:h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px] 3xl:max-w-[300px]" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold text-base 3xl:text-lg">Dosya Eksik</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failing Courses Validation Warning */}
      {selectedCourses.some((c) => c.grade && !isPassingGrade(c.grade)) && (
        <div className="p-5 3xl:p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm sm:text-base 3xl:text-lg flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 3xl:w-7 3xl:h-7 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-base 3xl:text-lg">Başarısız Notlu Ders Uyarısı</p>
            <p className="text-sm 3xl:text-base text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Yönetmelik gereği başarısız (DC, DD, FD, FF, U) notlu derslerden muafiyet verilemez. Lütfen önceki adıma dönerek başarısız dersleri seçimden kaldırınız.
            </p>
          </div>
        </div>
      )}

      {/* Submission Error Alert */}
      {submitError && (
        <div className="p-5 3xl:p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm sm:text-base 3xl:text-lg flex items-start gap-3.5">
          <AlertCircle className="w-6 h-6 3xl:w-7 3xl:h-7 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-base 3xl:text-lg">Başvuru Gönderilemedi</p>
            <p className="text-sm 3xl:text-base text-rose-700 dark:text-rose-300 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3.5 3xl:px-8 3xl:py-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-base 3xl:text-lg font-bold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 3xl:w-6 3xl:h-6" />
          <span>Geri Dön ve Düzenle</span>
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || selectedCourses.some((c) => c.grade && !isPassingGrade(c.grade))}
          className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-8 3xl:py-4 3xl:px-10 rounded-2xl text-base 3xl:text-lg transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 3xl:w-6 3xl:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Başvuru Gönderiliyor...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 3xl:w-6 3xl:h-6" />
              <span>Başvuruyu Tamamla ve Gönder</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Title & Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Başvuru Özeti ve Onay
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Lütfen bilgilerinizi ve eşleştirdiğiniz dersleri kontrol ettikten sonra başvurunuzu sisteme iletiniz.
        </p>
      </div>

      {/* Student & Transfer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Öğrenci Bilgileri</span>
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Ad Soyad:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transcriptData.firstName} {transcriptData.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Geldiği Üniversite:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transcriptData.university}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Transkript Belgesi:</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                {transcriptFile.name}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {transferType === 'LATERAL_TRANSFER' ? (
              <ArrowRightLeft className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            ) : (
              <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            )}
            <span>Başvuru Türü ve Kapsamı</span>
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Geçiş Tipi:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transferType === 'LATERAL_TRANSFER'
                  ? 'Yatay Geçiş'
                  : 'Dikey Geçiş (DGS)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Talep Edilen Ders Sayısı:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCourses.length} Ders
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Toplam Başvuru AKTS:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {totalAkts} AKTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Courses Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Muafiyet Talep Edilen Dersler ve Hedef Eşleştirmeleri
          </h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
            {selectedCourses.length} Ders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Önceki Ders (Kaynak)</th>
                <th className="px-4 py-3">Tür & Not</th>
                <th className="px-4 py-3">Hedef Erciyes Dersi</th>
                <th className="px-4 py-3">Ders İçeriği PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedCourses.map((course) => {
                const targetObj = getTargetCourseInfo(course.targetCourseCode);
                const file = courseFiles[course.courseCode];

                return (
                  <tr key={course.courseCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {course.courseName}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-semibold text-[10px] sm:text-[11px]">
                          {course.courseCode}
                        </span>
                        <span>{course.ects} AKTS</span>
                        {course.semester && <span>• {course.semester}. Yarıyıl</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold px-2.5 py-0.5 rounded">
                        {getCourseTypeLabel(course.courseType)}
                      </div>
                      {course.grade && (
                        <div
                          className={`text-xs font-bold mt-1 ${
                            isPassingGrade(course.grade)
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400 font-bold'
                          }`}
                        >
                          Not: {course.grade} {!isPassingGrade(course.grade) && '(Başarısız)'}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {targetObj ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {targetObj.courseCode} - {targetObj.courseName}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Yarıyıl {targetObj.semester} • {targetObj.ects} AKTS
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold text-xs">Eşleştirilmedi</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {file ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[160px]" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold text-xs">Dosya Eksik</span>
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
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Dikkat: Başarısız Notlu Ders Tespit Edildi</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Yönetmelik ve sistem kuralları uyarınca başarısız (DC, DD, FD, FF, U) harf notuna sahip derslerden muafiyet talep edilemez. Sunucu doğrulaması bu başvuruyu reddedecektir. Lütfen önceki adıma dönerek başarısız dersleri seçimden kaldırınız.
            </p>
          </div>
        </div>
      )}

      {/* Submission Error Alert */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Başvuru Gönderilemedi</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön ve Düzenle</span>
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || selectedCourses.some((c) => c.grade && !isPassingGrade(c.grade))}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Başvuru Gönderiliyor...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Başvuruyu Tamamla ve Gönder</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

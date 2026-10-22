import React, { useState } from 'react';
import { 
  Check, 
  Upload, 
  FileText, 
  Trash2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Search
} from 'lucide-react';
import type { 
  CourseType, 
  ErciyesCourseResponseDto, 
  SelectedCourseRequestDto, 
  TranscriptCourses, 
  TransferType 
} from '../../types';
import { isPassingGrade } from '../../types';

interface Step2Props {
  parsedCourses: TranscriptCourses[];
  selectedCoursesMap: Map<string, SelectedCourseRequestDto>;
  setSelectedCoursesMap: React.Dispatch<React.SetStateAction<Map<string, SelectedCourseRequestDto>>>;
  courseFiles: Record<string, File>;
  setCourseFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  erciyesCourses: ErciyesCourseResponseDto[];
  transferType: TransferType;
  onBack: () => void;
  onNext: () => void;
}

export const Step2CourseSelection: React.FC<Step2Props> = ({
  parsedCourses,
  selectedCoursesMap,
  setSelectedCoursesMap,
  courseFiles,
  setCourseFiles,
  erciyesCourses,
  transferType,
  onBack,
  onNext,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');

  // Filter parsed courses
  const filteredCourses = parsedCourses.filter((c) => {
    const matchesSearch = 
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = 
      selectedSemesterFilter === 'ALL' || c.semester === selectedSemesterFilter;
    return matchesSearch && matchesSemester;
  });

  const availableSemesters = Array.from(
    new Set(parsedCourses.map((c) => c.semester).filter(Boolean))
  );

  const toggleSelectCourse = (course: TranscriptCourses) => {
    const nextMap = new Map(selectedCoursesMap);
    if (nextMap.has(course.courseCode)) {
      nextMap.delete(course.courseCode);
      const nextFiles = { ...courseFiles };
      delete nextFiles[course.courseCode];
      setCourseFiles(nextFiles);
    } else {
      nextMap.set(course.courseCode, {
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
        courseLanguage: course.courseLanguage || 'TURKISH',
        courseType: 'MANDATORY',
        ects: course.ects,
        grade: course.grade,
        targetCourseCode: '',
        exemptionStatus: 'PENDING',
      });
    }
    setSelectedCoursesMap(nextMap);
  };

  const updateCourseType = (courseCode: string, type: CourseType) => {
    const nextMap = new Map(selectedCoursesMap);
    const existing = nextMap.get(courseCode);
    if (existing) {
      nextMap.set(courseCode, { ...existing, courseType: type });
      setSelectedCoursesMap(nextMap);
    }
  };

  const updateTargetCourse = (courseCode: string, targetCode: string) => {
    const nextMap = new Map(selectedCoursesMap);
    const existing = nextMap.get(courseCode);
    if (existing) {
      nextMap.set(courseCode, { ...existing, targetCourseCode: targetCode });
      setSelectedCoursesMap(nextMap);
    }
  };

  const handleFileUpload = (courseCode: string, file: File | null) => {
    const nextFiles = { ...courseFiles };
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Ders içeriği sadece PDF formatında olmalıdır.');
        return;
      }
      nextFiles[courseCode] = file;
    } else {
      delete nextFiles[courseCode];
    }
    setCourseFiles(nextFiles);
  };

  // Validation checks
  const selectedCount = selectedCoursesMap.size;
  const missingTargets = Array.from(selectedCoursesMap.values()).filter(
    (c) => !c.targetCourseCode
  );
  const missingFiles = Array.from(selectedCoursesMap.keys()).filter(
    (code) => !courseFiles[code]
  );
  const isValid = selectedCount > 0 && missingTargets.length === 0 && missingFiles.length === 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap">
            <span>Ders Seçimi ve Erciyes Üniversitesi Ders Eşleştirmesi</span>
            <span className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-brand-200 dark:border-brand-800">
              {selectedCount} Ders Seçildi
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-700">
              {transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Transkriptinizdeki derslerden muaf olmak istediklerinizi seçin, ders türünü belirleyin, Erciyes Üniversitesi karşılığını seçin ve onaylı ders içeriği PDF&apos;ini yükleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextMap = new Map<string, SelectedCourseRequestDto>();
              parsedCourses.forEach((c) => {
                nextMap.set(c.courseCode, {
                  courseCode: c.courseCode,
                  courseName: c.courseName,
                  semester: c.semester,
                  courseLanguage: c.courseLanguage || 'TURKISH',
                  courseType: 'MANDATORY',
                  ects: c.ects,
                  grade: c.grade,
                  targetCourseCode: '',
                  exemptionStatus: 'PENDING',
                });
              });
              setSelectedCoursesMap(nextMap);
            }}
            className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            Tümünü Seç
          </button>
          <button
            onClick={() => {
              setSelectedCoursesMap(new Map());
              setCourseFiles({});
            }}
            className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-rose-200 dark:border-rose-800"
          >
            Seçimleri Temizle
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Ders kodu veya adına göre ara (Örn: MAT, FİZİK, CS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {availableSemesters.length > 0 && (
          <select
            value={selectedSemesterFilter}
            onChange={(e) => setSelectedSemesterFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">Tüm Yarıyıllar</option>
            {availableSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}. Yarıyıl
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {filteredCourses.map((course) => {
          const isSelected = selectedCoursesMap.has(course.courseCode);
          const currentConfig = selectedCoursesMap.get(course.courseCode);
          const currentFile = courseFiles[course.courseCode];
          const targetCourseObj = erciyesCourses.find(
            (ec) => ec.courseCode === currentConfig?.targetCourseCode
          );

          // ECTS comparison warning check
          const hasEctsWarning =
            targetCourseObj &&
            course.ects < targetCourseObj.ects &&
            currentConfig?.courseType !== 'COMMON_MANDATORY';

          return (
            <div
              key={course.courseCode}
              className={`rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-brand-500 dark:border-brand-400 shadow-md ring-1 ring-brand-500/20'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Course Checkbox & Basic Info */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelectCourse(course)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-colors border-2 ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                          {course.courseCode}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {course.courseName}
                        </h3>
                        {course.grade && (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                              isPassingGrade(course.grade)
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            Harf Notu: {course.grade} {!isPassingGrade(course.grade) && '(Başarısız)'}
                          </span>
                        )}
                      </div>

                      {course.grade && !isPassingGrade(course.grade) && isSelected && (
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 inline flex-shrink-0" />
                          <span>Yönetmelik gereği başarısız notlu ({course.grade}) derslerden muafiyet talep edilemez.</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>AKTS: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{course.ects}</strong></span>
                        {course.semester && <span>• Dönem: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{course.semester}</strong></span>}
                        {course.courseLanguage && (
                          <span>• Dil: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{course.courseLanguage === 'ENGLISH' ? 'İngilizce' : 'Türkçe'}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* If not selected: Simple Action Button */}
                  {!isSelected && (
                    <button
                      onClick={() => toggleSelectCourse(course)}
                      className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors self-start lg:self-center"
                    >
                      Muafiyet İçin Seç
                    </button>
                  )}
                </div>

                {/* Expanded Configuration when Selected */}
                {isSelected && currentConfig && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/90 dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    {/* 1. Course Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                        Ders Türü (Zorunlu/Seçmeli)
                      </label>
                      <select
                        value={currentConfig.courseType}
                        onChange={(e) =>
                          updateCourseType(course.courseCode, e.target.value as CourseType)
                        }
                        className="w-full text-xs sm:text-sm font-medium py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        <option value="MANDATORY">Zorunlu (Mandatory)</option>
                        <option value="COMMON_MANDATORY">Ortak Zorunlu (YÖK Zorunlu)</option>
                        <option value="ELECTIVE">Seçmeli (Elective)</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Transkriptte belirtilmediği için seçiniz
                      </p>
                    </div>

                    {/* 2. Target Erciyes Course Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
                        <span>Hedef Erciyes Dersi</span>
                        {targetCourseObj && (
                          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                            {targetCourseObj.ects} AKTS
                          </span>
                        )}
                      </label>
                      <select
                        value={currentConfig.targetCourseCode}
                        onChange={(e) =>
                          updateTargetCourse(course.courseCode, e.target.value)
                        }
                        className={`w-full text-xs sm:text-sm font-medium py-2 px-3 bg-white dark:bg-slate-900 border text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                          !currentConfig.targetCourseCode
                            ? 'border-amber-300 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="">-- Karşılık Gelen Erciyes Dersini Seçin --</option>
                        {erciyesCourses.map((ec) => (
                          <option key={ec.courseCode} value={ec.courseCode}>
                            {ec.courseCode} - {ec.courseName} (Yarıyıl {ec.semester}, {ec.ects} AKTS)
                          </option>
                        ))}
                      </select>

                      {hasEctsWarning && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Dersinizin AKTS&apos;si ({course.ects}), hedef dersin AKTS&apos;sinden ({targetCourseObj.ects}) düşüktür.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. Course Syllabus PDF Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
                        <span>Onaylı Ders İçeriği (PDF)</span>
                        <span className="text-[11px] text-rose-500 font-bold">*Zorunlu</span>
                      </label>

                      {currentFile ? (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-slate-800 dark:text-white truncate" title={currentFile.name}>
                              {currentFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileUpload(course.courseCode, null)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="Dosyayı Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-lg p-2 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600">
                          <Upload className="w-4 h-4" />
                          <span>Ders İçeriği PDF Yükle</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(course.courseCode, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Haftalık müfredatı içeren onaylı PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-colors">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri</span>
        </button>

        <div className="text-center sm:text-right">
          <p className="text-xs sm:text-sm">
            {selectedCount === 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Lütfen en az bir ders seçiniz.</span>
            ) : !isValid ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {missingTargets.length > 0
                  ? `${missingTargets.length} ders için Erciyes eşleştirmesi eksik.`
                  : `${missingFiles.length} ders için içerik PDF'i yüklenmedi.`}
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ Tüm seçimler ve PDF yüklemeleri tamamlandı.
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Başvuruyu İncele & Onayla</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

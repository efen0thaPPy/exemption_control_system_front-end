import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileText, 
  ExternalLink, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  UploadCloud, 
  Check, 
  X, 
  AlertTriangle,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  BarChart2,
  Award,
  Globe2
} from 'lucide-react';
import { exemptionApi } from '../../api/exemptionApi';
import type { 
  CourseType, 
  ExemptionResponseDto, 
  ExemptionStatus, 
  Grade, 
  SelectedCourseRequestDto, 
  SelectedCourseResponse 
} from '../../types';

export const CommitteeApplicationDetailPage: React.FC = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [similarityModalData, setSimilarityModalData] = useState<{
    courseName: string;
    targetCourseName: string;
    results: ExemptionResponseDto[];
  } | null>(null);

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newEcts, setNewEcts] = useState<number>(5);
  const [newGrade, setNewGrade] = useState<Grade>('AA');
  const [newCourseType, setNewCourseType] = useState<CourseType>('MANDATORY');
  const [newCourseLanguage, setNewCourseLanguage] = useState<'TURKISH' | 'ENGLISH'>('TURKISH');
  const [newTargetCourseCode, setNewTargetCourseCode] = useState('');
  const [newCourseFile, setNewCourseFile] = useState<File | null>(null);
  const [addCourseError, setAddCourseError] = useState<string | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Fetch application detail
  const {
    data: activeApp,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['application', trackingCode],
    queryFn: () => exemptionApi.getApplication(trackingCode!),
    enabled: !!trackingCode,
  });

  // Fetch Erciyes courses in the SAME academic year as application
  const { data: erciyesCourses = [] } = useQuery({
    queryKey: ['erciyes-courses-year', activeApp?.academicYear, activeApp?.transferType],
    queryFn: async () => {
      if (activeApp?.academicYear) {
        try {
          const yearCourses = await exemptionApi.getCoursesByAcademicYear(activeApp.academicYear);
          if (yearCourses && yearCourses.length > 0) return yearCourses;
        } catch {
          // fallback to transfer type
        }
      }
      return exemptionApi.getErciyesCourses(activeApp?.transferType || 'LATERAL_TRANSFER');
    },
    enabled: !!activeApp,
  });

  // Mutation: Update course status / target course
  const updateCourseMutation = useMutation({
    mutationFn: (params: {
      courseId: number;
      newTargetCourseCode?: string;
      newCourseCode?: string;
      exemptionStatus?: ExemptionStatus;
    }) =>
      exemptionApi.updateCourseStatus(trackingCode!, params.courseId, {
        newTargetCourseCode: params.newTargetCourseCode || params.newCourseCode,
        exemptionStatus: params.exemptionStatus,
      }),
    onSuccess: (updatedCourse: SelectedCourseResponse) => {
      queryClient.invalidateQueries({ queryKey: ['application', trackingCode] });
      const targetMsg = updatedCourse.targetCourseCode ? `Hedef: ${updatedCourse.targetCourseCode}` : '';
      const statusMsg = updatedCourse.exemptionStatus
        ? (updatedCourse.exemptionStatus === 'PASSED' ? 'Kabul' : updatedCourse.exemptionStatus === 'FAILED' ? 'Ret' : 'Beklemede')
        : 'Beklemede';
      showFeedback(`Ders güncellendi: ${updatedCourse.courseName || updatedCourse.courseCode} (${targetMsg ? targetMsg + ', ' : ''}Durum: ${statusMsg})`);
    },
    onError: (err: unknown) => {
      showFeedback((err as Error).message || 'Ders güncellenirken hata oluştu.', 'error');
    },
  });

  // Mutation: Update overall application status
  const updateAppStatusMutation = useMutation({
    mutationFn: (status: 'PENDING' | 'CONCLUDED') =>
      exemptionApi.updateApplicationStatus(trackingCode!, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['application', trackingCode] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      showFeedback(
        `Başvuru durumu güncellendi: ${updated.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'Beklemede'}`
      );
    },
    onError: (err: unknown) => {
      showFeedback((err as Error).message || 'Başvuru durumu güncellenemedi.', 'error');
    },
  });

  // Mutation: Delete course
  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: number) =>
      exemptionApi.deleteCourse(trackingCode!, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', trackingCode] });
      showFeedback('Ders başvurudan başarıyla kaldırıldı.');
    },
    onError: (err: unknown) => {
      showFeedback((err as Error).message || 'Ders silinemedi.', 'error');
    },
  });

  // Mutation: Add new course
  const addCourseMutation = useMutation({
    mutationFn: (vars: { courseDto: SelectedCourseRequestDto; file: File }) =>
      exemptionApi.addCourse(trackingCode!, vars.courseDto, vars.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', trackingCode] });
      setIsAddCourseModalOpen(false);
      resetAddCourseForm();
      showFeedback('Yeni ders başarıyla eklendi.');
    },
    onError: (err: unknown) => {
      setAddCourseError((err as Error).message || 'Ders eklenirken bir hata oluştu.');
    },
  });

  // Mutation: Similarity analysis
  const [evaluatingCourseId, setEvaluatingCourseId] = useState<number | null>(null);
  const evaluateSimilarityMutation = useMutation({
    mutationFn: (courseId: number) => exemptionApi.evaluateExemption(trackingCode!, courseId),
    onMutate: (courseId) => setEvaluatingCourseId(courseId),
    onSettled: () => setEvaluatingCourseId(null),
    onSuccess: (results, courseId) => {
      const course = activeApp?.selectedCourses.find((c) => c.id === courseId);
      setSimilarityModalData({
        courseName: course?.courseName || '',
        targetCourseName: course?.targetCourseCode || '',
        results,
      });
      showFeedback('Ders içerik benzerlik analizi tamamlandı.');
    },
    onError: (err: unknown) => {
      showFeedback((err as Error).message || 'Benzerlik analizi yapılamadı.', 'error');
    },
  });

  const resetAddCourseForm = () => {
    setNewCourseCode('');
    setNewCourseName('');
    setNewEcts(5);
    setNewGrade('AA');
    setNewCourseType('MANDATORY');
    setNewCourseLanguage('TURKISH');
    setNewTargetCourseCode('');
    setNewCourseFile(null);
    setAddCourseError(null);
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim() || !newCourseFile) {
      setAddCourseError('Lütfen tüm zorunlu alanları doldurun ve ders içeriği PDF belgesini yükleyin.');
      return;
    }

    const payload: SelectedCourseRequestDto = {
      courseCode: newCourseCode.trim(),
      courseName: newCourseName.trim(),
      ects: Number(newEcts),
      grade: newGrade,
      courseType: newCourseType,
      courseLanguage: newCourseLanguage,
      targetCourseCode: newTargetCourseCode.trim() || '',
      exemptionStatus: 'PENDING',
    };

    addCourseMutation.mutate({ courseDto: payload, file: newCourseFile });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Başvuru detayları yükleniyor...</p>
      </div>
    );
  }

  if (isError || !activeApp) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-800 text-center space-y-4">
        <p className="text-base font-bold text-rose-600 dark:text-rose-400">
          {(error as Error)?.message || 'Başvuru kaydı bulunamadı.'}
        </p>
        <button
          onClick={() => navigate('/komisyon')}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Başvurular Listesine Dön</span>
        </button>
      </div>
    );
  }

  const passedCount = activeApp.selectedCourses.filter((c) => c.exemptionStatus === 'PASSED').length;
  const failedCount = activeApp.selectedCourses.filter((c) => c.exemptionStatus === 'FAILED').length;
  const pendingCount = activeApp.selectedCourses.filter((c) => c.exemptionStatus === 'PENDING').length;

  return (
    <div className="space-y-5 w-full">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/komisyon')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Başvurulara Dön</span>
        </button>

        <div className="flex items-center gap-3">
          {actionFeedback && (
            <span
              className={`text-sm font-semibold px-4 py-2 rounded-xl animate-in fade-in ${
                actionFeedback.type === 'error'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {actionFeedback.message}
            </span>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-base font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Student & Application Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 3xl:space-y-7 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-base 3xl:text-lg font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-xl border border-brand-200 dark:border-brand-800">
                {activeApp.trackingCode}
              </span>
              <span
                className={`text-sm sm:text-base 3xl:text-lg px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-full font-bold ${
                  activeApp.applicationStatus === 'CONCLUDED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {activeApp.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'İnceleme Bekliyor'}
              </span>
              {activeApp.academicYear && (
                <span className="text-sm sm:text-base 3xl:text-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-xl font-mono font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-400" />
                  <span>Müfredat Yılı: {activeApp.academicYear}</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl 3xl:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {activeApp.student.firstName} {activeApp.student.lastName}
            </h2>

            <div className="flex items-center gap-4 text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400" />
                <span>{activeApp.student.university}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400" />
                <span>{activeApp.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş (DGS)'}</span>
              </span>
            </div>
          </div>

          {/* Primary Action Buttons: View Transcript PDF and Add Course */}
          <div className="flex items-center gap-3.5 3xl:gap-4 flex-wrap">
            <a
              href={exemptionApi.getTranscriptPdfUrl(activeApp.trackingCode)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-base 3xl:text-lg font-bold px-5 py-3 3xl:px-6 3xl:py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
            >
              <FileText className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-600 dark:text-slate-400" />
              <span>Transkript PDF&apos;ini Aç</span>
              <ExternalLink className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-400" />
            </a>

            <button
              onClick={() => {
                resetAddCourseForm();
                setIsAddCourseModalOpen(true);
              }}
              className="inline-flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white text-base 3xl:text-lg font-bold px-5 py-3 3xl:px-6 3xl:py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 3xl:w-6 3xl:h-6" />
              <span>Yeni Ders Ekle</span>
            </button>
          </div>
        </div>

        {/* Quick summary metrics */}
        <div className="flex items-center gap-5 text-sm sm:text-base 3xl:text-lg text-slate-600 dark:text-slate-300 flex-wrap">
          <span>Toplam Ders: <strong className="text-slate-900 dark:text-white font-bold">{activeApp.selectedCourses.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Kabul (Muaf): <strong>{passedCount}</strong></span>
          <span>•</span>
          <span className="text-rose-700 dark:text-rose-400 font-semibold">Reddedildi: <strong>{failedCount}</strong></span>
          <span>•</span>
          <span className="text-amber-700 dark:text-amber-400 font-semibold">Beklemede: <strong>{pendingCount}</strong></span>
        </div>
      </div>

      {/* Courses List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Ders Değerlendirme ve İntibak Eşleştirmeleri</span>
          </h3>
          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
            {activeApp.selectedCourses.length} Ders Kayıtlı
          </span>
        </div>

        {activeApp.selectedCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-sm">
            Bu başvuruda kayıtlı ders bulunmamaktadır. Yukarıdaki &apos;Yeni Ders Ekle&apos; butonu ile ders ekleyebilirsiniz.
          </div>
        ) : (
          activeApp.selectedCourses.map((c, idx) => {
            const targetCourseObj = erciyesCourses.find((ec) => ec.courseCode === c.targetCourseCode);
            const isEvaluating = evaluatingCourseId === c.id;

            return (
              <div
                key={c.courseCode}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all p-5 lg:p-6 space-y-5"
              >
                {/* 1. Comparison Grid: Source Course (Left) vs Target Course (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* LEFT COLUMN: Source Course & Its Contents */}
                  <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Kaynak Ders (Öğrencinin Aldığı)
                      </span>
                      <span className="font-mono text-base font-extrabold px-3 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/70 shadow-2xs">
                        {c.courseCode}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-lg lg:text-xl leading-snug">
                      {c.courseName}
                    </h4>

                    {/* Emphasized Course Metadata - Visibly larger than buttons */}
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      {/* AKTS / Kredi - Prominent badge */}
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 text-base font-bold shadow-2xs">
                        <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        <span><strong>{c.ects}</strong> AKTS</span>
                      </span>

                      {/* Harf Notu */}
                      {c.grade && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-mono text-base font-extrabold shadow-2xs">
                          <span>Not: <strong>{c.grade}</strong></span>
                        </span>
                      )}

                      {/* Ders Türü */}
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {c.courseType === 'MANDATORY' ? 'Zorunlu' : c.courseType === 'ELECTIVE' ? 'Seçmeli' : 'Ortak Zorunlu'}
                      </span>

                      {/* Ders Dili */}
                      {c.courseLanguage && (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <Globe2 className="w-4 h-4 text-slate-400" />
                          <span>{c.courseLanguage === 'ENGLISH' ? 'İngilizce' : 'Türkçe'}</span>
                        </span>
                      )}

                      {/* Yarıyıl */}
                      {(c.semesterName || c.semester) && (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{c.semesterName || `${c.semester}. Yarıyıl`}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Target Course Contents */}
                  <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Hedef Erciyes Karşılığı ({activeApp.academicYear || 'Aktif Müfredat'})
                      </span>
                      {targetCourseObj && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          c.ects >= targetCourseObj.ects 
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800' 
                            : 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {c.ects >= targetCourseObj.ects 
                            ? `✓ AKTS Karşılıyor (${c.ects} ≥ ${targetCourseObj.ects})` 
                            : `⚠ AKTS Yetersiz (${c.ects} < ${targetCourseObj.ects})`}
                        </span>
                      )}
                    </div>

                    {/* Target Course Selector */}
                    <div>
                      <select
                        value={c.targetCourseCode || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateCourseMutation.mutate({
                              courseId: c.id ?? (idx + 1),
                              newTargetCourseCode: e.target.value,
                            });
                          }
                        }}
                        className="w-full text-base font-medium py-2.5 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-2xs"
                      >
                        <option value="">-- Hedef Erciyes Karşılığı Seçiniz --</option>
                        {erciyesCourses.map((ec) => (
                          <option key={ec.courseCode} value={ec.courseCode}>
                            {ec.courseCode} - {ec.courseName} ({ec.ects} AKTS)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Emphasized Target Course Metadata */}
                    {targetCourseObj ? (
                      <div className="flex items-center gap-2.5 flex-wrap pt-1">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 text-base font-bold shadow-2xs">
                          <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                          <span><strong>{targetCourseObj.ects}</strong> AKTS</span>
                        </span>

                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {targetCourseObj.courseType === 'MANDATORY' ? 'Zorunlu' : targetCourseObj.courseType === 'ELECTIVE' ? 'Seçmeli' : 'Ortak Zorunlu'}
                        </span>

                        {(targetCourseObj.semesterName || (targetCourseObj as { semester?: number }).semester) && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{targetCourseObj.semesterName || `${(targetCourseObj as { semester?: number }).semester}. Yarıyıl`}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
                        Akademik karşılaştırma ve benzerlik analizi için listeden hedef dersi seçiniz.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. ACTION BUTTONS: Positioned BENEATH both courses, simple & clean */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                  {/* Left: Tools (PDF, Analysis, Delete) */}
                  <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                    {/* View PDF Button: Simple and lightweight */}
                    <a
                      href={exemptionApi.getCourseContentPdfUrl(activeApp.trackingCode, c.id ?? (idx + 1))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Onaylı Ders İçeriği PDF Belgesini Aç"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>İçerik PDF</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>

                    {/* Similarity Analysis Button: Clean outline */}
                    <button
                      onClick={() => evaluateSimilarityMutation.mutate(c.id ?? (idx + 1))}
                      disabled={isEvaluating || !c.targetCourseCode}
                      className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold px-3 py-2 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-brand-200 dark:border-brand-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      title={!c.targetCourseCode ? 'Önce hedef Erciyes dersini seçiniz' : 'Ders içeriklerini karşılaştırıp benzerlik raporu oluşturun'}
                    >
                      {isEvaluating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                          <span>Analiz Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <BarChart2 className="w-4 h-4 text-brand-500" />
                          <span>Benzerlik Analizi</span>
                        </>
                      )}
                    </button>

                    {/* Delete Course Action */}
                    <button
                      onClick={() => {
                        if (confirm(`'${c.courseName}' dersini bu başvurudan silmek istediğinize emin misiniz?`)) {
                          deleteCourseMutation.mutate(c.id ?? (idx + 1));
                        }
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      title="Dersi Bu Başvurudan Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dersi Sil</span>
                    </button>
                  </div>

                  {/* Right: Muafiyet Kararı Segmented Control */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden md:inline">
                      Karar:
                    </span>
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          updateCourseMutation.mutate({
                            courseId: c.id ?? (idx + 1),
                            exemptionStatus: 'PASSED',
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                          c.exemptionStatus === 'PASSED'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Kabul</span>
                      </button>

                      <button
                        onClick={() => {
                          updateCourseMutation.mutate({
                            courseId: c.id ?? (idx + 1),
                            exemptionStatus: 'FAILED',
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                          c.exemptionStatus === 'FAILED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Ret</span>
                      </button>

                      <button
                        onClick={() => {
                          updateCourseMutation.mutate({
                            courseId: c.id ?? (idx + 1),
                            exemptionStatus: 'PENDING',
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                          c.exemptionStatus === 'PENDING'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Bekle</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Finalize Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl p-5 3xl:p-7 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 text-sm sm:text-base 3xl:text-lg text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-700 dark:text-slate-200">İntibak Özeti:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">{passedCount} Kabul</span>
          <span>•</span>
          <span className="font-bold text-rose-700 dark:text-rose-400">{failedCount} Ret</span>
          <span>•</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">{pendingCount} Bekleyen</span>
        </div>

        <div className="flex items-center gap-3">
          {activeApp.applicationStatus === 'CONCLUDED' ? (
            <button
              onClick={() => updateAppStatusMutation.mutate('PENDING')}
              disabled={updateAppStatusMutation.isPending}
              className="text-sm sm:text-base 3xl:text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2.5 3xl:px-5 3xl:py-3 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors"
            >
              Yeniden İncelemeye Al
            </button>
          ) : (
            <button
              onClick={() => updateAppStatusMutation.mutate('CONCLUDED')}
              disabled={updateAppStatusMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base 3xl:text-lg px-5 py-2.5 3xl:px-6 3xl:py-3.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 3xl:w-5 3xl:h-5" />
              <span>Kararları Kaydet (Sonuçlandır)</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal: Yeni Ders Ekle */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Başvuruya Yeni Ders Ekle
              </h3>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addCourseError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{addCourseError}</span>
              </div>
            )}

            <form onSubmit={handleAddCourseSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ders Kodu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: BM 201"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ders Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Veri Yapıları"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    AKTS *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={newEcts}
                    onChange={(e) => setNewEcts(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harf Notu *
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value as Grade)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  >
                    {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'G', 'M'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ders Türü *
                  </label>
                  <select
                    value={newCourseType}
                    onChange={(e) => setNewCourseType(e.target.value as CourseType)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="MANDATORY">Zorunlu</option>
                    <option value="COMMON_MANDATORY">Ortak Zorunlu</option>
                    <option value="ELECTIVE">Seçmeli</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hedef Erciyes Dersi ({activeApp.academicYear || 'Aktif'})
                </label>
                <select
                  value={newTargetCourseCode}
                  onChange={(e) => setNewTargetCourseCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                >
                  <option value="">-- Hedef Ders Seçiniz (Opsiyonel) --</option>
                  {erciyesCourses.map((ec) => (
                    <option key={ec.courseCode} value={ec.courseCode}>
                      {ec.courseCode} - {ec.courseName} ({ec.ects} AKTS)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Onaylı Ders İçeriği (PDF) *
                </label>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewCourseFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="new-course-pdf-input"
                  />
                  <label htmlFor="new-course-pdf-input" className="cursor-pointer block">
                    <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                    {newCourseFile ? (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {newCourseFile.name} ({(newCourseFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        PDF dosyası seçmek için tıklayınız
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addCourseMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {addCourseMutation.isPending ? 'Ekleniyor...' : 'Dersi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Benzerlik Analizi Raporu */}
      {similarityModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Ders İçerik ve Benzerlik Raporu
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {similarityModalData.courseName} &rarr; {similarityModalData.targetCourseName}
                </p>
              </div>
              <button
                onClick={() => setSimilarityModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {similarityModalData.results
                .filter((res, idx, arr) => 
                  idx === arr.findIndex((r) => 
                    r.llmSimilarityPercent === res.llmSimilarityPercent && 
                    r.vectorSimilarityPercent === res.vectorSimilarityPercent &&
                    r.llmReport === res.llmReport
                  )
                )
                .map((res, index) => (
                <div key={index} className="space-y-3.5">
                  {/* Similarity Percentages */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LLM İçerik Benzerliği</span>
                      <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1.5">
                        %{res.llmSimilarityPercent?.toFixed(1) || '0.0'}
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vektörel Benzerlik</span>
                      <p className="text-3xl font-extrabold text-slate-700 dark:text-slate-200 mt-1.5">
                        %{res.vectorSimilarityPercent?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                  </div>

                  {/* Missing Topics */}
                  {res.missingTopics && (
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                      <span className="font-extrabold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wider">
                        Eksik Konular & Kazanımlar:
                      </span>
                      <p className="text-base text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                        {res.missingTopics}
                      </p>
                    </div>
                  )}

                  {/* Detailed Report */}
                  {res.llmReport && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">
                        Ayrıntılı Değerlendirme Raporu:
                      </span>
                      <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {res.llmReport}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSimilarityModalData(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

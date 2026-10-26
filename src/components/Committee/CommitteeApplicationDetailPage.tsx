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
  Globe2,
  Sparkles
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
    courseId: number;
    courseCode: string;
    courseName: string;
    targetCourseName: string;
    results: ExemptionResponseDto[];
  } | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<number | 'ALL'>('ALL');

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState('1');
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
  const [isForcingModel, setIsForcingModel] = useState<boolean>(false);
  const evaluateSimilarityMutation = useMutation({
    mutationFn: (vars: { courseId: number; forceReevaluate?: boolean }) => {
      setIsForcingModel(!!vars.forceReevaluate);
      return exemptionApi.evaluateExemption(trackingCode!, vars.courseId, vars.forceReevaluate);
    },
    onMutate: (vars) => setEvaluatingCourseId(vars.courseId),
    onSettled: () => {
      setEvaluatingCourseId(null);
      setIsForcingModel(false);
    },
    onSuccess: (results, vars) => {
      const course = activeApp?.selectedCourses.find((c) => c.id === vars.courseId);
      setSimilarityModalData({
        courseId: vars.courseId,
        courseCode: course?.courseCode || '',
        courseName: course?.courseName || '',
        targetCourseName: course?.targetCourseCode || '',
        results,
      });
      setCandidateFilter('ALL');
      showFeedback(vars.forceReevaluate ? 'Ders benzerlik analizi model çalıştırılarak sıfırdan yapıldı.' : 'Ders muafiyet raporu açıldı.');
    },
    onError: (err: unknown) => {
      showFeedback((err as Error).message || 'Benzerlik analizi yapılamadı.', 'error');
    },
  });

  const resetAddCourseForm = () => {
    setNewCourseCode('');
    setNewCourseName('');
    setNewCourseSemester('1');
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

    if (!newTargetCourseCode.trim()) {
      setAddCourseError('Lütfen eşleştirilecek hedef Erciyes dersini seçiniz.');
      return;
    }

    const payload: SelectedCourseRequestDto = {
      courseCode: newCourseCode.trim().toUpperCase(),
      courseName: newCourseName.trim(),
      semester: newCourseSemester.trim() || '1',
      ects: Number(newEcts),
      grade: newGrade,
      courseType: newCourseType,
      courseLanguage: newCourseLanguage,
      targetCourseCode: newTargetCourseCode.trim().toUpperCase(),
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

                    {/* Striking Hero: View Similarity Report Button (checks DB first) */}
                    <button
                      onClick={() => evaluateSimilarityMutation.mutate({ courseId: c.id ?? (idx + 1), forceReevaluate: false })}
                      disabled={isEvaluating}
                      className="inline-flex items-center gap-2 text-xs lg:text-sm font-bold px-4 py-2 rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 border border-indigo-400/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none"
                      title="Veritabanındaki mevcut benzerlik raporunu görüntüler (yoksa modeli çalıştırır)"
                    >
                      {isEvaluating && !isForcingModel ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <BarChart2 className="w-4 h-4 text-white" />
                          <span>Benzerlik Raporu</span>
                        </>
                      )}
                    </button>

                    {/* Subtle Secondary: Yine de Modeli Çalıştır */}
                    <button
                      onClick={() => evaluateSimilarityMutation.mutate({ courseId: c.id ?? (idx + 1), forceReevaluate: true })}
                      disabled={isEvaluating}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-40 disabled:pointer-events-none"
                      title="Nadir durumlarda: Veritabanındaki rapordan bağımsız olarak yapay zeka modelini sıfırdan tekrar çalıştırır"
                    >
                      {isEvaluating && isForcingModel ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
                          <span>Model Çalışıyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                          <span>Yine de Modeli Çalıştır</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Yarıyıl / Dönem *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 1 veya Güz"
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  />
                </div>

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
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold"
                  >
                    {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'S', 'U', 'M', 'ET'].map((g) => (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Öğretim Dili
                  </label>
                  <select
                    value={newCourseLanguage}
                    onChange={(e) => setNewCourseLanguage(e.target.value as 'TURKISH' | 'ENGLISH')}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="TURKISH">Türkçe</option>
                    <option value="ENGLISH">İngilizce</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hedef Erciyes Karşılığı * ({activeApp.academicYear || 'Aktif'})
                  </label>
                  <select
                    required
                    value={newTargetCourseCode}
                    onChange={(e) => setNewTargetCourseCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">-- Hedef Ders Seçiniz * --</option>
                    {erciyesCourses.map((ec) => (
                      <option key={ec.courseCode} value={ec.courseCode}>
                        {ec.courseCode} - {ec.courseName} ({ec.ects} AKTS)
                      </option>
                    ))}
                  </select>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto transition-colors">
            {/* Modal Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
                    Ders Muafiyet & İçerik Benzerlik Raporu
                  </h3>
                  <span className="text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-3 py-1 rounded-full">
                    {similarityModalData.results.length} Aday Eşleşme
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                  <span className="font-semibold text-slate-400">Kaynak Ders:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs">
                    {similarityModalData.courseCode}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {similarityModalData.courseName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                {/* Re-run Model Button */}
                <button
                  onClick={() =>
                    evaluateSimilarityMutation.mutate({
                      courseId: similarityModalData.courseId,
                      forceReevaluate: true,
                    })
                  }
                  disabled={evaluateSimilarityMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs disabled:opacity-50"
                  title="Veritabanındaki rapordan bağımsız olarak yapay zeka modelini sıfırdan tekrar çalıştırır"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-slate-400 ${
                      evaluateSimilarityMutation.isPending && isForcingModel ? 'animate-spin text-purple-600' : ''
                    }`}
                  />
                  <span>
                    {evaluateSimilarityMutation.isPending && isForcingModel ? 'Model Çalışıyor...' : 'Yine de Modeli Çalıştır'}
                  </span>
                </button>

                <button
                  onClick={() => setSimilarityModalData(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Candidate Selector Tabs (Row tabs if > 1 result) */}
            {similarityModalData.results.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setCandidateFilter('ALL')}
                  className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    candidateFilter === 'ALL'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tüm Adaylar ({similarityModalData.results.length})
                </button>
                {similarityModalData.results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setCandidateFilter(i)}
                    className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                      candidateFilter === i
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{i + 1}. Aday: {r.targetCourseCode || 'Hedef'}</span>
                    <span className="font-mono text-xs opacity-90">%{r.llmSimilarityPercent?.toFixed(0)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {similarityModalData.results.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
                <p className="text-base font-semibold">Bu ders için henüz bir muafiyet raporu bulunamadı.</p>
                <button
                  onClick={() =>
                    evaluateSimilarityMutation.mutate({
                      courseId: similarityModalData.courseId,
                      forceReevaluate: true,
                    })
                  }
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm"
                >
                  LLM Benzerlik Analizi Başlat
                </button>
              </div>
            ) : (
              /* Reports rendered row by row */
              <div className="space-y-6">
                {similarityModalData.results
                  .map((res, originalIndex) => ({ res, originalIndex }))
                  .filter(({ originalIndex }) => candidateFilter === 'ALL' || candidateFilter === originalIndex)
                  .map(({ res, originalIndex }) => {
                    const currentSelectedCourse = activeApp.selectedCourses.find(
                      (c) => c.id === similarityModalData.courseId
                    );
                    const isAlreadyTarget =
                      Boolean(res.targetCourseCode && currentSelectedCourse?.targetCourseCode === res.targetCourseCode);

                    return (
                      <div
                        key={originalIndex}
                        className="rounded-3xl border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 p-5 sm:p-6 space-y-5 shadow-xs transition-colors"
                      >
                        {/* Row Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-black uppercase tracking-wider bg-brand-600 text-white px-3 py-1 rounded-xl shadow-xs">
                              {similarityModalData.results.length > 1
                                ? `${originalIndex + 1}. Aday Karşılık`
                                : 'Hedef Ders Eşleşmesi'}
                            </span>
                            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {res.targetCourseCode || '—'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                              {res.targetCourseName || similarityModalData.targetCourseName}
                            </span>
                          </div>

                          {/* Quick Action: Assign as Target Course */}
                          <div className="flex items-center gap-2">
                            {res.targetCourseCode && !isAlreadyTarget ? (
                              <button
                                onClick={() => {
                                  updateCourseMutation.mutate({
                                    courseId: similarityModalData.courseId,
                                    newTargetCourseCode: res.targetCourseCode,
                                  });
                                  showFeedback(`Hedef ders ${res.targetCourseCode} olarak atandı.`);
                                }}
                                className="text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                                title="Bu adayı öğrencinin hedef Erciyes karşılığı olarak seç"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Bu Dersi Hedef Olarak Ata</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>Mevcut Hedef Ders</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Row Content: 3-column horizontal row layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                          {/* 1. Scores Column (lg:col-span-4) */}
                          <div className="lg:col-span-4 flex flex-col justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
                            <div className="space-y-3">
                              {/* LLM Semantic Score */}
                              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 dark:from-indigo-950/60 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-800/70">
                                <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                  <span>İçerik Semantik Benzerliği</span>
                                  <span className="text-2xl font-black text-indigo-900 dark:text-indigo-200">
                                    %{res.llmSimilarityPercent?.toFixed(1) || '0.0'}
                                  </span>
                                </div>
                                <div className="w-full bg-indigo-200/50 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, res.llmSimilarityPercent || 0)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Vector Cosine Score */}
                              <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50/80 to-emerald-50/40 dark:from-teal-950/60 dark:to-emerald-950/40 border border-teal-100 dark:border-teal-800/70">
                                <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300">
                                  <span>Vektörel Benzerlik</span>
                                  <span className="text-2xl font-black text-teal-900 dark:text-teal-200">
                                    %{res.vectorSimilarityPercent?.toFixed(1) || '0.0'}
                                  </span>
                                </div>
                                <div className="w-full bg-teal-200/50 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                                  <div
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, res.vectorSimilarityPercent || 0)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Match Evaluation Pill */}
                            <div
                              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center text-center ${
                                (res.llmSimilarityPercent || 0) >= 70
                                  ? 'bg-emerald-100/90 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : (res.llmSimilarityPercent || 0) >= 50
                                  ? 'bg-amber-100/90 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-100/90 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {(res.llmSimilarityPercent || 0) >= 70
                                ? '✓ Yüksek Uyum (Muafiyet Tavsiye Edilir)'
                                : (res.llmSimilarityPercent || 0) >= 50
                                ? '⚠ Kısmi Uyum (Komisyon İncelemesi Gerekli)'
                                : '✗ Düşük Uyum (Muafiyet Önerilmez)'}
                            </div>
                          </div>

                          {/* 2. Eksik Konular Column (lg:col-span-4) */}
                          <div className="lg:col-span-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/70 flex flex-col justify-between">
                            <div>
                              <span className="font-extrabold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span>Eksik Konular & Kazanımlar</span>
                              </span>
                              <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed max-h-56 overflow-y-auto pr-1 whitespace-pre-line">
                                {res.missingTopics || 'Hedef ders ile kaynak ders arasında belirgin bir konu eksiği bulunamadı.'}
                              </div>
                            </div>
                            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/70 pt-2 border-t border-amber-200/60 dark:border-amber-900/50 mt-2">
                              Müfredat kazanım farkı özeti
                            </div>
                          </div>

                          {/* 3. Detailed Report Column (lg:col-span-4) */}
                          <div className="lg:col-span-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Ayrıntılı Değerlendirme Raporu</span>
                              </span>
                              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-56 overflow-y-auto pr-1 whitespace-pre-line font-sans">
                                {res.llmReport || 'Ayrıntılı rapor verisi bulunamadı.'}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                              Llama 3.1 LLM karşılaştırma çıktısı
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Modal Bottom Bar */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSimilarityModalData(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
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

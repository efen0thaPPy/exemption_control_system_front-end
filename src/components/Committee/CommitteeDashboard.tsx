import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCheck,
  Maximize2,
  Minimize2,
  Plus,
  BarChart3,
  UploadCloud,
  GraduationCap,
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { exemptionApi } from '../../api/exemptionApi';
import type { 
  ApplicationStatus, 
  CourseType, 
  ExemptionResponseDto, 
  ExemptionStatus, 
  Grade, 
  SelectedCourseRequestDto, 
  SelectedCourseResponse 
} from '../../types';

export const CommitteeDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { trackingCode: routeTrackingCode } = useParams<{ trackingCode?: string }>();
  const navigate = useNavigate();

  const [selectedTrackingCode, setSelectedTrackingCode] = useState<string>(routeTrackingCode || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Target course editing state
  const [editingTargetCode, setEditingTargetCode] = useState<string | null>(null);
  const [targetCodeInput, setTargetCodeInput] = useState('');

  // Course Content & Similarity Evaluation Modal state
  const [evaluatingCourse, setEvaluatingCourse] = useState<SelectedCourseResponse | null>(null);
  const [isEvaluationMinimized, setIsEvaluationMinimized] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<ExemptionResponseDto[] | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [dashboardCandidateFilter, setDashboardCandidateFilter] = useState<number | 'ALL'>('ALL');
  const [isForcingModel, setIsForcingModel] = useState<boolean>(false);

  // Add Course Modal State
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseEcts, setNewCourseEcts] = useState<number | ''>(5);
  const [newCourseGrade, setNewCourseGrade] = useState<Grade>('AA');
  const [newCourseType, setNewCourseType] = useState<CourseType>('MANDATORY');
  const [newCourseLanguage, setNewCourseLanguage] = useState<'TURKISH' | 'ENGLISH'>('TURKISH');
  const [newCourseSemester, setNewCourseSemester] = useState('1');
  const [newTargetCourseCode, setNewTargetCourseCode] = useState('');
  const [newCoursePdf, setNewCoursePdf] = useState<File | null>(null);
  const [addCourseFormError, setAddCourseFormError] = useState<string | null>(null);

  // Global action feedback banner
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // 1. Applications List Query
  const {
    data: applications = [],
    isLoading: isLoadingApps,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: () => exemptionApi.getApplications(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const activeTrackingCode = routeTrackingCode || selectedTrackingCode || applications[0]?.trackingCode || '';

  // 2. Active Application Detail Query
  const {
    data: activeApp,
    isLoading: isLoadingActiveApp,
    refetch: refetchActiveApp,
  } = useQuery({
    queryKey: ['application-detail', activeTrackingCode],
    queryFn: () => exemptionApi.getApplication(activeTrackingCode),
    enabled: !!activeTrackingCode,
  });

  // Query Erciyes courses for target matching dropdown
  const { data: erciyesCourses = [] } = useQuery({
    queryKey: ['erciyes-courses', activeApp?.transferType],
    queryFn: () => exemptionApi.getErciyesCourses(activeApp!.transferType),
    enabled: !!activeApp?.transferType,
  });

  // 3. Exemption Evaluation Mutation (Similarity analysis of syllabus)
  const exemptionMutation = useMutation({
    mutationFn: ({
      trackingCode,
      courseId,
      forceReevaluate,
    }: {
      trackingCode: string;
      courseId: number;
      forceReevaluate?: boolean;
    }) => {
      setIsForcingModel(!!forceReevaluate);
      return exemptionApi.evaluateExemption(trackingCode, courseId, forceReevaluate);
    },
    onSuccess: (data, vars) => {
      setEvaluationResults(data);
      setDashboardCandidateFilter('ALL');
      showFeedback(vars.forceReevaluate ? 'Ders benzerlik analizi model çalıştırılarak sıfırdan yapıldı.' : 'Ders muafiyet raporu açıldı.');
    },
    onError: (err: Error) => {
      setEvaluationError(err.message || 'Ders analiz edilirken bir hata oluştu.');
      showFeedback(err.message || 'Ders analiz edilemedi.', 'error');
    },
    onSettled: () => {
      setIsForcingModel(false);
    },
  });

  // 4. Update Application Status (PENDING -> CONCLUDED)
  const updateAppStatusMutation = useMutation({
    mutationFn: ({ trackingCode, status }: { trackingCode: string; status: ApplicationStatus }) =>
      exemptionApi.updateApplicationStatus(trackingCode, status),
    onSuccess: (updatedApp) => {
      queryClient.setQueryData(['application-detail', updatedApp.trackingCode], updatedApp);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      showFeedback(`Başvuru durumu "${updatedApp.applicationStatus}" olarak güncellendi.`);
    },
    onError: (err: Error) => {
      showFeedback(err.message || 'Başvuru durumu güncellenemedi.', 'error');
    },
  });

  // 5. Update Course Status or Target Course
  const updateCourseMutation = useMutation({
    mutationFn: ({
      trackingCode,
      courseId,
      newCourseCode,
      exemptionStatus,
    }: {
      trackingCode: string;
      courseId: number;
      newCourseCode?: string;
      exemptionStatus?: ExemptionStatus;
    }) =>
      exemptionApi.updateCourseStatus(trackingCode, courseId, {
        newCourseCode,
        exemptionStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', activeTrackingCode] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setEditingTargetCode(null);
      showFeedback('Ders durumu başarıyla güncellendi.');
    },
    onError: (err: Error) => {
      showFeedback(err.message || 'Ders güncellenemedi.', 'error');
    },
  });

  // 6. Delete Course mutation (DELETE /api/applications/{trackingCode}/courses/{courseId})
  const deleteCourseMutation = useMutation({
    mutationFn: ({ trackingCode, courseId }: { trackingCode: string; courseId: number }) =>
      exemptionApi.deleteCourse(trackingCode, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', activeTrackingCode] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      showFeedback('Ders başvurudan kaldırıldı.');
    },
    onError: (err: Error) => {
      showFeedback(err.message || 'Ders silinemedi.', 'error');
    },
  });

  // 7. Add Course mutation (POST /api/applications/{trackingCode}/courses)
  const addCourseMutation = useMutation({
    mutationFn: ({
      trackingCode,
      dto,
      file,
    }: {
      trackingCode: string;
      dto: SelectedCourseRequestDto;
      file: File;
    }) => exemptionApi.addCourse(trackingCode, dto, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', activeTrackingCode] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsAddCourseModalOpen(false);
      resetAddCourseForm();
      showFeedback('Yeni ders ve içerik belgesi başarıyla eklendi.');
    },
    onError: (err: Error) => {
      setAddCourseFormError(err.message || 'Ders eklenirken bir hata oluştu.');
      showFeedback(err.message || 'Ders eklenemedi.', 'error');
    },
  });

  const resetAddCourseForm = () => {
    setNewCourseCode('');
    setNewCourseName('');
    setNewCourseEcts(5);
    setNewCourseGrade('AA');
    setNewCourseType('MANDATORY');
    setNewCourseLanguage('TURKISH');
    setNewCourseSemester('1');
    setNewTargetCourseCode('');
    setNewCoursePdf(null);
    setAddCourseFormError(null);
  };

  const handleOpenAddCourseModal = () => {
    resetAddCourseForm();
    if (erciyesCourses.length > 0) {
      setNewTargetCourseCode(erciyesCourses[0].courseCode);
    }
    setIsAddCourseModalOpen(true);
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrackingCode) return;
    if (!newCourseCode.trim() || !newCourseName.trim()) {
      setAddCourseFormError('Lütfen ders kodu ve ders adını eksiksiz giriniz.');
      return;
    }
    if (!newCoursePdf) {
      setAddCourseFormError('Lütfen dersin onaylı içerik PDF dosyasını yükleyiniz.');
      return;
    }
    if (!newTargetCourseCode.trim()) {
      setAddCourseFormError('Lütfen eşleştirilecek hedef Erciyes dersini belirleyiniz.');
      return;
    }

    const courseDto: SelectedCourseRequestDto = {
      courseCode: newCourseCode.trim().toUpperCase(),
      courseName: newCourseName.trim(),
      semester: newCourseSemester.trim() || '1',
      courseLanguage: newCourseLanguage,
      courseType: newCourseType,
      ects: Number(newCourseEcts) || 5,
      grade: newCourseGrade,
      targetCourseCode: newTargetCourseCode.trim().toUpperCase(),
      exemptionStatus: 'PENDING',
    };

    setAddCourseFormError(null);
    addCourseMutation.mutate({
      trackingCode: activeTrackingCode,
      dto: courseDto,
      file: newCoursePdf,
    });
  };

  const handleStartEvaluation = (course: SelectedCourseResponse, index: number, forceReevaluate = false) => {
    if (!activeTrackingCode) return;
    setEvaluatingCourse(course);
    setIsForcingModel(forceReevaluate);
    setIsEvaluationMinimized(false);
    setEvaluationResults(null);
    setEvaluationError(null);
    const courseId = course.id ?? (index + 1);
    exemptionMutation.mutate({
      trackingCode: activeTrackingCode,
      courseId,
      forceReevaluate,
    });
  };

  const filteredApps = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
    const code = app.trackingCode.toLowerCase();
    const uni = app.university.toLowerCase();
    return fullName.includes(query) || code.includes(query) || uni.includes(query);
  });

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Komisyon Yönetim Paneli
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              Öğrenci intibak başvurularını inceleyin, ders ekleyip çıkarın ve müfredat benzerlik analizlerini gerçekleştirin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {actionFeedback && (
            <span
              className={`text-sm px-4 py-2 rounded-xl font-bold animate-in fade-in duration-200 shadow-sm ${
                actionFeedback.type === 'error'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {actionFeedback.message}
            </span>
          )}

          <button
            onClick={() => {
              refetchApps();
              if (activeTrackingCode) refetchActiveApp();
            }}
            className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Applications List (Left 3-4 cols) & Detail (Right 8-9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        {/* Left Column: Applications List */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
              Başvurular ({filteredApps.length})
            </h2>
            <span className="text-sm sm:text-base font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-xl">
              Toplam {applications.length}
            </span>
          </div>

          {/* Search applications */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim, takip kodu veya üniversite..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`py-2 text-sm sm:text-base font-bold rounded-xl transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`py-2 text-sm sm:text-base font-bold rounded-xl transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bekleyen
            </button>
            <button
              onClick={() => setStatusFilter('CONCLUDED')}
              className={`py-2 text-sm sm:text-base font-bold rounded-xl transition-all ${
                statusFilter === 'CONCLUDED'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sonuçlanan
            </button>
          </div>

          {/* Applications Scroll Area */}
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {isLoadingApps ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-base">
                Başvurular yükleniyor...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-base">
                Kriterlere uygun başvuru bulunamadı.
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = app.trackingCode === activeTrackingCode;
                return (
                  <div
                    key={app.trackingCode}
                    onClick={() => {
                      setSelectedTrackingCode(app.trackingCode);
                      navigate(`/komisyon/${app.trackingCode}`);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md ring-1 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {app.trackingCode}
                      </span>
                      <span
                        className={`text-sm px-2.5 py-1 rounded-full font-bold ${
                          app.applicationStatus === 'CONCLUDED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {app.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'Beklemede'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mt-2">
                      {app.firstName} {app.lastName}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {app.university}
                    </p>
                    <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-2">
                      <span>{app.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Application Details */}
        <div className="lg:col-span-8 xl:col-span-9">
          {isLoadingActiveApp ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center text-slate-400 dark:text-slate-500 text-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              Başvuru detayları yükleniyor...
            </div>
          ) : !activeApp ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Overview Welcome Banner */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Komisyon Yönetim & Karar Paneli
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                      Öğrenci intibak başvurularını incelemek, ders eşleştirmelerini onaylamak ve muafiyet kararlarını vermek için sol listeden bir başvuru seçiniz.
                    </p>
                  </div>

                  {applications.length > 0 && (
                    <button
                      onClick={() => {
                        const firstCode = applications[0].trackingCode;
                        setSelectedTrackingCode(firstCode);
                        navigate(`/komisyon/${firstCode}`);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2 self-start sm:self-auto"
                    >
                      <span>İlk Başvuruyu Aç</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <p className="text-sm sm:text-base font-bold text-slate-400 uppercase tracking-wider">Toplam Başvuru</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{applications.length}</p>
                  <p className="text-sm sm:text-base text-slate-500">Sistemde kayıtlı intibak başvurusu</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <p className="text-sm sm:text-base font-bold text-amber-500 uppercase tracking-wider">İncelenmeyi Bekleyen</p>
                  <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                    {applications.filter((a) => a.applicationStatus === 'PENDING').length}
                  </p>
                  <p className="text-sm sm:text-base text-slate-500">Karar verilmesi gereken başvurular</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <p className="text-sm sm:text-base font-bold text-emerald-500 uppercase tracking-wider">Sonuçlanan Başvurular</p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    {applications.filter((a) => a.applicationStatus === 'CONCLUDED').length}
                  </p>
                  <p className="text-sm sm:text-base text-slate-500">Kesinleşmiş ve onaylanmış intibaklar</p>
                </div>
              </div>

              {/* Workflow Guidance Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Komisyon İnceleme Adımları
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">1. Transkript & Belgeleri İnceleyin</p>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Öğrencinin transkript PDF belgesini ve onaylı ders müfredatlarını doğrudan ekranda açın.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">2. Ders Eşleştirmelerini Yönetin</p>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Gerektiğinde yeni ders ekleyin veya transkript dışı dersleri tablodan kaldırın.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">3. İçerik ve Benzerlik Raporu Alın</p>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Erciyes dersiyle ders içeriği benzerlik yüzdesini ve eksik konu kazanımlarını analiz edin.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">4. Nihai Kararı Sisteme Kaydedin</p>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Her ders için Kabul / Ret seçerek 'Başvuru Kararını Kaydet' ile intibakı sonuçlandırın.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Application Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        {activeApp.trackingCode}
                      </span>
                      <span
                        className={`text-sm sm:text-base px-3.5 py-1 rounded-full font-bold ${
                          activeApp.applicationStatus === 'CONCLUDED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {activeApp.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'İnceleme Bekliyor'}
                      </span>
                      {activeApp.academicYear && (
                        <span className="text-sm sm:text-base bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl font-mono font-semibold">
                          {activeApp.academicYear}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                      {activeApp.student.firstName} {activeApp.student.lastName}
                    </h2>
                    <div className="flex items-center gap-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {activeApp.student.university}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        {activeApp.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Toggle Application Status Button */}
                    <button
                      onClick={() => {
                        const nextStatus: ApplicationStatus =
                          activeApp.applicationStatus === 'CONCLUDED' ? 'PENDING' : 'CONCLUDED';
                        updateAppStatusMutation.mutate({
                          trackingCode: activeApp.trackingCode,
                          status: nextStatus,
                        });
                      }}
                      disabled={updateAppStatusMutation.isPending}
                      className={`inline-flex items-center gap-2 text-sm sm:text-base font-bold px-5 py-2.5 rounded-2xl border transition-all shadow-sm ${
                        activeApp.applicationStatus === 'CONCLUDED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
                      }`}
                      title={activeApp.applicationStatus === 'CONCLUDED' ? 'Başvuruyu Beklemeye Al' : 'Tüm dersler tamamlandıysa başvuruyu sonuçlandır'}
                    >
                      <CheckCheck className="w-5 h-5" />
                      <span>{activeApp.applicationStatus === 'CONCLUDED' ? 'Beklemeye Al' : 'Sonuçlandır'}</span>
                    </button>

                    <a
                      href={exemptionApi.getTranscriptPdfUrl(activeApp.trackingCode)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-sm sm:text-base font-bold px-5 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
                    >
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Transkript PDF</span>
                      <ExternalLink className="w-4 h-4 text-indigo-400" />
                    </a>
                  </div>
                </div>

                {/* Courses Header & "+ Yeni Ders Ekle" Button */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
                        Değerlendirilen Dersler ({activeApp.selectedCourses.length})
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                        Öğrencinin intibak talep ettiği dersler, Erciyes eşleşmeleri ve onaylı müfredat içerikleri
                      </p>
                    </div>

                    {/* Integrated Add Course Button */}
                    <button
                      onClick={handleOpenAddCourseModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm sm:text-base transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Yeni Ders Ekle</span>
                    </button>
                  </div>

                  {/* Course Cards List */}
                  <div className="space-y-4">
                    {activeApp.selectedCourses.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
                        Bu başvuruda henüz kayıtlı ders bulunmamaktadır. Yukarıdaki &quot;Yeni Ders Ekle&quot; butonu ile ders ekleyebilirsiniz.
                      </div>
                    ) : (
                      activeApp.selectedCourses.map((c, idx) => {
                        const courseId = c.id ?? (idx + 1);
                        const isEditingTarget = editingTargetCode === c.courseCode;

                        return (
                          <div
                            key={c.courseCode}
                            className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 shadow-sm"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-mono text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-xl">
                                    {c.courseCode}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                                    {c.courseName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
                                  <span>AKTS: <strong className="text-slate-900 dark:text-white font-bold">{c.ects}</strong></span>
                                  <span>•</span>
                                  {c.grade && (
                                    <>
                                      <span>Not: <strong className="text-slate-900 dark:text-white font-bold">{c.grade}</strong></span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>Tür: <strong className="text-slate-900 dark:text-white font-semibold">{c.courseType}</strong></span>
                                  {c.courseLanguage && (
                                    <>
                                      <span>•</span>
                                      <span>Dil: <strong className="text-slate-900 dark:text-white font-semibold">{c.courseLanguage === 'ENGLISH' ? 'İngilizce' : 'Türkçe'}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 flex-wrap">
                                {/* View Syllabus PDF */}
                                <a
                                  href={exemptionApi.getCourseContentPdfUrl(
                                    activeApp.trackingCode,
                                    courseId
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2 font-semibold transition-colors shadow-sm"
                                  title="Öğrencinin yüklediği onaylı ders içeriği PDF belgesi"
                                >
                                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                  <span>İçerik PDF</span>
                                </a>

                                {/* Striking Primary: Benzerlik Raporu */}
                                <button
                                  onClick={() => handleStartEvaluation(c, idx, false)}
                                  disabled={exemptionMutation.isPending && evaluatingCourse?.id === courseId}
                                  className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 border border-indigo-400/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                  title="Veritabanındaki mevcut benzerlik raporunu görüntüler (yoksa modeli çalıştırır)"
                                >
                                  {exemptionMutation.isPending && evaluatingCourse?.id === courseId && !isForcingModel ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      <span>Yükleniyor...</span>
                                    </>
                                  ) : (
                                    <>
                                      <BarChart3 className="w-4 h-4 text-white" />
                                      <span>Benzerlik Raporu</span>
                                    </>
                                  )}
                                </button>

                                {/* Subtle Secondary: Yine de Modeli Çalıştır */}
                                <button
                                  onClick={() => handleStartEvaluation(c, idx, true)}
                                  disabled={exemptionMutation.isPending && evaluatingCourse?.id === courseId}
                                  className="text-xs font-semibold px-2.5 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                  title="Nadir durumlarda: Veritabanındaki rapordan bağımsız olarak yapay zeka modelini sıfırdan tekrar çalıştırır"
                                >
                                  {exemptionMutation.isPending && evaluatingCourse?.id === courseId && isForcingModel ? (
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

                                {/* Delete Course Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`${c.courseCode} - ${c.courseName} dersini başvurudan kaldırmak istediğinize emin misiniz?`)) {
                                      deleteCourseMutation.mutate({
                                        trackingCode: activeApp.trackingCode,
                                        courseId,
                                      });
                                    }
                                  }}
                                  disabled={deleteCourseMutation.isPending}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                                  title="Dersi Başvurudan Kaldır"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Target Course & Status Bar */}
                            <div className="text-sm bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Hedef Erciyes:</span>
                                {isEditingTarget ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={targetCodeInput}
                                      onChange={(e) => setTargetCodeInput(e.target.value)}
                                      placeholder="Örn: BM 101"
                                      className="px-3 py-1 border border-brand-500 rounded-xl text-sm uppercase font-mono font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    />
                                    <button
                                      onClick={() => {
                                        if (targetCodeInput.trim()) {
                                          updateCourseMutation.mutate({
                                            trackingCode: activeApp.trackingCode,
                                            courseId,
                                            newCourseCode: targetCodeInput.trim().toUpperCase(),
                                          });
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                                      title="Kaydet"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTargetCode(null)}
                                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                      title="İptal"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                      {c.targetCourseCode || 'Eşleştirilmemiş'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingTargetCode(c.courseCode);
                                        setTargetCodeInput(c.targetCourseCode || '');
                                      }}
                                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Hedef Dersi Değiştir"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Quick Status Setter Chips */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateCourseMutation.mutate({
                                      trackingCode: activeApp.trackingCode,
                                      courseId,
                                      exemptionStatus: 'PASSED',
                                    })
                                  }
                                  disabled={updateCourseMutation.isPending || c.exemptionStatus === 'PASSED'}
                                  className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center gap-1.5 ${
                                    c.exemptionStatus === 'PASSED'
                                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300'
                                  }`}
                                  title="Muafiyeti Onayla"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Kabul</span>
                                </button>

                                <button
                                  onClick={() =>
                                    updateCourseMutation.mutate({
                                      trackingCode: activeApp.trackingCode,
                                      courseId,
                                      exemptionStatus: 'FAILED',
                                    })
                                  }
                                  disabled={updateCourseMutation.isPending || c.exemptionStatus === 'FAILED'}
                                  className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center gap-1.5 ${
                                    c.exemptionStatus === 'FAILED'
                                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300'
                                  }`}
                                  title="Muafiyeti Reddet"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Red</span>
                                </button>

                                <button
                                  onClick={() =>
                                    updateCourseMutation.mutate({
                                      trackingCode: activeApp.trackingCode,
                                      courseId,
                                      exemptionStatus: 'PENDING',
                                    })
                                  }
                                  disabled={updateCourseMutation.isPending || c.exemptionStatus === 'PENDING'}
                                  className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center gap-1.5 ${
                                    c.exemptionStatus === 'PENDING'
                                      ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/60 dark:hover:text-amber-300'
                                  }`}
                                  title="Beklemeye Al"
                                >
                                  <Clock className="w-4 h-4" />
                                  <span>Beklet</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      {isAddCourseModalOpen && activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
                    Başvuruya Yeni Ders Ekle
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {activeApp.student.firstName} {activeApp.student.lastName} ({activeApp.trackingCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} className="space-y-5">
              {addCourseFormError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold">{addCourseFormError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Kaynak Ders Kodu *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="Örn: MAT 101, CS 102"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Kaynak Ders Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Örn: Matematik I, Algoritmalar"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    AKTS Kredisi *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={newCourseEcts}
                    onChange={(e) => setNewCourseEcts(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Başarı Notu *
                  </label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value as Grade)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AA">AA (4.00)</option>
                    <option value="BA">BA (3.50)</option>
                    <option value="BB">BB (3.00)</option>
                    <option value="CB">CB (2.50)</option>
                    <option value="CC">CC (2.00)</option>
                    <option value="DC">DC (1.50)</option>
                    <option value="DD">DD (1.00)</option>
                    <option value="FD">FD (0.50)</option>
                    <option value="FF">FF (0.00)</option>
                    <option value="S">S (Başarılı)</option>
                    <option value="U">U (Başarısız)</option>
                    <option value="M">M (Muaf)</option>
                    <option value="ET">ET (Eşdeğer)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Ders Türü *
                  </label>
                  <select
                    value={newCourseType}
                    onChange={(e) => setNewCourseType(e.target.value as CourseType)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MANDATORY">Zorunlu</option>
                    <option value="ELECTIVE">Seçmeli</option>
                    <option value="COMMON_MANDATORY">Ortak Zorunlu</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Ders Dili
                  </label>
                  <select
                    value={newCourseLanguage}
                    onChange={(e) => setNewCourseLanguage(e.target.value as 'TURKISH' | 'ENGLISH')}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TURKISH">Türkçe</option>
                    <option value="ENGLISH">İngilizce</option>
                  </select>
                </div>
              </div>

              {/* Target Course Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Eşleştirilecek Hedef Erciyes Dersi *
                </label>
                {erciyesCourses.length > 0 ? (
                  <select
                    value={newTargetCourseCode}
                    onChange={(e) => setNewTargetCourseCode(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seçiniz...</option>
                    {erciyesCourses.map((ec) => (
                      <option key={ec.courseCode} value={ec.courseCode}>
                        {ec.courseCode} - {ec.courseName} ({ec.ects} AKTS)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newTargetCourseCode}
                    onChange={(e) => setNewTargetCourseCode(e.target.value)}
                    placeholder="Örn: BM 101"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-base bg-white dark:bg-slate-950 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Course Syllabus PDF Upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Onaylı Ders İçeriği PDF Belgesi *
                </label>
                <div
                  onClick={() => document.getElementById('new-course-pdf-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    newCoursePdf
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    id="new-course-pdf-input"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.type !== 'application/pdf') {
                          alert('Lütfen sadece PDF belgesi yükleyiniz.');
                          return;
                        }
                        setNewCoursePdf(file);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    {newCoursePdf ? (
                      <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  {newCoursePdf ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {newCoursePdf.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {(newCoursePdf.size / 1024 / 1024).toFixed(2)} MB • Değiştirmek için tıklayınız
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                        Ders içerik PDF belgesini seçmek için tıklayınız
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Sadece PDF formatı desteklenir
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-5 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-base transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addCourseMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 py-3 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 disabled:opacity-50"
                >
                  {addCourseMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Dersi Başvuruya Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Content & Similarity Analysis Modal (When not minimized) */}
      {evaluatingCourse && !isEvaluationMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
                    Ders İçeriği & Benzerlik Analizi
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {evaluatingCourse.courseCode} - {evaluatingCourse.courseName} &rarr; {evaluatingCourse.targetCourseCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Re-run Model Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeTrackingCode && evaluatingCourse) {
                      const courseId = evaluatingCourse.id ?? 1;
                      exemptionMutation.mutate({
                        trackingCode: activeTrackingCode,
                        courseId,
                        forceReevaluate: true,
                      });
                    }
                  }}
                  disabled={exemptionMutation.isPending}
                  className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs disabled:opacity-50"
                  title="Veritabanındaki rapordan bağımsız olarak yapay zeka modelini sıfırdan tekrar çalıştırır"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-slate-400 ${
                      exemptionMutation.isPending && isForcingModel ? 'animate-spin text-purple-600' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {exemptionMutation.isPending && isForcingModel ? 'Model Çalışıyor...' : 'Yine de Modeli Çalıştır'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEvaluationMinimized(true)}
                  title="Simge Durumuna Küçült"
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Küçült</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (exemptionMutation.isPending) {
                      setIsEvaluationMinimized(true);
                    } else {
                      setEvaluatingCourse(null);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {exemptionMutation.isPending && (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Ders İçerikleri Karşılaştırılıyor ve Benzerlik Analizi Yapılıyor...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Öğrencinin ders müfredat içeriği ile Erciyes Üniversitesi ders içeriği anlamsal olarak karşılaştırılıyor.
                </p>
              </div>
            )}

            {/* Error State */}
            {evaluationError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base">Değerlendirme Başarısız</p>
                  <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{evaluationError}</p>
                </div>
              </div>
            )}

            {/* Results State - Separated by Row */}
            {evaluationResults && evaluationResults.length > 0 && (
              <div className="space-y-6">
                {/* Candidate Selector Tabs (if multiple candidates) */}
                {evaluationResults.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      onClick={() => setDashboardCandidateFilter('ALL')}
                      className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                        dashboardCandidateFilter === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Tüm Adaylar ({evaluationResults.length})
                    </button>
                    {evaluationResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setDashboardCandidateFilter(i)}
                        className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                          dashboardCandidateFilter === i
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{i + 1}. Aday: {r.targetCourseCode || 'Hedef'}</span>
                        <span className="font-mono text-xs opacity-90">%{r.llmSimilarityPercent?.toFixed(0)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Reports Rendered Row by Row */}
                {evaluationResults
                  .map((res, originalIndex) => ({ res, originalIndex }))
                  .filter(({ originalIndex }) => dashboardCandidateFilter === 'ALL' || dashboardCandidateFilter === originalIndex)
                  .map(({ res, originalIndex }) => {
                    const isAlreadyTarget =
                      Boolean(res.targetCourseCode && evaluatingCourse.targetCourseCode === res.targetCourseCode);

                    return (
                      <div
                        key={originalIndex}
                        className="rounded-3xl border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 p-5 sm:p-6 space-y-5 shadow-xs transition-colors"
                      >
                        {/* Row Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-black uppercase tracking-wider bg-indigo-600 text-white px-3 py-1 rounded-xl shadow-xs">
                              {evaluationResults.length > 1 ? `${originalIndex + 1}. Aday Eşleşme` : 'Hedef Ders Eşleşmesi'}
                            </span>
                            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {res.targetCourseCode || evaluatingCourse.targetCourseCode || '—'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                              {res.targetCourseName || evaluatingCourse.targetCourseCode}
                            </span>
                          </div>

                          {/* Quick Action: Assign as Target Course */}
                          <div className="flex items-center gap-2">
                            {res.targetCourseCode && !isAlreadyTarget ? (
                              <button
                                onClick={() => {
                                  const courseId = evaluatingCourse.id ?? 1;
                                  updateCourseMutation.mutate({
                                    trackingCode: activeTrackingCode,
                                    courseId,
                                    newCourseCode: res.targetCourseCode,
                                  });
                                  setEvaluatingCourse((prev) =>
                                    prev ? { ...prev, targetCourseCode: res.targetCourseCode! } : null
                                  );
                                  showFeedback(`Hedef ders ${res.targetCourseCode} olarak atandı.`);
                                }}
                                className="text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
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

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEvaluatingCourse(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-6 py-2.5 rounded-2xl text-sm sm:text-base transition-colors border border-slate-200 dark:border-slate-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Background Evaluation Widget */}
      {evaluatingCourse && isEvaluationMinimized && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {exemptionMutation.isPending ? (
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : evaluationResults ? (
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{evaluatingCourse.courseCode} Analizi</span>
                  {exemptionMutation.isPending && (
                    <span className="text-sm font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      Çalışıyor
                    </span>
                  )}
                  {evaluationResults && (
                    <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      Tamamlandı
                    </span>
                  )}
                  {evaluationError && (
                    <span className="text-sm font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                      Hata
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[220px]">
                  {exemptionMutation.isPending
                    ? 'Benzerlik analizi yapılıyor...'
                    : evaluationResults
                    ? 'Sonuçlar hazır.'
                    : 'Analiz tamamlanamadı.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEvaluationMinimized(false)}
                title="Pencereyi Genişlet"
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setEvaluatingCourse(null)}
                title="Kapat"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              Hedef: {evaluatingCourse.targetCourseCode}
            </span>
            <button
              type="button"
              onClick={() => setIsEvaluationMinimized(false)}
              className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <span>{evaluationResults ? 'Sonuçları Aç' : 'Detayları Gör'}</span>
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

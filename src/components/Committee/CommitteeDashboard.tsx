import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle,
  ChevronRight,
  X,
  RefreshCw,
  Minimize2,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exemptionApi } from '../../api/exemptionApi';
import type { 
  ApplicationStatus, 
  ExemptionResponseDto, 
  SelectedCourseResponse 
} from '../../types';

export const CommitteeDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackingCode, setSelectedTrackingCode] = useState<string | null>(null);

  // Exemption evaluation modal state
  const [evaluatingCourse, setEvaluatingCourse] = useState<SelectedCourseResponse | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<ExemptionResponseDto[] | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isEvaluationMinimized, setIsEvaluationMinimized] = useState<boolean>(false);

  // 1. Fetch applications list
  const {
    data: applications = [],
    isLoading: isAppsLoading,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: () =>
      exemptionApi.getApplications(
        statusFilter === 'ALL' ? undefined : statusFilter
      ),
  });

  // 2. Fetch single application details when opened
  const {
    data: activeApp,
    isLoading: isActiveAppLoading,
    refetch: refetchActiveApp,
  } = useQuery({
    queryKey: ['application-detail', selectedTrackingCode],
    queryFn: () =>
      selectedTrackingCode
        ? exemptionApi.getApplication(selectedTrackingCode)
        : Promise.reject('No tracking code'),
    enabled: !!selectedTrackingCode,
  });

  // 3. Exemption evaluation mutation
  const exemptionMutation = useMutation({
    mutationFn: ({ trackingCode, courseCode }: { trackingCode: string; courseCode: string }) =>
      exemptionApi.evaluateExemption(trackingCode, courseCode),
    onSuccess: (data) => {
      setEvaluationResults(data);
      setEvaluationError(null);
      queryClient.invalidateQueries({ queryKey: ['application-detail', selectedTrackingCode] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: Error) => {
      setEvaluationError(err.message || 'Muafiyet değerlendirmesi sırasında hata oluştu.');
      setEvaluationResults(null);
    },
  });

  const handleStartEvaluation = (course: SelectedCourseResponse) => {
    if (!selectedTrackingCode) return;
    setEvaluatingCourse(course);
    setIsEvaluationMinimized(false);
    setEvaluationResults(null);
    setEvaluationError(null);
    exemptionMutation.mutate({
      trackingCode: selectedTrackingCode,
      courseCode: course.courseCode,
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
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Muafiyet ve İntibak Komisyonu Yönetim Paneli
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gelen başvuruları inceleyin, transkript ve ders içeriklerini görüntüleyin, LLM destekli muafiyet eşleştirmelerini çalıştırın.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            refetchApps();
            if (selectedTrackingCode) refetchActiveApp();
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors self-start md:self-auto shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Verileri Yenile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Applications List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 space-y-3 transition-colors">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tümü ({applications.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bekleyenler
              </button>
              <button
                onClick={() => setStatusFilter('CONCLUDED')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'CONCLUDED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sonuçlananlar
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğrenci veya takip kodu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2.5">
            {isAppsLoading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Başvurular yükleniyor...</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                Kayıtlı başvuru bulunamadı.
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = selectedTrackingCode === app.trackingCode;
                return (
                  <div
                    key={app.trackingCode}
                    onClick={() => setSelectedTrackingCode(app.trackingCode)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/70 border-brand-500 dark:border-brand-400 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {app.firstName} {app.lastName}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              app.applicationStatus === 'CONCLUDED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {app.applicationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[240px]">
                          {app.university}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-brand-600 dark:text-brand-400 translate-x-1' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                        {app.trackingCode}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {app.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Application Details (7 cols on lg) */}
        <div className="lg:col-span-7">
          {!selectedTrackingCode ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center h-full min-h-[350px] flex flex-col items-center justify-center transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
                Başvuru Detayını Görüntülemek İçin Seçim Yapın
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-relaxed">
                Sol taraftaki listeden bir başvuruya tıklayarak öğrenci bilgilerini, transkripti ve ders bazlı muafiyet değerlendirme aracını kullanabilirsiniz.
              </p>
            </div>
          ) : isActiveAppLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Başvuru detayları yükleniyor...</p>
            </div>
          ) : activeApp ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Application Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-lg">
                        {activeApp.trackingCode}
                      </span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          activeApp.applicationStatus === 'CONCLUDED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {activeApp.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'Değerlendirme Bekliyor'}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                      {activeApp.student.firstName} {activeApp.student.lastName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeApp.student.university} • {activeApp.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş'}
                    </p>
                  </div>

                  <a
                    href={exemptionApi.getTranscriptPdfUrl(activeApp.trackingCode)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors self-start shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Transkript (PDF)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  </a>
                </div>

                {/* Courses List */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Muafiyet Talep Edilen Dersler ({activeApp.selectedCourses.length})
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      AI eşleştirme için &quot;Muafiyet Değerlendir&quot; butonunu kullanın
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeApp.selectedCourses.map((c) => (
                      <div
                        key={c.courseCode}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded">
                                {c.courseCode}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {c.courseName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span>AKTS: <strong className="text-slate-800 dark:text-slate-200">{c.ects}</strong></span>
                              {c.grade && <span>• Not: <strong className="text-slate-800 dark:text-slate-200">{c.grade}</strong></span>}
                              <span>• Tür: <strong className="text-slate-800 dark:text-slate-200">{c.courseType}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={exemptionApi.getCourseContentPdfUrl(
                                activeApp.trackingCode,
                                c.courseCode
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span>Syllabus PDF</span>
                            </a>

                            <button
                              onClick={() => handleStartEvaluation(c)}
                              className="text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI ile Değerlendir</span>
                            </button>
                          </div>
                        </div>

                        {/* Target match banner */}
                        <div className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500">Hedef Erciyes Dersi:</span>
                            <span className="font-semibold text-brand-800 dark:text-brand-300">
                              {c.targetCourseCode || 'Eşleştirilmemiş'}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                c.exemptionStatus === 'PASSED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : c.exemptionStatus === 'FAILED'
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {c.exemptionStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI Exemption Evaluation Modal (When not minimized) */}
      {evaluatingCourse && !isEvaluationMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                    LLM Destekli Muafiyet Analizi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {evaluatingCourse.courseCode} - {evaluatingCourse.courseName} &rarr; {evaluatingCourse.targetCourseCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEvaluationMinimized(true)}
                  title="Simge Durumuna Küçült (Arka Planda Çalıştır)"
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Arka Planda Çalıştır</span>
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
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {exemptionMutation.isPending && (
              <div className="py-12 text-center space-y-3">
                <div className="w-9 h-9 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  LLM ve Semantik Vektör Analizi Çalıştırılıyor...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Ders içerikleri ayrıştırılıyor, haftalık kazanımlar ve Erciyes müfredatı ile anlamsal benzerliği hesaplanıyor.
                </p>
              </div>
            )}

            {/* Error State */}
            {evaluationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Değerlendirme Başarısız</p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{evaluationError}</p>
                </div>
              </div>
            )}

            {/* Results State */}
            {evaluationResults && evaluationResults.length > 0 && (
              <div className="space-y-4">
                {evaluationResults.map((res, idx) => (
                  <div key={idx} className="space-y-4">
                    {/* Similarity Metrics Gauges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {res.llmSimilarityPercent !== undefined && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/70 dark:to-indigo-950/50 border border-brand-100 dark:border-brand-800">
                          <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                            LLM İçerik Benzerliği
                          </p>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-3xl font-extrabold text-brand-900 dark:text-brand-200">
                              %{res.llmSimilarityPercent?.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              (Semantik Eşleşme)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, res.llmSimilarityPercent || 0)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {res.vectorSimilarityPercent !== undefined && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/70 dark:to-teal-950/50 border border-emerald-100 dark:border-emerald-800">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Vektör Cosine Benzerliği
                          </p>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
                              %{res.vectorSimilarityPercent?.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              (Embedding Uzayı)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, res.vectorSimilarityPercent || 0)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comparison Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-semibold uppercase">Kaynak AKTS</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{res.sourceAkts ?? '—'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-semibold uppercase">Hedef AKTS</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{res.targetAkts ?? '—'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-semibold uppercase">Alınan Not</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5 block">{res.sourceGrade ?? '—'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-semibold uppercase">Akademik Yıl</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{res.academicYear ?? '—'}</span>
                      </div>
                    </div>

                    {/* Missing Topics Callout */}
                    {res.missingTopics && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-1">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Eksik / Kapsanmayan Konular (Missing Topics)</span>
                        </div>
                        <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed pl-6">
                          {res.missingTopics}
                        </p>
                      </div>
                    )}

                    {/* Full LLM Report */}
                    {res.llmReport && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          Yapay Zeka Değerlendirme Raporu
                        </h4>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line font-mono">
                          {res.llmReport}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEvaluatingCourse(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-5 py-2 rounded-xl text-xs sm:text-sm transition-colors border border-slate-200 dark:border-slate-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Background Evaluation Widget */}
      {evaluatingCourse && isEvaluationMinimized && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {exemptionMutation.isPending ? (
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : evaluationResults ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{evaluatingCourse.courseCode} Muafiyet Analizi</span>
                  {exemptionMutation.isPending && (
                    <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded">
                      Çalışıyor
                    </span>
                  )}
                  {evaluationResults && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      Tamamlandı
                    </span>
                  )}
                  {evaluationError && (
                    <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                      Hata
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                  {exemptionMutation.isPending
                    ? 'Arka planda LLM analizi devam ediyor...'
                    : evaluationResults
                    ? 'Sonuçlar hazır, incelemek için tıklayın.'
                    : 'Analiz sırasında hata oluştu.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEvaluationMinimized(false)}
                title="Pencereyi Genişlet"
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEvaluatingCourse(null)}
                title="Kapat"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Hedef: {evaluatingCourse.targetCourseCode}
            </span>
            <button
              type="button"
              onClick={() => setIsEvaluationMinimized(false)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>{evaluationResults ? 'Sonuçları Aç' : 'Detayları Gör'}</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

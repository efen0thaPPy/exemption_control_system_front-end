import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  GraduationCap, 
  ArrowRightLeft
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { exemptionApi } from '../../api/exemptionApi';
import type { ExemptionStatus } from '../../types';

interface TrackApplicationViewProps {
  initialTrackingCode?: string;
}

export const TrackApplicationView: React.FC<TrackApplicationViewProps> = ({
  initialTrackingCode = '',
}) => {
  const [searchInput, setSearchInput] = useState(initialTrackingCode);
  const [submittedCode, setSubmittedCode] = useState(initialTrackingCode);

  useEffect(() => {
    if (initialTrackingCode) {
      setSearchInput(initialTrackingCode);
      setSubmittedCode(initialTrackingCode);
    }
  }, [initialTrackingCode]);

  const {
    data: application,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['application', submittedCode],
    queryFn: () => exemptionApi.getApplication(submittedCode),
    enabled: !!submittedCode.trim(),
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSubmittedCode(searchInput.trim());
    }
  };

  const getStatusBadge = (status: ExemptionStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Muaf (Kabul)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Reddedildi
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            İnceleniyor
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header and Search Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Başvuru Durumu ve Sonuç Sorgulama
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
          Başvuru sırasında size verilen takip kodunu (örn. APP-XXXXXXXX) girerek güncel intibak durumunuzu öğrenebilirsiniz.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Takip Kodu Giriniz (Örn: APP-A1B2C3D4)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!searchInput.trim() || isLoading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2 rounded-xl text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Sorgula</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Başvuru Bulunamadı</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              {(error as Error)?.message || 'Girilen takip koduna ait kayıt bulunamadı. Lütfen kodu kontrol ediniz.'}
            </p>
          </div>
        </div>
      )}

      {/* Application Details Result */}
      {application && (
        <div className="space-y-4">
          {/* Top Banner Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded-lg">
                  {application.trackingCode}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    application.applicationStatus === 'CONCLUDED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {application.applicationStatus === 'CONCLUDED'
                    ? 'Sonuçlandı (Tamamlandı)'
                    : 'Komisyon İncelemesinde (Beklemede)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                {application.student.firstName} {application.student.lastName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {application.student.university}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={exemptionApi.getTranscriptPdfUrl(application.trackingCode)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Transkript PDF</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Transfer Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm transition-colors">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                {application.transferType === 'LATERAL_TRANSFER' ? (
                  <ArrowRightLeft className="w-5 h-5" />
                ) : (
                  <GraduationCap className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Geçiş Türü</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {application.transferType === 'LATERAL_TRANSFER'
                    ? 'Yatay Geçiş'
                    : 'Dikey Geçiş (DGS)'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm transition-colors">
              <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Başvurulan Ders Sayısı</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {application.selectedCourses.length} Ders
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm transition-colors">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Kabul Edilen Dersler</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {application.selectedCourses.filter((c) => c.exemptionStatus === 'PASSED').length} / {application.selectedCourses.length}
                </p>
              </div>
            </div>
          </div>

          {/* Courses Exemption Status Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Ders Bazlı Muafiyet Kararları
              </h3>
              <button
                onClick={() => refetch()}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold"
              >
                Yenile
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Başvurulan Ders (Kaynak)</th>
                    <th className="px-4 py-3">Not & AKTS</th>
                    <th className="px-4 py-3">Hedef Erciyes Dersi</th>
                    <th className="px-4 py-3">Ders İçeriği</th>
                    <th className="px-4 py-3 text-right">Muafiyet Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {application.selectedCourses.map((c) => (
                    <tr key={c.courseCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {c.courseName}
                        </div>
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded mt-0.5 inline-block">
                          {c.courseCode}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.ects} AKTS
                        </div>
                        {c.grade && (
                          <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                            Not: {c.grade}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-300">
                        {c.targetCourseCode || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <a
                          href={exemptionApi.getCourseContentPdfUrl(
                            application.trackingCode,
                            c.courseCode
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF Görüntüle</span>
                        </a>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {getStatusBadge(c.exemptionStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


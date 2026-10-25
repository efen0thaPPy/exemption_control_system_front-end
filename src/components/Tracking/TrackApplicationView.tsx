import React, { useState } from 'react';
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
import { useParams, useNavigate } from 'react-router-dom';
import { exemptionApi } from '../../api/exemptionApi';
import type { ExemptionStatus } from '../../types';

interface TrackApplicationViewProps {
  initialTrackingCode?: string;
}

export const TrackApplicationView: React.FC<TrackApplicationViewProps> = ({
  initialTrackingCode = '',
}) => {
  const { trackingCode: paramCode } = useParams<{ trackingCode?: string }>();
  const navigate = useNavigate();

  const activeTrackingCode = paramCode || initialTrackingCode || '';
  const [searchInput, setSearchInput] = useState(activeTrackingCode);

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['application', activeTrackingCode],
    queryFn: () => exemptionApi.getApplication(activeTrackingCode),
    enabled: !!activeTrackingCode.trim(),
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/sorgula/${searchInput.trim()}`);
    }
  };

  const getStatusBadge = (status: ExemptionStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Muaf (Kabul)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Reddedildi
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            İnceleniyor
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 3xl:space-y-8 w-full">
      {/* Header and Search Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl p-6 sm:p-7 3xl:p-9 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-xl sm:text-2xl 3xl:text-3xl font-bold text-slate-900 dark:text-white">
          Başvuru Durumu ve Sonuç Sorgulama
        </h2>
        <p className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1 mb-5 leading-relaxed">
          Başvurunuz sırasında size iletilen takip kodunu (örn. APP-XXXXXXXX) girerek intibak inceleme durumunuzu ve ders sonuçlarınızı anlık olarak görüntüleyebilirsiniz.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 3xl:gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5 3xl:top-4" />
            <input
              type="text"
              placeholder="Takip Kodu Giriniz (Örn: APP-A1B2C3D4)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 3xl:pl-14 pr-4 py-3 3xl:py-4 border border-slate-300 dark:border-slate-700 rounded-xl 3xl:rounded-2xl text-base 3xl:text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={!searchInput.trim() || isLoading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-7 py-3 3xl:px-8 3xl:py-4 rounded-xl 3xl:rounded-2xl text-base 3xl:text-lg transition-colors shadow-sm flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 3xl:w-6 3xl:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5 3xl:w-6 3xl:h-6" />
            )}
            <span>Sorgula</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-6 3xl:p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-base sm:text-lg 3xl:text-xl flex items-start gap-4">
          <AlertCircle className="w-7 h-7 3xl:w-8 3xl:h-8 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-lg sm:text-xl 3xl:text-2xl">Başvuru Bulunamadı</p>
            <p className="text-base 3xl:text-lg text-rose-700 dark:text-rose-300 mt-1">
              {(error as Error)?.message || 'Girilen takip koduna ait başvuru kaydı bulunamadı. Lütfen takip kodunuzu kontrol ediniz.'}
            </p>
          </div>
        </div>
      )}

      {/* When no application is loaded yet: Rich full-width guidance to eliminate blank space */}
      {!application && !isError && (
        <div className="space-y-6 3xl:space-y-8 w-full animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-xl sm:text-2xl 3xl:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              İntibak Değerlendirme Süreci
            </h3>
            <p className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mb-6">
              Başvurunuz komisyon tarafından aşağıdaki aşamalardan geçirilerek sonuçlandırılır:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 3xl:gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 3xl:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 3xl:space-y-4">
                <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-extrabold text-xl 3xl:text-2xl flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                  Başvuru & Transkript
                </h4>
                <p className="text-sm 3xl:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  Öğrencinin resmi onaylı transkripti sisteme yüklenir ve alınan dersler ile notlar doğrulanır.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 3xl:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 3xl:space-y-4">
                <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xl 3xl:text-2xl flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                  Eşleştirme & AKTS Kontrolü
                </h4>
                <p className="text-sm 3xl:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  Önceki üniversitedeki dersler ile Erciyes BM müfredatı eşleştirilerek kredi ve saat uygunluğu denetlenir.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 3xl:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 3xl:space-y-4">
                <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-xl 3xl:text-2xl flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                  İçerik & Benzerlik Analizi
                </h4>
                <p className="text-sm 3xl:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  Onaylı ders içerikleri analiz edilir; konu kapsamı, eksik kazanımlar ve benzerlik oranları raporlanır.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 3xl:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 3xl:space-y-4">
                <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold text-xl 3xl:text-2xl flex items-center justify-center">
                  4
                </div>
                <h4 className="font-bold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                  Nihai Komisyon Kararı
                </h4>
                <p className="text-sm 3xl:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bölüm intibak komisyonu ders bazında muafiyet (kabul) veya ret kararını onaylayarak kesinleştirir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 3xl:gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 3xl:space-y-4">
              <h4 className="font-extrabold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                Muafiyet Kriterleri
              </h4>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                <li>Bir dersten muaf sayılabilmek için ders içeriğinin en az %70 oranında örtüşmesi gerekir.</li>
                <li>Dersin AKTS veya yerel kredi değerinin Erciyes dersinden düşük olmaması esastır.</li>
                <li>Öğrencinin transkriptinde dersin başarı harf notu ile tamamlanmış olması şarttır.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 3xl:space-y-4">
              <h4 className="font-extrabold text-lg 3xl:text-xl text-slate-900 dark:text-white">
                Takip Kodu Hakkında
              </h4>
              <p className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                Başvurunuzu başarıyla tamamladığınızda ekranda gösterilen benzersiz <strong className="text-slate-900 dark:text-white">APP-XXXXXXXX</strong> formatındaki kod sizin takip kodunuzdur. Bu kod ile dilediğiniz zaman sisteme giriş yaparak derslerinizin durumunu kontrol edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Result */}
      {application && (
        <div className="space-y-6 3xl:space-y-8">
          {/* Top Banner Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 3xl:p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-base 3xl:text-lg font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-4 py-1.5 3xl:px-5 3xl:py-2 rounded-xl">
                  {application.trackingCode}
                </span>
                <span
                  className={`text-sm sm:text-base 3xl:text-lg px-4 py-1.5 3xl:px-5 3xl:py-2 rounded-full font-bold uppercase ${
                    application.applicationStatus === 'CONCLUDED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {application.applicationStatus === 'CONCLUDED'
                    ? 'Sonuçlandı (Tamamlandı)'
                    : 'Komisyon İncelemesinde'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl 3xl:text-3xl font-extrabold text-slate-900 dark:text-white mt-2.5">
                {application.student.firstName} {application.student.lastName}
              </h3>
              <p className="text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1">
                {application.student.university}
                {application.academicYear && ` • Akademik Yıl: ${application.academicYear}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={exemptionApi.getTranscriptPdfUrl(application.trackingCode)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-base 3xl:text-lg font-bold px-6 py-3.5 3xl:px-7 3xl:py-4 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <FileText className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-600 dark:text-slate-400" />
                <span>Transkript PDF</span>
                <ExternalLink className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Transfer Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 3xl:gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm transition-colors">
              <div className="p-3.5 3xl:p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400">
                {application.transferType === 'LATERAL_TRANSFER' ? (
                  <ArrowRightLeft className="w-7 h-7 3xl:w-8 3xl:h-8" />
                ) : (
                  <GraduationCap className="w-7 h-7 3xl:w-8 3xl:h-8" />
                )}
              </div>
              <div>
                <p className="text-sm 3xl:text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Geçiş Türü</p>
                <p className="text-base sm:text-lg 3xl:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {application.transferType === 'LATERAL_TRANSFER'
                    ? 'Yatay Geçiş'
                    : 'Dikey Geçiş (DGS)'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm transition-colors">
              <div className="p-3.5 3xl:p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400">
                <FileText className="w-7 h-7 3xl:w-8 3xl:h-8" />
              </div>
              <div>
                <p className="text-sm 3xl:text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Toplam Ders Sayısı</p>
                <p className="text-base sm:text-lg 3xl:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {application.selectedCourses.length} Ders
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm transition-colors">
              <div className="p-3.5 3xl:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7 3xl:w-8 3xl:h-8" />
              </div>
              <div>
                <p className="text-sm 3xl:text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kabul Edilen Dersler</p>
                <p className="text-base sm:text-lg 3xl:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {application.selectedCourses.filter((c) => c.exemptionStatus === 'PASSED').length} / {application.selectedCourses.length}
                </p>
              </div>
            </div>
          </div>

          {/* Courses Detailed List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 3xl:p-8 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg 3xl:text-xl">
                Ders Değerlendirme Sonuçları
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {application.selectedCourses.map((c, idx) => (
                <div key={c.courseCode} className="p-6 3xl:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1.5 3xl:space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm 3xl:text-base font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 3xl:px-3.5 3xl:py-1.5 rounded-xl">
                        {c.courseCode}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg 3xl:text-xl">
                        {c.courseName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-sm 3xl:text-base text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>AKTS: <strong className="text-slate-900 dark:text-white font-bold">{c.ects}</strong></span>
                      {c.grade && (
                        <>
                          <span>•</span>
                          <span>Not: <strong className="text-slate-900 dark:text-white font-bold">{c.grade}</strong></span>
                        </>
                      )}
                      <span>•</span>
                      <span>Tür: <strong className="text-slate-900 dark:text-white font-semibold">{c.courseType}</strong></span>
                    </div>

                    <div className="pt-1.5 flex items-center gap-2 text-sm 3xl:text-base text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Eşleştirilen Erciyes Dersi:</span>
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 3xl:px-3 3xl:py-1 rounded-lg">
                        {c.targetCourseCode || 'Henüz Eşleştirilmedi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-start md:self-center">
                    <a
                      href={exemptionApi.getCourseContentPdfUrl(application.trackingCode, c.id ?? (idx + 1))}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm 3xl:text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-xl flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <FileText className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-500" />
                      <span>İçerik Belgesi</span>
                    </a>

                    <div>{getStatusBadge(c.exemptionStatus)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

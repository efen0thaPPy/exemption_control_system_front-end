import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  FileText,
  Building2,
  Filter
} from 'lucide-react';
import { exemptionApi } from '../../api/exemptionApi';
import type { ApplicationStatus } from '../../types';

export const CommitteeApplicationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [transferFilter, setTransferFilter] = useState<'ALL' | 'LATERAL_TRANSFER' | 'VERTICAL_TRANSFER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: applications = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: () =>
      exemptionApi.getApplications(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTransfer =
      transferFilter === 'ALL' || app.transferType === transferFilter;

    return matchesSearch && matchesTransfer;
  });

  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.applicationStatus === 'PENDING').length;
  const concludedCount = applications.filter((a) => a.applicationStatus === 'CONCLUDED').length;

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              İntibak Başvuruları
            </h1>
            <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredApps.length} Başvuru
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Öğrenci intibak başvurularını incelemek ve kararları yönetmek için başvuruyu seçiniz.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start md:self-auto flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 3xl:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm 3xl:text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toplam Başvuru
            </span>
            <FileText className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400" />
          </div>
          <p className="text-3xl 3xl:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm 3xl:text-base font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              İnceleme Bekleyen
            </span>
            <Clock className="w-5 h-5 3xl:w-6 3xl:h-6 text-amber-500" />
          </div>
          <p className="text-3xl 3xl:text-4xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 3xl:p-8 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm 3xl:text-base font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sonuçlanan Başvurular
            </span>
            <CheckCircle2 className="w-5 h-5 3xl:w-6 3xl:h-6 text-emerald-500" />
          </div>
          <p className="text-3xl 3xl:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {concludedCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl p-5 3xl:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 3xl:gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400 absolute left-3.5 top-3.5 3xl:top-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim, takip kodu (APP-...) veya üniversite ile arayın..."
              className="w-full pl-11 3xl:pl-12 pr-4 py-2.5 3xl:py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl 3xl:rounded-2xl text-sm sm:text-base 3xl:text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 3xl:p-1.5 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-lg text-sm 3xl:text-base font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-lg text-sm 3xl:text-base font-bold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bekleyen
            </button>
            <button
              onClick={() => setStatusFilter('CONCLUDED')}
              className={`px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-lg text-sm 3xl:text-base font-bold transition-all ${
                statusFilter === 'CONCLUDED'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sonuçlanan
            </button>
          </div>

          {/* Transfer Type filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-400" />
            <select
              value={transferFilter}
              onChange={(e) => setTransferFilter(e.target.value as 'ALL' | 'LATERAL_TRANSFER' | 'VERTICAL_TRANSFER')}
              className="px-4 py-2.5 3xl:px-5 3xl:py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm 3xl:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tüm Geçiş Türleri</option>
              <option value="LATERAL_TRANSFER">Yatay Geçiş</option>
              <option value="VERTICAL_TRANSFER">Dikey Geçiş (DGS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table - Full Width */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-base 3xl:text-lg">
            Başvurular yükleniyor...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-base 3xl:text-lg">
            Arama kriterlerine uygun başvuru kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base 3xl:text-lg">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 text-sm 3xl:text-base uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Takip Kodu</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Öğrenci Adı Soyadı</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Önceki Üniversite</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Geçiş Türü</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Durum</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredApps.map((app) => (
                  <tr
                    key={app.trackingCode}
                    onClick={() => navigate(`/komisyon/${app.trackingCode}`)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 whitespace-nowrap">
                      <span className="font-mono text-base 3xl:text-lg font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        {app.trackingCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 font-bold text-slate-900 dark:text-white text-base sm:text-lg 3xl:text-xl">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 text-slate-600 dark:text-slate-300 text-base 3xl:text-lg">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 3xl:w-6 3xl:h-6 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-sm">{app.university}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 text-slate-600 dark:text-slate-300">
                      <span className="text-base 3xl:text-lg font-medium px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {app.transferType === 'LATERAL_TRANSFER' ? 'Yatay Geçiş' : 'Dikey Geçiş (DGS)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 whitespace-nowrap">
                      <span
                        className={`text-base 3xl:text-lg px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-full font-bold ${
                          app.applicationStatus === 'CONCLUDED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {app.applicationStatus === 'CONCLUDED' ? 'Sonuçlandı' : 'Beklemede'}
                      </span>
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/komisyon/${app.trackingCode}`);
                        }}
                        className="inline-flex items-center gap-2 text-base 3xl:text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 3xl:px-6 3xl:py-3 rounded-xl transition-colors shadow-sm"
                      >
                        <span>Başvuruyu İncele</span>
                        <ArrowRight className="w-5 h-5 3xl:w-6 3xl:h-6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  ArrowRightLeft,
  Database,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exemptionApi } from '../../api/exemptionApi';
import type { CourseType, TransferType } from '../../types';

export const CourseCatalogView: React.FC = () => {
  const queryClient = useQueryClient();
  const [transferType, setTransferType] = useState<TransferType>('LATERAL_TRANSFER');
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  const {
    data: courses = [],
    isLoading,
  } = useQuery({
    queryKey: ['erciyes-courses', transferType],
    queryFn: () => exemptionApi.getErciyesCourses(transferType),
  });

  const seedMutation = useMutation({
    mutationFn: () => exemptionApi.seedCourses(''),
    onSuccess: () => {
      setSeedSuccessMsg('Erciyes ders kataloğu başarıyla güncellendi/tohumlandı!');
      queryClient.invalidateQueries({ queryKey: ['erciyes-courses'] });
      setTimeout(() => setSeedSuccessMsg(null), 3000);
    },
  });

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester =
      semesterFilter === 'ALL' || c.semester.toString() === semesterFilter;
    const matchesType = typeFilter === 'ALL' || c.courseType === typeFilter;
    return matchesSearch && matchesSemester && matchesType;
  });

  const getCourseTypeBadge = (type: CourseType) => {
    switch (type) {
      case 'COMMON_MANDATORY':
        return (
          <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-lg">
            Ortak Zorunlu
          </span>
        );
      case 'MANDATORY':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-lg">
            Zorunlu
          </span>
        );
      case 'ELECTIVE':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-lg">
            Seçmeli
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/25 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Erciyes Üniversitesi Bilgisayar Mühendisliği Ders Kataloğu
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              İntibak ve muafiyette eşleştirmeye açık tüm müfredat derslerini inceleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 shadow-sm"
            title="Dersleri Veritabanına Yeniden Tohumla"
          >
            <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{seedMutation.isPending ? 'Tohumlanıyor...' : 'Dersleri Tohumla (Seed)'}</span>
          </button>
        </div>
      </div>

      {seedSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Transfer Type Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTransferType('LATERAL_TRANSFER')}
              className={`flex-1 md:flex-initial flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                transferType === 'LATERAL_TRANSFER'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Yatay Geçiş (1-8. Yarıyıl)</span>
            </button>
            <button
              onClick={() => setTransferType('VERTICAL_TRANSFER')}
              className={`flex-1 md:flex-initial flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                transferType === 'VERTICAL_TRANSFER'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Dikey Geçiş (1-4. Yarıyıl)</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Ders kodu veya adına göre ara (Örn: BM 101, ALGORİTMA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Tüm Yarıyıllar</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s.toString()}>
                {s}. Yarıyıl
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Tüm Ders Türleri</option>
            <option value="COMMON_MANDATORY">Ortak Zorunlu</option>
            <option value="MANDATORY">Zorunlu</option>
            <option value="ELECTIVE">Seçmeli</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Toplam <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredCourses.length}</strong> ders listeleniyor</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ders kataloğu yükleniyor...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm font-medium">
            Kriterlere uygun ders bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-[11px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Ders Kodu</th>
                  <th className="px-4 py-2.5">Ders Adı</th>
                  <th className="px-4 py-2.5">Yarıyıl</th>
                  <th className="px-4 py-2.5">Tür</th>
                  <th className="px-4 py-2.5">Teori / Uygulama</th>
                  <th className="px-4 py-2.5 text-right">AKTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.map((c) => (
                  <tr key={c.courseCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {c.courseCode}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {c.courseName}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {c.semester}. Yarıyıl
                    </td>
                    <td className="px-4 py-2.5">
                      {getCourseTypeBadge(c.courseType)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {c.theoryHours}T + {c.practiceHours}U
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-brand-700 dark:text-brand-300 text-xs sm:text-sm">
                      {c.ects}
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

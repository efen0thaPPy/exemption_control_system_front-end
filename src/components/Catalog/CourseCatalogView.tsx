import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
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

  const { data: academicYear } = useQuery({
    queryKey: ['academic-year-active'],
    queryFn: () => exemptionApi.getMaxAcademicYear(),
  });

  const seedMutation = useMutation({
    mutationFn: () => exemptionApi.seedCourses(''),
    onSuccess: () => {
      setSeedSuccessMsg('Erciyes ders kataloğu başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['erciyes-courses'] });
      setTimeout(() => setSeedSuccessMsg(null), 3000);
    },
  });

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester =
      semesterFilter === 'ALL' || 
      (c.semesterName ? c.semesterName.toLowerCase().includes(semesterFilter.toLowerCase()) : true);
    const matchesType = typeFilter === 'ALL' || c.courseType === typeFilter;
    return matchesSearch && matchesSemester && matchesType;
  });

  const getCourseTypeBadge = (type: CourseType) => {
    switch (type) {
      case 'COMMON_MANDATORY':
        return (
          <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-sm sm:text-base font-bold px-3.5 py-1.5 rounded-xl">
            Ortak Zorunlu
          </span>
        );
      case 'MANDATORY':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm sm:text-base font-bold px-3.5 py-1.5 rounded-xl">
            Zorunlu
          </span>
        );
      case 'ELECTIVE':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-sm sm:text-base font-bold px-3.5 py-1.5 rounded-xl">
            Seçmeli
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl p-6 3xl:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5 3xl:gap-4">
          <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl 3xl:rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 3xl:w-7 3xl:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl 3xl:text-3xl font-bold text-slate-900 dark:text-white">
                Erciyes Üniversitesi Bilgisayar Mühendisliği Ders Kataloğu
              </h1>
              {academicYear && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm sm:text-base 3xl:text-lg font-mono font-semibold px-3 py-1 3xl:px-3.5 3xl:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {academicYear}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1">
              Bölüm müfredatında yer alan dersleri, kredilerini ve teorik/uygulama saatlerini inceleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {seedSuccessMsg && (
            <span className="text-sm 3xl:text-base font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 3xl:w-5 3xl:h-5 text-emerald-600" />
              <span>{seedSuccessMsg}</span>
            </span>
          )}

          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 text-sm 3xl:text-base font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 3xl:px-5 3xl:py-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Ders kataloğunu sıfırla / veritabanına tohumla"
          >
            <Database className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-500" />
            <span>Kataloğu Güncelle (Seed)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl p-5 sm:p-6 3xl:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Transfer Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 3xl:p-1.5 rounded-xl self-start">
            <button
              onClick={() => setTransferType('LATERAL_TRANSFER')}
              className={`flex items-center gap-2 px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-lg text-sm 3xl:text-base font-semibold transition-all ${
                transferType === 'LATERAL_TRANSFER'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 3xl:w-5 3xl:h-5" />
              <span>Yatay Geçiş Kataloğu</span>
            </button>
            <button
              onClick={() => setTransferType('VERTICAL_TRANSFER')}
              className={`flex items-center gap-2 px-4 py-2 3xl:px-5 3xl:py-2.5 rounded-lg text-sm 3xl:text-base font-semibold transition-all ${
                transferType === 'VERTICAL_TRANSFER'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 3xl:w-5 3xl:h-5" />
              <span>Dikey Geçiş (DGS) Kataloğu</span>
            </button>
          </div>

          <span className="text-sm 3xl:text-base font-semibold text-slate-500 dark:text-slate-400">
            {filteredCourses.length} Ders Listeleniyor
          </span>
        </div>

        {/* Search, Semester and Type filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 3xl:gap-4">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 3xl:w-5 3xl:h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 3xl:top-4" />
            <input
              type="text"
              placeholder="Ders adı veya kodu ile arayın (Örn: BM 101, Veri Yapıları)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 3xl:pl-12 pr-4 py-2.5 3xl:py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm sm:text-base 3xl:text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 3xl:py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm sm:text-base 3xl:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tüm Yarıyıllar</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s.toString()}>
                  {s}. Yarıyıl
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 3xl:py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm sm:text-base 3xl:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tüm Ders Türleri</option>
              <option value="MANDATORY">Zorunlu</option>
              <option value="COMMON_MANDATORY">Ortak Zorunlu</option>
              <option value="ELECTIVE">Seçmeli</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl 3xl:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-sm sm:text-base 3xl:text-lg">
            Ders kataloğu yükleniyor...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-sm sm:text-base 3xl:text-lg">
            Arama kriterlerinize uygun ders bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base 3xl:text-lg">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-sm sm:text-base 3xl:text-lg uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Ders Kodu</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Ders Adı</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Yarıyıl</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">AKTS</th>
                  <th className="px-6 py-4 3xl:px-8 3xl:py-5">Ders Türü</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCourses.map((c) => (
                  <tr
                    key={c.courseCode}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 whitespace-nowrap">
                      <span className="font-mono text-base 3xl:text-lg font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 3xl:px-4 3xl:py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        {c.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 font-bold text-slate-900 dark:text-white text-base sm:text-lg 3xl:text-xl">
                      {c.courseName}
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 text-slate-600 dark:text-slate-300 font-medium">
                      {c.semesterName || '-'}
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5 font-bold text-slate-900 dark:text-white text-base 3xl:text-lg">
                      {c.ects} AKTS
                    </td>
                    <td className="px-6 py-4 3xl:px-8 3xl:py-5">{getCourseTypeBadge(c.courseType)}</td>
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

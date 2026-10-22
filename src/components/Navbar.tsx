import React from 'react';
import { 
  GraduationCap, 
  FileCheck2, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  LogOut, 
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';

export type ActiveTab = 'student' | 'tracking' | 'committee' | 'courses';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCommitteeLoggedIn: boolean;
  setIsCommitteeLoggedIn: (val: boolean) => void;
  onOpenLoginModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isCommitteeLoggedIn,
  setIsCommitteeLoggedIn,
  onOpenLoginModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div 
            onClick={() => setActiveTab('student')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform p-2">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight leading-tight">
                  İntibak & Muafiyet
                </span>
                <span className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-bold border border-brand-200 dark:border-brand-800">
                  LLM Destekli
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Erciyes Üniversitesi Bilgisayar Mühendisliği
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Öğrenci Başvurusu</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'tracking'
                  ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Başvuru Sorgula</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ders Kataloğu</span>
            </button>

            <button
              onClick={() => {
                if (isCommitteeLoggedIn) {
                  setActiveTab('committee');
                } else {
                  onOpenLoginModal();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'committee'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Komisyon Paneli</span>
              {isCommitteeLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </nav>

          {/* Right actions: Dark Mode toggle & Committee Member Auth Status */}
          <div className="flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Açık Moda Geç' : 'Karanlık Moda Geç'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-amber-300 border border-slate-300 dark:border-slate-700 transition-all font-semibold text-xs sm:text-sm shadow-sm"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
                  <span className="text-slate-200">Açık Mod</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-300" />
                  <span className="text-slate-700">Karanlık Mod</span>
                </>
              )}
            </button>

            {isCommitteeLoggedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Komisyon Üyesi</span>
                </div>
                <button
                  onClick={() => {
                    setIsCommitteeLoggedIn(false);
                    if (activeTab === 'committee') setActiveTab('student');
                  }}
                  title="Çıkış Yap"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-3.5 py-1.5 rounded-xl transition-colors border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Komisyon Girişi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

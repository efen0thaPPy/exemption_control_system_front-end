import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

interface NavbarProps {
  isCommitteeLoggedIn: boolean;
  setIsCommitteeLoggedIn: (val: boolean) => void;
  onOpenLoginModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isCommitteeLoggedIn,
  setIsCommitteeLoggedIn,
  onOpenLoginModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/basvuru';
    return location.pathname.startsWith(path);
  };

  const navLinkClasses = (active: boolean) =>
    `flex items-center gap-2.5 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl text-base lg:text-lg 2xl:text-xl font-bold transition-all ${
      active
        ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="w-full px-4 sm:px-8 lg:px-10 2xl:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo & System Title */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3.5 lg:gap-4 cursor-pointer group"
          >
            <div className="w-13 h-13 lg:w-15 lg:h-15 2xl:w-16 2xl:h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-700 transition-colors p-2.5">
              <GraduationCap className="w-8 h-8 lg:w-9 lg:h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-xl lg:text-2xl 2xl:text-3xl tracking-tight leading-tight">
                  İntibak & Muafiyet
                </span>
              </div>
              <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium">
                Erciyes Üniversitesi Bilgisayar Mühendisliği
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2.5">
            <NavLink
              to="/"
              className={() => navLinkClasses(isCurrent('/'))}
            >
              <FileCheck2 className="w-5 h-5 lg:w-6 lg:h-6 text-brand-600 dark:text-brand-400" />
              <span>Öğrenci Başvurusu</span>
            </NavLink>

            <NavLink
              to="/sorgula"
              className={() => navLinkClasses(isCurrent('/sorgula'))}
            >
              <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-500 dark:text-slate-400" />
              <span>Başvuru Sorgula</span>
            </NavLink>

            <NavLink
              to="/katalog"
              className={() => navLinkClasses(isCurrent('/katalog'))}
            >
              <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-slate-500 dark:text-slate-400" />
              <span>Ders Kataloğu</span>
            </NavLink>

            <button
              onClick={() => {
                if (isCommitteeLoggedIn) {
                  navigate('/komisyon');
                } else {
                  onOpenLoginModal();
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl text-base lg:text-lg 2xl:text-xl font-bold transition-all ${
                isCurrent('/komisyon')
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" />
              <span>Komisyon Paneli</span>
              {isCommitteeLoggedIn && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>
          </nav>

          {/* Right actions: Dark Mode toggle & Committee Member Auth Status */}
          <div className="flex items-center gap-3.5 lg:gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Açık Moda Geç' : 'Karanlık Moda Geç'}
              className="flex items-center gap-2 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all font-semibold text-base lg:text-lg shadow-sm"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-5 h-5 lg:w-6 lg:h-6 text-amber-400" />
                  <span className="hidden sm:inline">Açık Mod</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600" />
                  <span className="hidden sm:inline">Karanlık Mod</span>
                </>
              )}
            </button>

            {isCommitteeLoggedIn ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-base lg:text-lg text-slate-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 lg:py-2.5 rounded-xl font-bold">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Komisyon Üyesi</span>
                </div>
                <button
                  onClick={() => {
                    setIsCommitteeLoggedIn(false);
                    localStorage.removeItem('committee_auth');
                    if (isCurrent('/komisyon')) navigate('/');
                  }}
                  title="Çıkış Yap"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="text-base bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span>Komisyon Girişi</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-3 border-t border-slate-100 dark:border-slate-800">
          <NavLink
            to="/"
            className={() => `flex flex-col items-center gap-1.5 text-sm font-semibold py-1 px-3 rounded-lg ${isCurrent('/') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}
          >
            <FileCheck2 className="w-5 h-5" />
            <span>Başvuru</span>
          </NavLink>
          <NavLink
            to="/sorgula"
            className={() => `flex flex-col items-center gap-1.5 text-sm font-semibold py-1 px-3 rounded-lg ${isCurrent('/sorgula') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}
          >
            <Search className="w-5 h-5" />
            <span>Sorgula</span>
          </NavLink>
          <NavLink
            to="/katalog"
            className={() => `flex flex-col items-center gap-1.5 text-sm font-semibold py-1 px-3 rounded-lg ${isCurrent('/katalog') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Katalog</span>
          </NavLink>
          <button
            onClick={() => {
              if (isCommitteeLoggedIn) {
                navigate('/komisyon');
              } else {
                onOpenLoginModal();
              }
            }}
            className={`flex flex-col items-center gap-1.5 text-sm font-semibold py-1 px-3 rounded-lg ${isCurrent('/komisyon') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Komisyon</span>
          </button>
        </div>
      </div>
    </header>
  );
};

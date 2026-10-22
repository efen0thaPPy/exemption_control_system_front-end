import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar, type ActiveTab } from './components/Navbar';
import { StudentApplicationFlow } from './components/StudentFlow/StudentApplicationFlow';
import { TrackApplicationView } from './components/Tracking/TrackApplicationView';
import { CommitteeDashboard } from './components/Committee/CommitteeDashboard';
import { CommitteeLoginModal } from './components/Committee/CommitteeLoginModal';
import { CourseCatalogView } from './components/Catalog/CourseCatalogView';
import { ShieldAlert, Server, ExternalLink } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function MainContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('student');
  const [isCommitteeLoggedIn, setIsCommitteeLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [trackingCodeToView, setTrackingCodeToView] = useState('');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleGoToTracking = (code: string) => {
    setTrackingCodeToView(code);
    setActiveTab('tracking');
  };

  const handleCommitteeLoginSuccess = () => {
    setIsCommitteeLoggedIn(true);
    setActiveTab('committee');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCommitteeLoggedIn={isCommitteeLoggedIn}
        setIsCommitteeLoggedIn={setIsCommitteeLoggedIn}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'student' && (
          <StudentApplicationFlow onGoToTracking={handleGoToTracking} />
        )}

        {activeTab === 'tracking' && (
          <TrackApplicationView initialTrackingCode={trackingCodeToView} />
        )}

        {activeTab === 'courses' && <CourseCatalogView />}

        {activeTab === 'committee' && (
          isCommitteeLoggedIn ? (
            <CommitteeDashboard />
          ) : (
            <div className="max-w-xl mx-auto my-10 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Yetkili Girişi Gereklidir
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Komisyon paneline erişmek için lütfen komisyon üyesi olarak oturum açınız.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl text-sm sm:text-base transition-colors shadow-md shadow-indigo-600/30"
                >
                  Komisyon Giriş Ekranını Aç
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Login Modal */}
      <CommitteeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleCommitteeLoginSuccess}
      />

      {/* Modern Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Erciyes Üniversitesi
            </span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-400">
              Mühendislik Fakültesi Bilgisayar Mühendisliği Bölümü
            </span>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <span className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/70 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Backend: localhost:8081
            </span>
            <a
              href="http://localhost:8081/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold inline-flex items-center gap-1.5 hover:underline"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainContent />
    </QueryClientProvider>
  );
}

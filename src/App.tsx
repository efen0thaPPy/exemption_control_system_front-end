import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { StudentApplicationFlow } from './components/StudentFlow/StudentApplicationFlow';
import { TrackApplicationView } from './components/Tracking/TrackApplicationView';
import { CommitteeApplicationsListPage } from './components/Committee/CommitteeApplicationsListPage';
import { CommitteeApplicationDetailPage } from './components/Committee/CommitteeApplicationDetailPage';
import { CommitteeLoginModal } from './components/Committee/CommitteeLoginModal';
import { CourseCatalogView } from './components/Catalog/CourseCatalogView';
import { StudentFlowProvider } from './context/StudentFlowContext';
import { ShieldAlert } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function CommitteeProtectedView({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="w-full my-6 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Yetkili Girişi Gereklidir
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto mt-2">
          Komisyon yönetim paneline ve intibak kararlarına erişmek için lütfen komisyon üyesi olarak oturum açınız.
        </p>
      </div>
      <div className="pt-2">
        <button
          onClick={onLogin}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl text-sm sm:text-base transition-colors shadow-sm"
        >
          Komisyon Giriş Ekranını Aç
        </button>
      </div>
    </div>
  );
}

function MainLayout() {
  const navigate = useNavigate();
  const [isCommitteeLoggedIn, setIsCommitteeLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('committee_auth') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  const handleCommitteeLoginSuccess = () => {
    setIsCommitteeLoggedIn(true);
    localStorage.setItem('committee_auth', 'true');
    navigate('/komisyon');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar
        isCommitteeLoggedIn={isCommitteeLoggedIn}
        setIsCommitteeLoggedIn={setIsCommitteeLoggedIn}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Container - Full Width */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-5 lg:py-7 flex flex-col">
        <Routes>
          <Route path="/" element={<StudentApplicationFlow />} />
          <Route path="/basvuru" element={<Navigate to="/" replace />} />
          <Route path="/sorgula" element={<TrackApplicationView />} />
          <Route path="/sorgula/:trackingCode" element={<TrackApplicationView />} />
          <Route path="/katalog" element={<CourseCatalogView />} />
          <Route
            path="/komisyon"
            element={
              isCommitteeLoggedIn ? (
                <CommitteeApplicationsListPage />
              ) : (
                <CommitteeProtectedView onLogin={() => setIsLoginModalOpen(true)} />
              )
            }
          />
          <Route
            path="/komisyon/:trackingCode"
            element={
              isCommitteeLoggedIn ? (
                <CommitteeApplicationDetailPage />
              ) : (
                <CommitteeProtectedView onLogin={() => setIsLoginModalOpen(true)} />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Login Modal */}
      <CommitteeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleCommitteeLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StudentFlowProvider>
          <MainLayout />
        </StudentFlowProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

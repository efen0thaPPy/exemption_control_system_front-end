import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';
import type { ApplicationUserResponseDto } from '../../types';

interface SuccessModalProps {
  data: ApplicationUserResponseDto;
  onTrack: (trackingCode: string) => void;
  onReset: () => void;
}

export const ApplicationSuccessModal: React.FC<SuccessModalProps> = ({
  data,
  onTrack,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Başvurunuz Başarıyla Alındı!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Muafiyet ve intibak talebiniz komisyon incelemesi için sisteme kaydedilmiştir.
          </p>
        </div>

        {/* Tracking Code Card */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Başvuru Takip Kodunuz
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              *Lütfen bu kodu saklayınız
            </span>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-sm">
            <span className="font-mono text-xl font-bold text-brand-700 dark:text-brand-400 tracking-wider">
              {data.trackingCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>

          {data.message && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic pt-0.5 leading-relaxed">
              {data.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onTrack(data.trackingCode)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Durumu Takip Et</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <span>Yeni Başvuru Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

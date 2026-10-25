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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-200 transition-colors">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Başvurunuz Alındı!
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Muafiyet ve intibak talebiniz komisyon incelemesi için başarıyla sisteme iletilmiştir.
          </p>
        </div>

        {/* Tracking Code Card */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Başvuru Takip Kodunuz
            </span>
            <span className="text-sm sm:text-base text-amber-600 dark:text-amber-400 font-bold">
              *Lütfen bu kodu saklayınız
            </span>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <span className="font-mono text-2xl font-black text-brand-700 dark:text-brand-400 tracking-wider">
              {data.trackingCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>

          {data.message && (
            <p className="text-sm text-slate-600 dark:text-slate-300 italic pt-1 leading-relaxed">
              {data.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => onTrack(data.trackingCode)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-2xl text-base transition-colors shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2.5"
          >
            <span>Durumu Takip Et</span>
            <ExternalLink className="w-5 h-5" />
          </button>

          <button
            onClick={onReset}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 px-6 rounded-2xl text-base transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <span>Yeni Başvuru</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

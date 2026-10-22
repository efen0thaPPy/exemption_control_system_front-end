import React, { useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  School,
  User,
  ArrowRightLeft,
  GraduationCap
} from 'lucide-react';
import type { TranscriptDto, TransferType } from '../../types';

interface Step1Props {
  transferType: TransferType;
  setTransferType: (t: TransferType) => void;
  transcriptFile: File | null;
  setTranscriptFile: (f: File | null) => void;
  transcriptData: TranscriptDto | null;
  setTranscriptData: (d: TranscriptDto | null) => void;
  onAnalyzeTranscript: () => void;
  isAnalyzing: boolean;
  analyzeError: string | null;
  onNext: () => void;
}

export const Step1TransferAndUpload: React.FC<Step1Props> = ({
  transferType,
  setTransferType,
  transcriptFile,
  setTranscriptFile,
  transcriptData,
  onAnalyzeTranscript,
  isAnalyzing,
  analyzeError,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Lütfen geçerli bir PDF dosyası seçiniz.');
        return;
      }
      setTranscriptFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== 'application/pdf') {
        alert('Lütfen geçerli bir PDF dosyası seçiniz.');
        return;
      }
      setTranscriptFile(file);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Transfer Type Selection */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Geçiş Türünü Belirleyin
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Başvurunuza uygun geçiş tipini seçiniz
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setTransferType('LATERAL_TRANSFER')}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border-2 transition-all ${
              transferType === 'LATERAL_TRANSFER'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50/40 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${
                  transferType === 'LATERAL_TRANSFER' 
                    ? 'bg-brand-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Yatay Geçiş (Lateral Transfer)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Farklı bir üniversite veya programdan geçiş
                  </p>
                </div>
              </div>
              <input
                type="radio"
                name="transferType"
                checked={transferType === 'LATERAL_TRANSFER'}
                onChange={() => setTransferType('LATERAL_TRANSFER')}
                className="mt-1 w-4 h-4 text-brand-600 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 leading-relaxed">
              Tüm dönemlerdeki (1-8. yarıyıl) eşdeğer dersler için muafiyet başvurusu yapılabilir.
            </p>
          </div>

          <div
            onClick={() => setTransferType('VERTICAL_TRANSFER')}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border-2 transition-all ${
              transferType === 'VERTICAL_TRANSFER'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50/40 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${
                  transferType === 'VERTICAL_TRANSFER' 
                    ? 'bg-brand-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Dikey Geçiş (Vertical Transfer / DGS)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Meslek Yüksekokulu / Önlisans mezunları
                  </p>
                </div>
              </div>
              <input
                type="radio"
                name="transferType"
                checked={transferType === 'VERTICAL_TRANSFER'}
                onChange={() => setTransferType('VERTICAL_TRANSFER')}
                className="mt-1 w-4 h-4 text-brand-600 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 leading-relaxed">
              Yalnızca ilk 4 yarıyıla (1, 2, 3 ve 4. yarıyıl) ait Erciyes dersleri için muafiyet talep edilebilir.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Transcript Upload and AI Extraction */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Transkript PDF Belgesini Yükleyin
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Önceki üniversitenizden aldığınız resmi transkripti PDF formatında yükleyin
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl py-6 px-4 sm:py-8 sm:px-6 text-center cursor-pointer transition-all ${
            transcriptFile
              ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 bg-slate-50/40 dark:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mx-auto w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 shadow-sm">
            {transcriptFile ? (
              <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          {transcriptFile ? (
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {transcriptFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(transcriptFile.size / 1024 / 1024).toFixed(2)} MB • Resmi Transkript PDF Belgesi
              </p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-bold pt-1">
                Değiştirmek için tıklayın veya yeni dosya sürükleyin
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                Transkript dosyanızı buraya sürükleyin veya göz atmak için tıklayın
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sadece PDF formatı desteklenmektedir (Maks. 25MB)
              </p>
            </div>
          )}
        </div>

        {/* Trigger AI Extraction Button */}
        {transcriptFile && !transcriptData && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onAnalyzeTranscript}
              disabled={isAnalyzing}
              className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Yapay Zeka ile Çözümleniyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Transkripti Yapay Zeka ile Çözümle</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {analyzeError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Transkript Çözümleme Hatası</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{analyzeError}</p>
            </div>
          </div>
        )}

        {/* Analyzed Result Summary */}
        {transcriptData && (
          <div className="mt-5 border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Transkript Başarıyla Çözümlendi</span>
              </div>
              <button
                onClick={onAnalyzeTranscript}
                disabled={isAnalyzing}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline font-semibold"
              >
                Yeniden Çözümle
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Öğrenci</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {transcriptData.firstName} {transcriptData.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Geldiği Üniversite</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px] mt-0.5">
                    {transcriptData.university}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Tespit Edilen Ders</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {transcriptData.transcriptCourses?.length || 0} Ders
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={onNext}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>Ders Seçimi ve Eşleştirmeye Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

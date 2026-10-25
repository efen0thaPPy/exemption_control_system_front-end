import React, { useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  School,
  User,
  ArrowRightLeft,
  GraduationCap,
  Calendar,
  FileSearch
} from 'lucide-react';
import type { TranscriptDto, TransferType } from '../../types';

interface Step1Props {
  transferType: TransferType;
  setTransferType: (t: TransferType) => void;
  academicYear?: string;
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
  academicYear = '2023-2024',
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch w-full flex-1">
      {/* 1. Left Column: Transfer Type Selection & Context */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-9 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 lg:space-y-8 transition-colors flex-1 h-full min-h-[560px]">
        <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-extrabold text-xl lg:text-2xl shadow-sm">
              1
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Geçiş Türü
              </h2>
              <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Başvuru tipinizi belirleyin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base lg:text-lg font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <span>{academicYear}</span>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-5">
          {/* Lateral Transfer Card */}
          <div
            onClick={() => setTransferType('LATERAL_TRANSFER')}
            className={`cursor-pointer rounded-2xl lg:rounded-3xl p-6 lg:p-7 border-2 transition-all ${
              transferType === 'LATERAL_TRANSFER'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 lg:gap-5">
                <div
                  className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                    transferType === 'LATERAL_TRANSFER'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowRightLeft className="w-8 h-8 lg:w-10 lg:h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xl lg:text-2xl">
                    Yatay Geçiş
                  </h3>
                  <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Kurumlararası veya Merkezi Yerleştirme (Ek Madde-1)
                  </p>
                </div>
              </div>

              <div
                className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 transition-colors ${
                  transferType === 'LATERAL_TRANSFER'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {transferType === 'LATERAL_TRANSFER' && (
                  <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>

          {/* Vertical Transfer Card */}
          <div
            onClick={() => setTransferType('VERTICAL_TRANSFER')}
            className={`cursor-pointer rounded-2xl lg:rounded-3xl p-6 lg:p-7 border-2 transition-all ${
              transferType === 'VERTICAL_TRANSFER'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 lg:gap-5">
                <div
                  className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                    transferType === 'VERTICAL_TRANSFER'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-8 h-8 lg:w-10 lg:h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xl lg:text-2xl">
                    Dikey Geçiş (DGS)
                  </h3>
                  <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Önlisans mezunları lisans tamamlama intibakı
                  </p>
                </div>
              </div>

              <div
                className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 transition-colors ${
                  transferType === 'VERTICAL_TRANSFER'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {transferType === 'VERTICAL_TRANSFER' && (
                  <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl lg:rounded-3xl p-6 lg:p-7 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 space-y-3">
          <p className="font-bold text-slate-900 dark:text-white text-lg lg:text-xl">
            İntibak Başvuru Yönergesi:
          </p>
          <ul className="list-disc list-inside space-y-2.5 text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            <li>Resmi, onaylı veya e-Devlet barkodlu transkriptinizi yükleyiniz.</li>
            <li>Derslerinizi eşleştirdikten sonra onaylı ders içeriklerini PDF olarak ekleyiniz.</li>
            <li>Başvuru sonrasında verilen takip kodu ile durumunuzu sorgulayabilirsiniz.</li>
          </ul>
        </div>
      </section>

      {/* 2. Right Column: Transcript Upload & Extraction */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-9 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 lg:space-y-8 transition-colors flex-1 h-full min-h-[560px]">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-extrabold text-xl lg:text-2xl shadow-sm">
            2
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transkript PDF Belgesi
            </h2>
            <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Resmi transkript belgenizi yükleyiniz
            </p>
          </div>
        </div>

        {/* Upload Dropzone - Proportional height, not oversized */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl lg:rounded-3xl p-8 lg:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] lg:min-h-[250px] max-h-[300px] w-full ${
            transcriptFile
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mx-auto w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/70 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
            {transcriptFile ? (
              <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <UploadCloud className="w-8 h-8 lg:w-10 lg:h-10" />
            )}
          </div>

          {transcriptFile ? (
            <div className="space-y-1.5">
              <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                {transcriptFile.name}
              </p>
              <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium">
                {(transcriptFile.size / 1024 / 1024).toFixed(2)} MB • Resmi Transkript Belgesi
              </p>
              <p className="text-base lg:text-lg text-brand-600 dark:text-brand-400 font-bold pt-1">
                Farklı bir dosya seçmek için tıklayınız
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                Transkript PDF belgesini buraya sürükleyin veya dosya seçin
              </p>
              <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">
                PDF formatında resmi transkript (Maks. 25MB)
              </p>
            </div>
          )}
        </div>

        {/* Trigger Extraction Button */}
        {transcriptFile && !transcriptData && (
          <div className="flex justify-end pt-1">
            <button
              onClick={onAnalyzeTranscript}
              disabled={isAnalyzing}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-2xl text-lg lg:text-xl transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transkript Okunuyor...</span>
                </>
              ) : (
                <>
                  <FileSearch className="w-6 h-6" />
                  <span>Transkript Bilgilerini Oku</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {analyzeError && (
          <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3.5">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lg">Transkript Okunamadı</p>
              <p className="text-base text-rose-700 dark:text-rose-300 mt-1 font-medium">{analyzeError}</p>
            </div>
          </div>
        )}

        {/* When not yet analyzed: Helper Info Box to balance column height */}
        {!transcriptData && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl lg:rounded-3xl p-6 lg:p-7 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 space-y-3">
            <p className="font-bold text-slate-900 dark:text-white text-lg lg:text-xl flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              <span>Belge Formatı & İpuçları:</span>
            </p>
            <ul className="list-disc list-inside space-y-2 lg:space-y-2.5 text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <li>Yalnızca <strong>PDF</strong> formatında resmi transkript kabul edilmektedir (Maks. 25 MB).</li>
              <li>Transkriptteki harf notları, AKTS/kredi değerleri ve ders adları okunabilir netlikte olmalıdır.</li>
              <li>Dosyayı seçtikten sonra <em>"Transkript Bilgilerini Oku"</em> butonuna tıklayınız.</li>
            </ul>
          </div>
        )}

        {/* Analyzed Result Summary */}
        {transcriptData && (
          <div className="border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-200/60 dark:border-emerald-800/60">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-lg lg:text-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span>Transkript Bilgileri Başarıyla Okundu</span>
              </div>
              <button
                onClick={onAnalyzeTranscript}
                disabled={isAnalyzing}
                className="text-base text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline font-bold"
              >
                Yeniden Oku
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm lg:text-base text-slate-400 uppercase font-semibold tracking-wider">Öğrenci</p>
                  <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                    {transcriptData.firstName} {transcriptData.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <School className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm lg:text-base text-slate-400 uppercase font-semibold tracking-wider">Üniversite</p>
                  <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                    {transcriptData.university}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm lg:text-base text-slate-400 uppercase font-semibold tracking-wider">Okunan Ders Sayısı</p>
                  <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">
                    {transcriptData.transcriptCourses?.length || 0} Ders
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={onNext}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-2xl text-lg lg:text-xl transition-colors shadow-sm flex items-center justify-center gap-3"
              >
                <span>Ders Seçimi ve Eşleştirmeye Geç</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

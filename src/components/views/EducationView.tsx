import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Search, 
  ShieldAlert, 
  Activity, 
  Pill, 
  CheckCircle2, 
  HeartHandshake, 
  Printer, 
  Share2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { EDUCATIONAL_CONTENTS } from '../../data/dummyData';
import { EducationalContent } from '../../types/tb';

export const EducationView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeArticle, setActiveArticle] = useState<EducationalContent>(EDUCATIONAL_CONTENTS[2]); // Default: Apa itu TPT
  const [search, setSearch] = useState('');

  const categories = ['Semua', 'Dasar TB', 'Gejala & Penularan', 'Terapi Pencegahan (TPT)', 'Mitos & Fakta'];

  const filteredArticles = EDUCATIONAL_CONTENTS.filter(a => {
    const matchesCategory = selectedCategory === 'Semua' || a.category === selectedCategory;
    const matchesSearch = !search || (
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    );
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Friendly Banner with Puskesmas Family Consultation Image */}
      <div className="bg-white rounded-3xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="p-6 md:p-8 md:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAEEE0] text-[#1C5456] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#D77252]" />
              Pusat Edukasi & Literasi Tuberkulosis (TB) & TPT
            </div>
            <h2 className="font-heading font-black text-2xl lg:text-3xl text-[#1C5456] tracking-tight">
              Lindungi Keluarga Tercinta dengan Pengetahuan yang Benar
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Materi edukasi resmi berpedoman Petunjuk Teknis Kemenkes RI dan UPTD Puskesmas Pauh. 
              TB dapat disembuhkan total, dan kontak erat serumah dapat dicegah dari sakit TB melalui Terapi Pencegahan (TPT).
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl border border-[#35907D] text-[#35907D] hover:bg-[#35907D]/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Edukasi / Leaflet</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-5 h-56 md:h-full relative overflow-hidden bg-[#FAEEE0]">
            <img 
              src="/src/assets/images/tb_care_family_1794382848826.jpg" 
              alt="Konsultasi TB Keluarga di Puskesmas" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9]">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-[#1C5456] text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-[#FDF5EB]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel edukasi..."
            className="w-full px-3 py-1.5 bg-white border border-[#FBE6C9] rounded-xl text-xs focus:ring-2 focus:ring-[#35907D] focus:outline-none"
          />
        </div>
      </div>

      {/* Two Column Layout: Articles List (Left) & Reader (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Article Menu (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredArticles.map(article => {
            const isSelected = activeArticle.id === article.id;
            return (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white border-[#35907D] shadow-md ring-2 ring-[#35907D]/20' 
                    : 'bg-white border-[#FBE6C9] hover:bg-[#FDF5EB]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-[#D77252] mb-1">
                  <span>{article.category}</span>
                  <span className="text-slate-400">{article.readingTimeMinutes} mnt baca</span>
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {article.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Article Reader (8 cols) */}
        <div className="lg:col-span-8 p-6 lg:p-8 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs space-y-5 text-xs">
          <div className="pb-4 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAEEE0] text-[#1C5456] text-[10px] font-bold uppercase tracking-wider">
                {activeArticle.category}
              </span>
              <span className="text-[11px] text-slate-400">
                Waktu Baca: ±{activeArticle.readingTimeMinutes} Menit
              </span>
            </div>
            <h3 className="font-heading font-black text-xl text-[#1C5456]">
              {activeArticle.title}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-[#FDF5EB] p-3 rounded-2xl">
              {activeArticle.summary}
            </p>
          </div>

          {/* Key Points Callout */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <span className="font-heading font-bold text-xs text-emerald-900 block flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#58904A]" /> Poin Penting untuk Pasien & Keluarga:
            </span>
            <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-emerald-800">
              {activeArticle.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>

          {/* Body Content */}
          <div className="text-slate-700 leading-relaxed space-y-3 whitespace-pre-line text-xs font-sans">
            {activeArticle.content}
          </div>

          {/* Footer Assistance */}
          <div className="p-4 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-[#1C5456] block">Punya pertanyaan seputar TB & TPT?</span>
              <span className="text-slate-600">Konsultasikan langsung ke Poli TB UPTD Puskesmas Pauh setiap hari kerja.</span>
            </div>
            <a
              href="https://wa.me/628126789001"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold transition-all shrink-0"
            >
              Tanya Petugas
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  UserCheck, 
  Pill,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { TPTRegimen } from '../../types/tb';

interface TptDecisionModalProps {
  contactId: string | null;
  onClose: () => void;
}

export const TptDecisionModal: React.FC<TptDecisionModalProps> = ({ contactId, onClose }) => {
  const { contacts, saveTptDecision, currentUser } = useData();

  const contact = contacts.find(c => c.id === contactId);

  const [keputusan, setKeputusan] = useState<'Layak Diberikan TPT' | 'Ditunda Karena Komorbid' | 'Tidak Layak (Ada Kontraindikasi)' | 'Menolak TPT'>(
    (contact?.keputusanTenagaKesehatan as any) || 'Layak Diberikan TPT'
  );
  const [alasanKelayakan, setAlasanKelayakan] = useState(
    contact?.alasanKelayakanTPT || 'Kontak serumah erat pasien TB BTA/TCM (+), tidak sakit TB aktif, toraks normal, tidak ada kontraindikasi liver akut.'
  );
  const [regimen, setRegimen] = useState<TPTRegimen>(
    contact?.regimenTPT || '3HP (Isoniazid + Rifapentin 12 Dosis)'
  );
  const [catatan, setCatatan] = useState(
    contact?.catatanKeputusanNakes || 'Diberikan KIE kepatuhan dan efek samping ringan. Pengambilan obat dosis pertama di Puskesmas Pauh.'
  );
  const [mulaiSekarang, setMulaiSekarang] = useState(
    contact?.status === 'Sedang menjalani TPT' ? true : true
  );

  if (!contactId || !contact) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isEligible = keputusan === 'Layak Diberikan TPT';

    saveTptDecision(contactId, {
      keputusanTenagaKesehatan: keputusan,
      catatanKeputusanNakes: catatan,
      nakesPenentu: currentUser.name,
      memenuhiKriteriaTPT: isEligible,
      alasanKelayakanTPT: alasanKelayakan,
      regimenTPT: isEligible ? regimen : undefined,
      mulaiSekarang: isEligible && mulaiSekarang,
      tanggalMulaiTPT: isEligible && mulaiSekarang ? new Date().toISOString().slice(0, 10) : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">
                Keputusan Medis & Inisiasi Terapi Pencegahan TB (TPT)
              </h3>
              <p className="text-xs text-[#D1E6D9]">
                {contact.namaLengkap} ({contact.umur} th, {contact.hubunganDenganPasien}) · Pasien Indeks: {contact.patientName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Decision Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Clinical Policy Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#58904A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Otoritas Klinis Tenaga Kesehatan (Kemenkes RI)</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                Sistem tidak menetapkan kelayakan TPT secara otomatis. Keputusan klinis tetap berada di tangan dokter/tenaga kesehatan pemeriksa setelah menyingkirkan sakit TB aktif dan kontraindikasi klinis.
              </p>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Keputusan Tenaga Kesehatan Terhadap Kontak Erat: *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKeputusan('Layak Diberikan TPT')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${keputusan === 'Layak Diberikan TPT' ? 'bg-[#D1E6D9] border-[#35907D] text-[#193F35] font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#58904A] shrink-0 mt-0.5" />
                <div>
                  <span className="block">1. Layak Diberikan TPT</span>
                  <span className="text-[10px] font-normal opacity-80">Tidak sakit TB, siap memulai regimen TPT</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKeputusan('Ditunda Karena Komorbid')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${keputusan === 'Ditunda Karena Komorbid' ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block">2. Ditunda Sementara</span>
                  <span className="text-[10px] font-normal opacity-80">Perlu observasi kondisi klinis/laboratorium</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKeputusan('Tidak Layak (Ada Kontraindikasi)')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${keputusan === 'Tidak Layak (Ada Kontraindikasi)' ? 'bg-red-100 border-red-400 text-red-900 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block">3. Tidak Layak (Kontraindikasi)</span>
                  <span className="text-[10px] font-normal opacity-80">e.g. Hepatitis akut, neuropati berat, alergi</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKeputusan('Menolak TPT')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${keputusan === 'Menolak TPT' ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block">4. Kontak/Keluarga Menolak</span>
                  <span className="text-[10px] font-normal opacity-80">Perlu KIE dan konseling lebih mendalam</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Regimen Form when Eligible */}
          {keputusan === 'Layak Diberikan TPT' && (
            <div className="p-4 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] space-y-3">
              <h5 className="font-heading font-bold text-xs text-[#1C5456] flex items-center gap-1.5 pb-1 border-b border-[#FBE6C9]">
                <Pill className="w-4 h-4 text-[#35907D]" />
                Pemilihan Regimen Terapi Pencegahan TB (TPT)
              </h5>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilihan Regimen:</label>
                <select
                  value={regimen}
                  onChange={(e) => setRegimen(e.target.value as TPTRegimen)}
                  className="w-full p-2.5 bg-white border border-[#FBE6C9] rounded-xl focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
                >
                  <option value="3HP (Isoniazid + Rifapentin 12 Dosis)">
                    3HP: Isoniazid + Rifapentin (12 Dosis, 1x Seminggu selama 3 Bulan - Direkomendasikan)
                  </option>
                  <option value="6H (Isoniazid Tiap Hari 6 Bulan)">
                    6H: Isoniazid Setiap Hari selama 6 Bulan
                  </option>
                  <option value="3HR (Isoniazid + Rifampisin 3 Bulan)">
                    3HR: Isoniazid + Rifampisin Setiap Hari selama 3 Bulan (Khusus Anak)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mulaiSekarangCheck"
                  checked={mulaiSekarang}
                  onChange={(e) => setMulaiSekarang(e.target.checked)}
                  className="w-4 h-4 rounded text-[#35907D] focus:ring-[#35907D] cursor-pointer"
                />
                <label htmlFor="mulaiSekarangCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mulai Pengobatan TPT Hari Ini (Status langsung beralih ke 'Sedang menjalani TPT')
                </label>
              </div>
            </div>
          )}

          {/* Clinical Justification & Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dasar Pertimbangan Klinis & Alasan Kelayakan:
            </label>
            <textarea
              rows={2}
              value={alasanKelayakan}
              onChange={(e) => setAlasanKelayakan(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Tenaga Kesehatan / Instruksi Pengambilan Obat:
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="e.g. Edukasi warna urin kemerahan, pantau nafsu makan, kontrol 1 bulan lagi..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Tenaga Kesehatan: <strong>{currentUser.name}</strong> ({currentUser.roleLabel})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Keputusan Medis</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ScreeningModalProps {
  contactId: string | null;
  onClose: () => void;
}

export const ScreeningModal: React.FC<ScreeningModalProps> = ({ contactId, onClose }) => {
  const { contacts, saveScreening, currentUser } = useData();

  const contact = contacts.find(c => c.id === contactId);

  // Screening questions
  const [gejalaBatuk, setGejalaBatuk] = useState(contact?.gejalaBatuk ?? false);
  const [gejalaDemam, setGejalaDemam] = useState(contact?.gejalaDemam ?? false);
  const [gejalaKeringatMalam, setGejalaKeringatMalam] = useState(contact?.gejalaKeringatMalam ?? false);
  const [gejalaBeratBadanTurun, setGejalaBeratBadanTurun] = useState(contact?.gejalaBeratBadanTurun ?? false);
  const [gejalaLainnya, setGejalaLainnya] = useState(contact?.gejalaLainnya ?? '');
  const [riwayatTB, setRiwayatTB] = useState(contact?.riwayatTB ?? false);
  const [riwayatKontakTB, setRiwayatKontakTB] = useState(contact?.riwayatKontakTB ?? true);

  if (!contactId || !contact) return null;

  const isSymptomatic = gejalaBatuk || gejalaDemam || gejalaKeringatMalam || gejalaBeratBadanTurun || gejalaLainnya.trim().length > 0;
  const penilaianSkrining = isSymptomatic 
    ? 'Suspek TB (Bergejala)' 
    : 'Tidak Bergejala (Kandidat Evaluasi TPT)';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveScreening(contactId, {
      gejalaBatuk,
      gejalaDemam,
      gejalaKeringatMalam,
      gejalaBeratBadanTurun,
      gejalaLainnya,
      riwayatTB,
      riwayatKontakTB,
      penilaianSkrining,
      petugasSkrining: currentUser.name
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
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">
                Formulir Skrining Gejala TB Kontak Erat
              </h3>
              <p className="text-xs text-[#D1E6D9]">
                {contact.namaLengkap} ({contact.umur} th, {contact.hubunganDenganPasien}) · Pasien: {contact.patientName}
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

        {/* Screening Questionnaire Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          <div className="p-3.5 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] space-y-1">
            <span className="font-bold text-[#1C5456] block">Panduan Skrining:</span>
            <p className="text-slate-600 leading-relaxed">
              Tanyakan satu per satu gejala khas berikut kepada kontak erat atau orang tua pendamping (bila anak-anak).
              Deteksi dini adalah kunci mencegah penularan luas di lingkungan rumah tangga.
            </p>
          </div>

          {/* 4 Cardinal Symptoms */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs text-[#1C5456] uppercase tracking-wider pb-1 border-b border-slate-100">
              4 Gejala Utama Tuberkulosis:
            </h4>

            {/* Q1: Batuk */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#35907D] bg-slate-50/50">
              <div className="pr-4">
                <span className="font-bold text-slate-800 text-xs block">1. Batuk (Berlangsung &gt; 2 Minggu atau Batuk Berdahak)</span>
                <span className="text-[11px] text-slate-500">Termasuk batuk sesak, batuk bercampur darah, atau batuk tidak kunjung sembuh.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGejalaBatuk(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${gejalaBatuk ? 'bg-[#CE5924] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setGejalaBatuk(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!gejalaBatuk ? 'bg-[#58904A] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Q2: Demam */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#35907D] bg-slate-50/50">
              <div className="pr-4">
                <span className="font-bold text-slate-800 text-xs block">2. Demam / Meriang Berulang</span>
                <span className="text-[11px] text-slate-500">Demam tidak terlalu tinggi (sumer-sumer), sering terjadi sore atau malam hari.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGejalaDemam(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${gejalaDemam ? 'bg-[#CE5924] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setGejalaDemam(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!gejalaDemam ? 'bg-[#58904A] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Q3: Keringat Malam */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#35907D] bg-slate-50/50">
              <div className="pr-4">
                <span className="font-bold text-slate-800 text-xs block">3. Berkeringat di Malam Hari Tanpa Aktivitas</span>
                <span className="text-[11px] text-slate-500">Bangun tidur dengan pakaian atau seprai basah oleh keringat meski udara sejuk.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGejalaKeringatMalam(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${gejalaKeringatMalam ? 'bg-[#CE5924] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setGejalaKeringatMalam(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!gejalaKeringatMalam ? 'bg-[#58904A] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Q4: Penurunan BB */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#35907D] bg-slate-50/50">
              <div className="pr-4">
                <span className="font-bold text-slate-800 text-xs block">4. Berat Badan Menurun Drastis / Nafsu Makan Turun</span>
                <span className="text-[11px] text-slate-500">Pada anak: berat badan sulit naik atau garis pertumbuhan di KMS mendatar/turun.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGejalaBeratBadanTurun(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${gejalaBeratBadanTurun ? 'bg-[#CE5924] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setGejalaBeratBadanTurun(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!gejalaBeratBadanTurun ? 'bg-[#58904A] text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>

          {/* Gejala Lainnya */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Gejala Klinis Tambahan Lainnya (Bila Ada):</label>
            <input
              type="text"
              value={gejalaLainnya}
              onChange={(e) => setGejalaLainnya(e.target.value)}
              placeholder="e.g. Pembesaran kelenjar getah bening di leher, rasa lemas, nyeri dada..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
            />
          </div>

          {/* Live Result Assessment Card */}
          <div className={`p-4 rounded-2xl border ${isSymptomatic ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} space-y-1.5`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              {isSymptomatic ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#CE5924]" />
                  <span>Hasil Skrining: SUSPEK TB (BERGEJALA)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#58904A]" />
                  <span>Hasil Skrining: TIDAK BERGEJALA (KANDIDAT TPT)</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed">
              {isSymptomatic 
                ? 'Kontak erat memiliki gejala sugestif TB. Tindak Lanjut: Wajib dirujuk ke laboratorium Puskesmas untuk pemeriksaan dahak Tes Cepat Molekuler (TCM) dan foto rontgen toraks guna memastikan ada tidaknya sakit TB aktif.'
                : 'Kontak erat tidak bergejala sakit TB. Tindak Lanjut: Masuk antrean evaluasi klinis dokter pemeriksa TPT untuk penetapan kelayakan Terapi Pencegahan TB (regimen 3HP/6H).'}
            </p>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Petugas: <strong>{currentUser.name}</strong>
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
                <span>Simpan Hasil Skrining</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

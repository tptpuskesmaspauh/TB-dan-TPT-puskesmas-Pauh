import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const SettingsView: React.FC = () => {
  const { resetAllData, systemSettings, saveSystemSettings, currentUser, isSeedingData } = useData();
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin_puskesmas';

  const [namaFaskes, setNamaFaskes] = useState(systemSettings.namaFaskes);
  const [kodeFaskes, setKodeFaskes] = useState(systemSettings.faskesCode);
  const [alamat, setAlamat] = useState(systemSettings.alamat);
  const [noTelp, setNoTelp] = useState(systemSettings.noTelp);
  const [email, setEmail] = useState(systemSettings.email);

  const [waPhoneNumberId, setWaPhoneNumberId] = useState(systemSettings.waPhoneNumberId);
  const [waBusinessAccountId, setWaBusinessAccountId] = useState(systemSettings.waBusinessAccountId);
  const [autoReminderHMinus1, setAutoReminderHMinus1] = useState(systemSettings.autoReminderHMinus1);
  const [autoReminderOverdue, setAutoReminderOverdue] = useState(systemSettings.autoReminderOverdue);

  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    await saveSystemSettings({
      namaFaskes,
      alamat,
      noTelp,
      email,
      waPhoneNumberId,
      waBusinessAccountId,
      autoReminderHMinus1,
      autoReminderOverdue
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-[#1C5456]">Pengaturan Sistem TEMAN TPT</h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi profil instansi kesehatan, integrasi WhatsApp Business Cloud API resmi, dan parameter pengingat di Cloud Firestore.
          </p>
        </div>

        {savedAlert && (
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Pengaturan Tersimpan ke Firestore!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Section 1: Profil Faskes */}
        <div className="p-6 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#35907D]" />
            1. Profil Fasilitas Pelayanan Kesehatan (Fasyankes)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Fasilitas Kesehatan:</label>
              <input
                type="text"
                value={namaFaskes}
                onChange={(e) => setNamaFaskes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Faskes Kemenkes:</label>
              <input
                type="text"
                value={kodeFaskes}
                onChange={(e) => setKodeFaskes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Puskesmas:</label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Kantor:</label>
              <input
                type="text"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi Puskesmas:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Business Cloud API Configuration */}
        <div className="p-6 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-[#25D366]" />
            2. Konfigurasi WhatsApp Business Platform (API Resmi)
          </h3>

          <div className="p-3.5 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] flex items-start gap-2.5 text-slate-700">
            <Info className="w-4 h-4 text-[#D77252] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Arsitektur sistem menggunakan integrasi WhatsApp Business Cloud API resmi dari Meta / BSP resmi Indonesia guna menjamin keamanan akun dari pemblokiran dan kepatuhan privasi UU No. 27 Tahun 2022.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Phone Number ID:</label>
              <input
                type="text"
                value={waPhoneNumberId}
                onChange={(e) => setWaPhoneNumberId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WABA (WhatsApp Business Account) ID:</label>
              <input
                type="text"
                value={waBusinessAccountId}
                onChange={(e) => setWaBusinessAccountId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkHMinus1"
                checked={autoReminderHMinus1}
                onChange={(e) => setAutoReminderHMinus1(e.target.checked)}
                className="w-4 h-4 rounded text-[#35907D] cursor-pointer"
              />
              <label htmlFor="checkHMinus1" className="font-bold text-slate-800 cursor-pointer">
                Kirim Pengingat Otomatis pada H-1 Jadwal Ambil Obat OAT & Kontrol TPT
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkOverdue"
                checked={autoReminderOverdue}
                onChange={(e) => setAutoReminderOverdue(e.target.checked)}
                className="w-4 h-4 rounded text-[#35907D] cursor-pointer"
              />
              <label htmlFor="checkOverdue" className="font-bold text-slate-800 cursor-pointer">
                Kirim Notifikasi Tindak Lanjut pada H+1 Keterlambatan Pengambilan Obat
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Reset Demo Data */}
        {isAdmin && (
          <div className="p-6 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-sm text-[#1C5456]">Muat / Reset Data Simulasi Awal Firestore</h4>
              <p className="text-slate-500 mt-0.5">
                Mengisi ulang koleksi contoh 8 pasien TB dan 19 kontak erat/TPT lama ke Cloud Firestore Puskesmas Pauh.
              </p>
            </div>
            <button
              type="button"
              disabled={isSeedingData}
              onClick={() => {
                if (confirm('Yakin ingin memuat ulang data contoh simulasi ke Cloud Firestore?')) {
                  void resetAllData();
                }
              }}
              className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSeedingData ? 'Memuat Data...' : 'Muat Ulang Data Contoh'}</span>
            </button>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          {!isAdmin && (
            <span className="text-[11px] text-amber-700 font-semibold">
              Hanya Admin Puskesmas atau Super Admin yang dapat menyimpan perubahan pengaturan.
            </span>
          )}
          <button
            type="submit"
            disabled={!isAdmin}
            className="ml-auto px-6 py-2.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>

      </form>
    </div>
  );
};

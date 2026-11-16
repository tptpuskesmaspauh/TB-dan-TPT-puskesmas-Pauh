import React, { useState } from 'react';
import { X, Users, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CloseContact, Gender, TargetTptCategory } from '../../types/tb';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';

interface AddContactModalProps {
  isOpen: boolean;
  preselectedPatientId?: string | null;
  onClose: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  preselectedPatientId,
  onClose
}) => {
  const { patients, addContact } = useData();

  const [patientId, setPatientId] = useState(preselectedPatientId ?? (patients[0]?.id ?? ''));
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nik, setNik] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [umur, setUmur] = useState(25);
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('P');
  const [hubunganDenganPasien, setHubunganDenganPasien] = useState<CloseContact['hubunganDenganPasien']>('Istri');
  const [kategoriSasaranTPT, setKategoriSasaranTPT] = useState<TargetTptCategory>('Kontak Serumah');
  const [alamat, setAlamat] = useState('');
  const [kelurahan, setKelurahan] = useState(PUSKESMAS_KELURAHAN[0]);
  const [noWhatsApp, setNoWhatsApp] = useState('');

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => p.id === patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap) {
      alert('Nama kontak wajib diisi!');
      return;
    }

    const isUnlinked = !patientId;

    addContact({
      patientId: patientId || '',
      patientName: selectedPatient?.namaLengkap || '',
      sumberData: 'input_langsung',
      kategoriSasaranTPT,
      namaLengkap,
      nik: nik || '',
      tanggalLahir: tanggalLahir || undefined,
      umur: Number(umur),
      jenisKelamin,
      hubunganDenganPasien: isUnlinked && hubunganDenganPasien === 'Istri' ? 'Tidak ada data' : hubunganDenganPasien,
      alamat: alamat || selectedPatient?.alamat || 'Tidak ada data',
      kelurahan: kelurahan || selectedPatient?.kelurahan || PUSKESMAS_KELURAHAN[0],
      noWhatsApp,
      status: isUnlinked ? 'Pasien indeks belum terhubung' : 'Belum diskrining',
      sudahDiskrining: false,
      gejalaBatuk: false,
      gejalaDemam: false,
      gejalaKeringatMalam: false,
      gejalaBeratBadanTurun: false,
      riwayatTB: false,
      riwayatKontakTB: true,
      pemeriksaanLanjutanDiperlukan: false,
      memenuhiKriteriaTPT: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">Tambah Kontak Erat / Sasaran TPT</h3>
              <p className="text-xs text-[#D1E6D9]">Hubungkan ke Pasien TB Aktif (atau kosongkan bila pasien indeks belum terhubung)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pasien TB Indeks (Boleh Kosong untuk Data TPT Saja)</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
            >
              <option value="">-- Pasien Indeks Belum Terhubung --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.namaLengkap} ({p.nomorRegisterSitb || p.id}) · Kelurahan {p.kelurahan}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Kontak Erat *</label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Nama anggota keluarga / sasaran"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hubungan Dengan Pasien</label>
              <select
                value={hubunganDenganPasien}
                onChange={(e) => setHubunganDenganPasien(e.target.value as CloseContact['hubunganDenganPasien'])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
              >
                <option value="Tidak ada data">Tidak ada data</option>
                <option value="Istri">Istri</option>
                <option value="Suami">Suami</option>
                <option value="Anak">Anak</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Saudara Kandung">Saudara Kandung</option>
                <option value="Lainnya (Serumah)">Lainnya (Serumah)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Umur (Tahun)</label>
              <input
                type="number"
                value={umur}
                onChange={(e) => setUmur(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Sasaran TPT</label>
              <select
                value={kategoriSasaranTPT}
                onChange={(e) => setKategoriSasaranTPT(e.target.value as TargetTptCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              >
                <option value="Kontak Serumah">Kontak Serumah</option>
                <option value="Kontak Erat">Kontak Erat</option>
                <option value="Anak <5 Tahun">Anak &lt;5 Tahun</option>
                <option value="ODHA / Imunokompromais">ODHA / Imunokompromais</option>
                <option value="Kelompok Risiko Lain">Kelompok Risiko Lain</option>
                <option value="Tidak ada data">Tidak ada data</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
              <input
                type="text"
                value={noWhatsApp}
                onChange={(e) => setNoWhatsApp(e.target.value)}
                placeholder="0812..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kelurahan</label>
              <select
                value={kelurahan}
                onChange={(e) => setKelurahan(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              >
                {PUSKESMAS_KELURAHAN.map(kel => (
                  <option key={kel} value={kel}>{kel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NIK Kontak Erat (Opsional)</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                maxLength={16}
                placeholder="16 digit NIK"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Rumah</label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat lengkap (kosongkan jika serumah dengan pasien indeks)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Kontak Erat</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};


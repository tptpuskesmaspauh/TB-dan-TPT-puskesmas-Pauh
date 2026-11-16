import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Save, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { Gender, TBClassification, TBBacteriological, CloseContact } from '../../types/tb';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose }) => {
  const { addPatient, currentUser } = useData();

  // Patient Identity State
  const [nomorRegisterSitb, setNomorRegisterSitb] = useState('');
  const [sitbRecorded, setSitbRecorded] = useState(true);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nik, setNik] = useState('');
  const [noRekamMedis, setNoRekamMedis] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('L');
  const [tanggalLahir, setTanggalLahir] = useState('1990-01-01');
  const [umur, setUmur] = useState(36);
  const [alamat, setAlamat] = useState('');
  const [kelurahan, setKelurahan] = useState(PUSKESMAS_KELURAHAN[0]);
  const [noWhatsApp, setNoWhatsApp] = useState('');
  const [namaPendamping, setNamaPendamping] = useState('');
  const [hubunganPendamping, setHubunganPendamping] = useState('Istri');
  const [noWhatsAppPendamping, setNoWhatsAppPendamping] = useState('');

  // Clinical TB State
  const [tanggalDiagnosis, setTanggalDiagnosis] = useState(new Date().toISOString().slice(0, 10));
  const [klasifikasi, setKlasifikasi] = useState<TBClassification>('Paru');
  const [lokasiAnatomi, setLokasiAnatomi] = useState('Paru Bilateral');
  const [hasilBakteriologis, setHasilBakteriologis] = useState<TBBacteriological>('Terkonfirmasi Bakteriologis (TCM+)');
  const [tanggalMulaiOAT, setTanggalMulaiOAT] = useState(new Date().toISOString().slice(0, 10));
  const [regimenOAT, setRegimenOAT] = useState('2RHZE / 4RH (Kategori 1 FDC Dewasa)');
  const [catatanKlinis, setCatatanKlinis] = useState('');

  // Multi-Contact Simultaneous Input
  const [contactsList, setContactsList] = useState<Array<{
    namaLengkap: string;
    nik: string;
    umur: number;
    jenisKelamin: Gender;
    hubunganDenganPasien: 'Suami' | 'Istri' | 'Anak' | 'Orang Tua' | 'Saudara Kandung' | 'Lainnya (Serumah)';
    noWhatsApp: string;
  }>>([
    {
      namaLengkap: '',
      nik: '',
      umur: 30,
      jenisKelamin: 'P',
      hubunganDenganPasien: 'Istri',
      noWhatsApp: ''
    }
  ]);

  if (!isOpen) return null;

  const handleAddContactRow = () => {
    setContactsList(prev => [
      ...prev,
      {
        namaLengkap: '',
        nik: '',
        umur: 10,
        jenisKelamin: 'L',
        hubunganDenganPasien: 'Anak',
        noWhatsApp: noWhatsApp || ''
      }
    ]);
  };

  const handleRemoveContactRow = (index: number) => {
    setContactsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateContactRow = (index: number, field: string, value: any) => {
    setContactsList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap || !noRekamMedis) {
      alert('Mohon isi nama lengkap dan nomor rekam medis pasien!');
      return;
    }

    // Filter valid contacts
    const validContacts = contactsList
      .filter(c => c.namaLengkap.trim().length > 0)
      .map(c => ({
        ...c,
        alamat: alamat || 'Serumah dengan pasien indeks',
        kelurahan: kelurahan,
        status: 'Belum diskrining' as const,
        sudahDiskrining: false,
        gejalaBatuk: false,
        gejalaDemam: false,
        gejalaKeringatMalam: false,
        gejalaBeratBadanTurun: false,
        riwayatTB: false,
        riwayatKontakTB: true,
        pemeriksaanLanjutanDiperlukan: false,
        memenuhiKriteriaTPT: false
      }));

    // Next pickup is 30 days from start
    const nextPickup = new Date();
    nextPickup.setDate(nextPickup.getDate() + 30);
    const nextPickupStr = nextPickup.toISOString().slice(0, 10);

    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + 6);
    const finishDateStr = finishDate.toISOString().slice(0, 10);

    const generatedSitb = nomorRegisterSitb.trim() || `SITB-137107-2026-${Math.floor(100 + Math.random() * 900)}`;

    addPatient({
      nomorRegisterSitb: generatedSitb,
      sitbRecorded,
      sitbRecordedDate: sitbRecorded ? new Date().toISOString().slice(0, 10) : undefined,
      sitbRecordedBy: sitbRecorded ? currentUser.name : undefined,
      nik: nik || '137107' + Math.floor(1000000000 + Math.random() * 9000000000),
      noRekamMedis,
      namaLengkap,
      jenisKelamin,
      tanggalLahir,
      umur: Number(umur),
      alamat,
      kelurahan,
      noWhatsApp,
      namaPendamping,
      hubunganPendamping,
      noWhatsAppPendamping,
      tanggalDiagnosis,
      klasifikasi,
      lokasiAnatomi,
      hasilBakteriologis,
      tanggalMulaiOAT,
      fasyankes: 'UPTD Puskesmas Pauh',
      petugasPenanggungJawab: currentUser.name,
      regimenOAT,
      fasePengobatan: 'Awal (Intensif)',
      statusPengobatan: 'Sedang Berobat',
      perkiraanSelesai: finishDateStr,
      komorbiditas: [],
      catatanKlinis: catatanKlinis || 'Pasien baru terdaftar. Terjadwal pendataan dan skrining kontak erat.',
      kepatuhanMinumObat: 'Sangat Patuh (>95%)',
      jadwalAmbilObatBerikutnya: nextPickupStr,
      jadwalAmbilObatTerakhir: tanggalMulaiOAT,
      sisaObatHari: 30,
      pernahTerlambat: false,
      jumlahKeterlambatan: 0
    }, validContacts);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] max-h-[92vh] overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white">Pendaftaran Pasien TB Aktif & Kontak Erat</h3>
              <p className="text-xs text-[#D1E6D9]">Satu formulir otomatis mengaitkan pasien indeks dengan seluruh keluarga serumah</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* SECTION 1: IDENTITAS PASIEN */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#1C5456] text-white text-xs flex items-center justify-center font-bold">1</span>
              Identitas Pasien TB Indeks
            </h4>

            <div className="p-3.5 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center">
              <div>
                <label className="block font-bold text-[#1C5456] mb-1">Nomor Register SITB (Kunci Penghubung Resmi)</label>
                <input
                  type="text"
                  value={nomorRegisterSitb}
                  onChange={(e) => setNomorRegisterSitb(e.target.value)}
                  placeholder="e.g. SITB-137107-2026-009"
                  className="w-full p-2.5 bg-white border border-[#FBE6C9] rounded-xl focus:ring-2 focus:ring-[#35907D] focus:outline-none font-mono"
                />
              </div>
              <div className="pt-2 sm:pt-4">
                <label className="inline-flex items-center gap-2 font-bold text-[#1C5456] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sitbRecorded}
                    onChange={(e) => setSitbRecorded(e.target.checked)}
                    className="w-4 h-4 rounded text-[#35907D]"
                  />
                  <span>Sudah dicatat di SITB Kemenkes</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Data klinis detail tetap tercatat resmi di SITB; formulir ini cukup untuk pemantauan lapangan & kontak erat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pasien *</label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="e.g. Rusdianto"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekam Medis (No. RM) *</label>
                <input
                  type="text"
                  required
                  value={noRekamMedis}
                  onChange={(e) => setNoRekamMedis(e.target.value)}
                  placeholder="e.g. RM-11340"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  maxLength={16}
                  placeholder="137107..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Umur (Tahun)</label>
                <input
                  type="number"
                  value={umur}
                  onChange={(e) => setUmur(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelurahan Puskesmas Pauh</label>
                <select
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
                >
                  {PUSKESMAS_KELURAHAN.map(kel => (
                    <option key={kel} value={kel}>{kel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Pasien</label>
                <input
                  type="text"
                  value={noWhatsApp}
                  onChange={(e) => setNoWhatsApp(e.target.value)}
                  placeholder="0812..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. / RT / RW"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama & No WA Pendamping (PMO)</label>
                <input
                  type="text"
                  value={namaPendamping}
                  onChange={(e) => setNamaPendamping(e.target.value)}
                  placeholder="Nama Pendamping (Istri/Suami)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#35907D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: INFORMASI KLINIS TB */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-[#1C5456] text-white text-xs flex items-center justify-center font-bold">2</span>
              Klinis Tuberkulosis & Pengobatan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Klasifikasi TB</label>
                <select
                  value={klasifikasi}
                  onChange={(e) => setKlasifikasi(e.target.value as TBClassification)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <option value="Paru">TB Paru</option>
                  <option value="Ekstraparu">TB Ekstraparu</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hasil Uji Bakteriologis</label>
                <select
                  value={hasilBakteriologis}
                  onChange={(e) => setHasilBakteriologis(e.target.value as TBBacteriological)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <option value="Terkonfirmasi Bakteriologis (TCM+)">TCM Dahak Positif (Terkonfirmasi)</option>
                  <option value="Terdiagnosis Klinis">Terdiagnosis Klinis (Foto Toraks/Gejala)</option>
                  <option value="BTA Positif">BTA Mikroskopis Positif</option>
                  <option value="Resisten Obat (TB-RO)">TB Resisten Obat (TB-RO)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai OAT</label>
                <input
                  type="date"
                  value={tanggalMulaiOAT}
                  onChange={(e) => setTanggalMulaiOAT(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Regimen OAT</label>
                <input
                  type="text"
                  value={regimenOAT}
                  onChange={(e) => setRegimenOAT(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Klinis Awal</label>
                <input
                  type="text"
                  value={catatanKlinis}
                  onChange={(e) => setCatatanKlinis(e.target.value)}
                  placeholder="Keluhan awal, kondisi paru, dll."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: KONTAK ERAT KELUARGA (ONE-TO-MANY INTEGRATION) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D77252] text-white text-xs flex items-center justify-center font-bold">3</span>
                Daftarkan Kontak Erat Keluarga Serumah Sekaligus
              </h4>
              <button
                type="button"
                onClick={handleAddContactRow}
                className="px-3 py-1.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Anggota Keluarga</span>
              </button>
            </div>

            <div className="space-y-3">
              {contactsList.map((contact, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C5456]">Kontak Erat #{idx + 1}</span>
                    {contactsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContactRow(idx)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Nama Kontak (e.g. Siti Aminah)"
                        value={contact.namaLengkap}
                        onChange={(e) => handleUpdateContactRow(idx, 'namaLengkap', e.target.value)}
                        className="w-full p-2 bg-white border border-[#FBE6C9] rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <select
                        value={contact.hubunganDenganPasien}
                        onChange={(e) => handleUpdateContactRow(idx, 'hubunganDenganPasien', e.target.value)}
                        className="w-full p-2 bg-white border border-[#FBE6C9] rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="Istri">Istri</option>
                        <option value="Suami">Suami</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Saudara Kandung">Saudara Kandung</option>
                        <option value="Lainnya (Serumah)">Lainnya (Serumah)</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Umur"
                        value={contact.umur}
                        onChange={(e) => handleUpdateContactRow(idx, 'umur', Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#FBE6C9] rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="No WhatsApp"
                        value={contact.noWhatsApp}
                        onChange={(e) => handleUpdateContactRow(idx, 'noWhatsApp', e.target.value)}
                        className="w-full p-2 bg-white border border-[#FBE6C9] rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Otomatis Terhubung:</strong> Semua kontak erat yang dimasukkan di sini akan langsung terhubung ke ID Pasien ini dan masuk ke antrean skrining gejala TB dan evaluasi TPT.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Pasien & Kontak Erat</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

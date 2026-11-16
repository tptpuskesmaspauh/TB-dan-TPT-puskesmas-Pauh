import React, { useState } from 'react';
import { 
  FileHeart, 
  Home, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Users, 
  Calendar, 
  UserCheck,
  Stethoscope,
  MapPin,
  Save
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';

export const FollowupView: React.FC = () => {
  const { 
    followups, 
    addFollowup, 
    homeVisits, 
    addHomeVisit, 
    patients, 
    contacts, 
    currentUser 
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'clinical' | 'homevisit'>('homevisit');
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showAddClinical, setShowAddClinical] = useState(false);

  // New Visit form state
  const [visitTargetType, setVisitTargetType] = useState<'Pasien TB' | 'Kontak Erat'>('Kontak Erat');
  const [visitTargetId, setVisitTargetId] = useState(contacts[0]?.id ?? '');
  const [visitTanggal, setVisitTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [visitTujuan, setVisitTujuan] = useState<'Investigasi Kontak Erat' | 'Pelacakan Mangkir Minum Obat' | 'Edukasi Keluarga & Sanitasi Rumah' | 'Pemantauan Efek Samping'>('Investigasi Kontak Erat');
  const [visitKelurahan, setVisitKelurahan] = useState(PUSKESMAS_KELURAHAN[0]);
  const [visitAlamat, setVisitAlamat] = useState('');
  const [visitHasil, setVisitHasil] = useState('');
  const [visitRencana, setVisitRencana] = useState('');

  // New Clinical Follow-up state
  const [clinPatientId, setClinPatientId] = useState(patients[0]?.id ?? '');
  const [clinBulanKe, setClinBulanKe] = useState(2);
  const [clinBB, setClinBB] = useState(55);
  const [clinKepatuhan, setClinKepatuhan] = useState<'Sangat Patuh' | 'Cukup' | 'Tidak Patuh'>('Sangat Patuh');
  const [clinDahak, setClinDahak] = useState<'BTA (-)' | 'BTA (+)' | 'Belum Ada Hasil' | 'Tidak Diperiksa'>('BTA (-)');
  const [clinKeluhan, setClinKeluhan] = useState('Tidak ada keluhan batuk');
  const [clinEfekSamping, setClinEfekSamping] = useState('Nihil');
  const [clinRencana, setClinRencana] = useState('Lanjutkan pengobatan OAT fase intensif');

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetName = 'Sasaran Kunjungan';
    if (visitTargetType === 'Pasien TB') {
      const p = patients.find(item => item.id === visitTargetId);
      targetName = p ? p.namaLengkap : 'Pasien TB';
    } else {
      const c = contacts.find(item => item.id === visitTargetId);
      targetName = c ? c.namaLengkap : 'Kontak Erat';
    }

    addHomeVisit({
      targetType: visitTargetType,
      targetId: visitTargetId,
      targetName,
      alamat: visitAlamat || 'Wilayah Puskesmas Pauh',
      kelurahan: visitKelurahan,
      tanggalKunjungan: visitTanggal,
      petugas: currentUser.name,
      tujuan: visitTujuan,
      hasilKunjungan: visitHasil || 'Kunjungan telah dijadwalkan bersama kader TB kelurahan.',
      edukasiDiberikan: 'Pentingnya skrining dini dan kepatuhan pengobatan.',
      kendalaLapang: 'Tidak ada kendala berarti.',
      rencanaTindakLanjut: visitRencana || 'Evaluasi kunjungan pada hari H.',
      status: 'Dijadwalkan'
    });

    setShowAddVisit(false);
  };

  const handleSaveClinical = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find(item => item.id === clinPatientId);
    if (!p) return;

    addFollowup({
      patientId: clinPatientId,
      patientName: p.namaLengkap,
      tanggalFollowup: new Date().toISOString().slice(0, 10),
      bulanPengobatanKe: Number(clinBulanKe),
      beratBadanKg: Number(clinBB),
      kepatuhan: clinKepatuhan,
      keluhan: clinKeluhan,
      efekSampingOAT: clinEfekSamping,
      hasilPemeriksaanDahak: clinDahak,
      edukasiDiberikan: 'KIE kepatuhan minum obat dan gizi seimbang.',
      statusKunjungan: 'Hadir di Puskesmas',
      petugas: currentUser.name,
      rencanaTindakLanjut: clinRencana
    });

    setShowAddClinical(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-[#1C5456]">
            Follow-up Pasien TB & Kunjungan Rumah (Aksi Nyata)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan langsung klinis pasien, investigasi kontak erat di rumah, dan pelacakan pasien mangkir minum obat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'homevisit' ? (
            <button
              onClick={() => setShowAddVisit(true)}
              className="px-4 py-2 rounded-xl bg-[#D77252] hover:bg-[#CE5924] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Jadwalkan Kunjungan Rumah</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddClinical(true)}
              className="px-4 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Follow-up Bulanan</span>
            </button>
          )}
        </div>
      </div>

      {/* Toggle Sub-tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#FAEEE0] rounded-2xl border border-[#FBE6C9] w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('homevisit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeSubTab === 'homevisit' ? 'bg-[#1C5456] text-white shadow-xs' : 'text-[#1C5456] hover:bg-white/50'}`}
        >
          <Home className="w-4 h-4" />
          <span>Kunjungan Rumah / Lapangan ({homeVisits.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('clinical')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeSubTab === 'clinical' ? 'bg-[#1C5456] text-white shadow-xs' : 'text-[#1C5456] hover:bg-white/50'}`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Pemeriksaan Klinis Bulanan ({followups.length})</span>
        </button>
      </div>

      {/* Subtab 1: Home Visits */}
      {activeSubTab === 'homevisit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homeVisits.map((visit) => (
            <div key={visit.id} className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{visit.targetName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAEEE0] text-[#1C5456] font-bold">
                      {visit.targetType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#35907D]" />
                    Kelurahan {visit.kelurahan} · {visit.alamat}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  visit.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                  visit.status === 'Dijadwalkan' ? 'bg-sky-100 text-sky-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {visit.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF5EB] space-y-1.5">
                <span className="font-bold text-[#1C5456] block">Tujuan Kunjungan: {visit.tujuan}</span>
                <p className="text-slate-600">{visit.hasilKunjungan}</p>
              </div>

              <div className="space-y-1 text-slate-600">
                <p><strong>Edukasi Diberikan:</strong> {visit.edukasiDiberikan}</p>
                <p><strong>Rencana Lanjutan:</strong> {visit.rencanaTindakLanjut}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Tanggal: <strong>{visit.tanggalKunjungan}</strong></span>
                <span>Petugas: {visit.petugas}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Clinical Followups */}
      {activeSubTab === 'clinical' && (
        <div className="space-y-3">
          {followups.map((f) => (
            <div key={f.id} className="p-4 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-sm text-[#1C5456]">{f.patientName}</span>
                  <span className="text-[11px] text-slate-500 ml-2">Bulan Pengobatan Ke-{f.bulanPengobatanKe} ({f.tanggalFollowup})</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Kepatuhan: {f.kepatuhan}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-[#FAEEE0]">
                  <span className="text-[10px] text-slate-500 block">Berat Badan</span>
                  <span className="font-bold text-slate-800">{f.beratBadanKg} kg</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAEEE0]">
                  <span className="text-[10px] text-slate-500 block">Pemeriksaan Dahak</span>
                  <span className="font-bold text-[#35907D]">{f.hasilPemeriksaanDahak || 'Tidak Diperiksa'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAEEE0]">
                  <span className="text-[10px] text-slate-500 block">Efek Samping OAT</span>
                  <span className="font-semibold text-slate-700">{f.efekSampingOAT}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAEEE0]">
                  <span className="text-[10px] text-slate-500 block">Petugas Pemeriksa</span>
                  <span className="font-semibold text-slate-700">{f.petugas}</span>
                </div>
              </div>

              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong>Rencana Tindak Lanjut:</strong> {f.rencanaTindakLanjut}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tambah Kunjungan Rumah */}
      {showAddVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#FBE6C9] shadow-2xl space-y-4 text-xs">
            <h3 className="font-heading font-black text-sm text-[#1C5456]">Jadwalkan Kunjungan Rumah Baru</h3>
            <form onSubmit={handleSaveVisit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kunjungan:</label>
                  <select
                    value={visitTargetType}
                    onChange={(e) => setVisitTargetType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Kontak Erat">Kontak Erat Keluarga</option>
                    <option value="Pasien TB">Pasien TB Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Sasaran:</label>
                  <select
                    value={visitTargetId}
                    onChange={(e) => setVisitTargetId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {visitTargetType === 'Kontak Erat' 
                      ? contacts.map(c => <option key={c.id} value={c.id}>{c.namaLengkap} ({c.hubunganDenganPasien})</option>)
                      : patients.map(p => <option key={p.id} value={p.id}>{p.namaLengkap} ({p.id})</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kunjungan:</label>
                  <input
                    type="date"
                    required
                    value={visitTanggal}
                    onChange={(e) => setVisitTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelurahan:</label>
                  <select
                    value={visitKelurahan}
                    onChange={(e) => setVisitKelurahan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {PUSKESMAS_KELURAHAN.map(kel => (
                      <option key={kel} value={kel}>{kel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan Kunjungan:</label>
                <select
                  value={visitTujuan}
                  onChange={(e) => setVisitTujuan(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Investigasi Kontak Erat">Investigasi & Skrining Kontak Erat Serumah</option>
                  <option value="Pelacakan Mangkir Minum Obat">Pelacakan Pasien Mangkir Minum OAT</option>
                  <option value="Edukasi Keluarga & Sanitasi Rumah">Edukasi Keluarga & Sanitasi Ventilasi Rumah</option>
                  <option value="Pemantauan Efek Samping">Pemantauan Efek Samping Obat / TPT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Sasaran:</label>
                <input
                  type="text"
                  value={visitAlamat}
                  onChange={(e) => setVisitAlamat(e.target.value)}
                  placeholder="Jl. / RT / RW"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Persiapan / Instruksi Kader:</label>
                <input
                  type="text"
                  value={visitHasil}
                  onChange={(e) => setVisitHasil(e.target.value)}
                  placeholder="Bawakan masker, pot dahak, atau formulir skrining..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVisit(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D77252] hover:bg-[#CE5924] text-white font-bold"
                >
                  Jadwalkan Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Follow-up Klinis */}
      {showAddClinical && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#FBE6C9] shadow-2xl space-y-4 text-xs">
            <h3 className="font-heading font-black text-sm text-[#1C5456]">Catat Pemeriksaan Follow-up Pasien TB</h3>
            <form onSubmit={handleSaveClinical} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Pasien:</label>
                <select
                  value={clinPatientId}
                  onChange={(e) => setClinPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.namaLengkap} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulan Ke:</label>
                  <input
                    type="number"
                    value={clinBulanKe}
                    onChange={(e) => setClinBulanKe(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berat Badan (Kg):</label>
                  <input
                    type="number"
                    value={clinBB}
                    onChange={(e) => setClinBB(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evaluasi Dahak:</label>
                  <select
                    value={clinDahak}
                    onChange={(e) => setClinDahak(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="BTA (-)">BTA Negatif (-)</option>
                    <option value="BTA (+)">BTA Positif (+)</option>
                    <option value="Belum Ada Hasil">Menunggu Lab</option>
                    <option value="Tidak Diperiksa">Tidak Diperiksa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rencana Tindak Lanjut:</label>
                <input
                  type="text"
                  value={clinRencana}
                  onChange={(e) => setClinRencana(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinical(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

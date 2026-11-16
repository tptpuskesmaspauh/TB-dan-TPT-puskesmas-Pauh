import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Home, 
  Plus, 
  Phone, 
  ShieldCheck, 
  Stethoscope, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Pill,
  ExternalLink
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface PatientDetailModalProps {
  patientId: string | null;
  onClose: () => void;
  onOpenAddContactForPatient: (patientId: string) => void;
  onOpenScreeningModal: (contactId: string) => void;
  onOpenTptModal: (contactId: string) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patientId,
  onClose,
  onOpenAddContactForPatient,
  onOpenScreeningModal,
  onOpenTptModal
}) => {
  const { 
    patients, 
    getContactsForPatient, 
    getPatientSummary, 
    pickups, 
    followups, 
    homeVisits, 
    whatsappMessages,
    recordPickup,
    toggleSitbRecordedPatient
  } = useData();

  const [activeTab, setActiveTab] = useState<'profile' | 'contacts' | 'medication' | 'followup' | 'homevisit' | 'whatsapp'>('contacts');

  if (!patientId) return null;
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return null;

  const contacts = getContactsForPatient(patientId);
  const summary = getPatientSummary(patientId);
  const patientPickups = pickups.filter(p => p.patientId === patientId);
  const patientFollowups = followups.filter(f => f.patientId === patientId);
  const patientHomeVisits = homeVisits.filter(h => h.targetId === patientId || contacts.some(c => c.id === h.targetId));
  const patientWa = whatsappMessages.filter(w => w.receiverName.includes(patient.namaLengkap) || w.noWhatsApp === patient.noWhatsApp);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TPT selesai':
      case 'Sembuh':
      case 'Tepat Waktu':
        return 'bg-[#58904A] text-white';
      case 'Sedang menjalani TPT':
      case 'Sedang Berobat':
      case 'Sudah diskrining':
        return 'bg-[#F9D059] text-[#193F35] font-bold';
      case 'Belum diskrining':
      case 'Terlambat':
      case 'TPT belum dimulai':
      case 'Belum diperiksa lebih lanjut':
        return 'bg-[#CE5924] text-white';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0 font-heading font-black text-xl">
              {patient.namaLengkap.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-lg text-white">{patient.namaLengkap}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#F9D059] text-[#193F35] font-bold">
                  {patient.id}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white text-[#1C5456] font-bold">
                  SITB: {patient.nomorRegisterSitb || '-'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-medium">
                  RM: {patient.noRekamMedis}
                </span>
              </div>
              <p className="text-xs text-[#D1E6D9] mt-0.5">
                {patient.umur} th ({patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}) · Kelurahan {patient.kelurahan} · WA: {patient.noWhatsApp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/62${patient.noWhatsApp.replace(/^0/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs"
              title="Hubungi Pasien via WhatsApp"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Integrated Summary Indicator Bar */}
        <div className="bg-[#FAEEE0] px-5 py-3 border-b border-[#FBE6C9] grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white border border-[#FBE6C9]">
            <span className="text-[10px] text-slate-500 font-medium">Total Kontak Erat</span>
            <p className="font-mono font-bold text-sm text-[#1C5456]">{summary.totalContacts} Jiwa</p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#FBE6C9]">
            <span className="text-[10px] text-slate-500 font-medium">Sudah Diskrining</span>
            <p className="font-mono font-bold text-sm text-[#58904A]">{summary.screenedCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#FBE6C9]">
            <span className="text-[10px] text-slate-500 font-medium">Belum Skrining</span>
            <p className="font-mono font-bold text-sm text-[#CE5924]">{summary.unscreenedCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#FBE6C9]">
            <span className="text-[10px] text-slate-500 font-medium">Memenuhi Kriteria TPT</span>
            <p className="font-mono font-bold text-sm text-[#35907D]">{summary.tptEligibleCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#FBE6C9]">
            <span className="text-[10px] text-slate-500 font-medium">TPT Dimulai / Selesai</span>
            <p className="font-mono font-bold text-sm text-[#58904A]">{summary.tptStartedCount} / {summary.tptCompletedCount}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'contacts' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Users className="w-4 h-4 text-[#35907D]" />
            <span>1. Kontak Erat Keluarga ({contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'profile' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <UserCheck className="w-4 h-4 text-[#1C5456]" />
            <span>2. Profil & Klinis TB</span>
          </button>

          <button
            onClick={() => setActiveTab('medication')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'medication' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Pill className="w-4 h-4 text-[#CE5924]" />
            <span>3. Jadwal Obat OAT ({patientPickups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followup')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'followup' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Stethoscope className="w-4 h-4 text-[#58904A]" />
            <span>4. Monitoring Bulanan</span>
          </button>

          <button
            onClick={() => setActiveTab('homevisit')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'homevisit' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Home className="w-4 h-4 text-[#D77252]" />
            <span>5. Kunjungan Rumah ({patientHomeVisits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${activeTab === 'whatsapp' ? 'border-[#35907D] text-[#1C5456] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4 text-[#25D366]" />
            <span>6. Riwayat Pesan WA ({patientWa.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#FDF5EB]/30">
          
          {/* TAB 1: KONTAK ERAT (CORE INTEGRATION) */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#1C5456]">
                    Daftar Kontak Erat Serumah & Terpapar
                  </h4>
                  <p className="text-xs text-slate-500">
                    Setiap kontak erat harus diskrining gejala TB. Jika tidak sakit TB aktif, evaluasi kelayakan Terapi Pencegahan TB (TPT).
                  </p>
                </div>
                <button
                  onClick={() => onOpenAddContactForPatient(patient.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Kontak Pasien Ini</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="p-4 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{contact.namaLengkap}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAEEE0] text-[#1C5456] font-bold">
                            {contact.hubunganDenganPasien}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {contact.umur} th · {contact.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · WA: {contact.noWhatsApp}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>

                    {/* Screening details */}
                    <div className="p-2.5 rounded-xl bg-[#FDF5EB] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Status Skrining:</span>
                        <span className={`font-bold ${contact.sudahDiskrining ? 'text-[#58904A]' : 'text-[#CE5924]'}`}>
                          {contact.sudahDiskrining ? `Sudah (${contact.tanggalSkrining || '-'})` : 'Belum Diskrining!'}
                        </span>
                      </div>
                      {contact.sudahDiskrining && (
                        <p className="text-[11px] text-slate-500">
                          Hasil: <strong>{contact.penilaianSkrining || 'Tidak bergejala'}</strong>
                        </p>
                      )}
                    </div>

                    {/* TPT Status */}
                    {contact.sudahDiskrining && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-900 font-semibold">Kelayakan TPT:</span>
                          <span className="font-bold text-emerald-800">
                            {contact.keputusanTenagaKesehatan || (contact.memenuhiKriteriaTPT ? 'Memenuhi Kriteria' : 'Belum Ditentukan')}
                          </span>
                        </div>
                        {contact.regimenTPT && (
                          <p className="text-[11px] text-emerald-700">Regimen: <strong>{contact.regimenTPT}</strong></p>
                        )}
                        {contact.statusAkhirTPT && (
                          <p className="text-[11px] text-emerald-700">Status Akhir: <strong>{contact.statusAkhirTPT}</strong></p>
                        )}
                      </div>
                    )}

                    {/* Quick Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {!contact.sudahDiskrining ? (
                        <button
                          onClick={() => onOpenScreeningModal(contact.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#CE5924] hover:bg-[#D77252] text-white text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          Isi Skrining TB
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenTptModal(contact.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          Kelola & Evaluasi TPT
                        </button>
                      )}

                      <a
                        href={`https://wa.me/62${contact.noWhatsApp.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all cursor-pointer"
                        title="Kirim Pesan WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}

                {contacts.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-[#FBE6C9]">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Belum ada kontak erat yang didaftarkan.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Segera input anggota keluarga atau orang serumah pasien.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL KLINIS TB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#FBE6C9] space-y-3">
                <h5 className="font-heading font-bold text-xs text-[#1C5456] uppercase tracking-wider pb-2 border-b border-slate-100">
                  Identitas Lengkap
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">NIK (Dilindungi):</span>
                    <p className="font-mono font-semibold text-slate-800">{patient.nik.slice(0, 6)}******{patient.nik.slice(-2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tanggal Lahir:</span>
                    <p className="font-semibold text-slate-800">{patient.tanggalLahir}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Kelurahan:</span>
                    <p className="font-semibold text-slate-800">{patient.kelurahan}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">No. WhatsApp:</span>
                    <p className="font-semibold text-slate-800">{patient.noWhatsApp}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Alamat Rumah:</span>
                  <p className="font-semibold text-slate-800">{patient.alamat}</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Keluarga / Pendamping Minum Obat (PMO):</span>
                  <p className="font-semibold text-slate-800">{patient.namaPendamping} ({patient.hubunganPendamping}) · {patient.noWhatsAppPendamping}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#FBE6C9] space-y-3">
                <h5 className="font-heading font-bold text-xs text-[#1C5456] uppercase tracking-wider pb-2 border-b border-slate-100">
                  Informasi Medis Klinis TB
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Tanggal Diagnosis:</span>
                    <p className="font-semibold text-slate-800">{patient.tanggalDiagnosis}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tanggal Mulai OAT:</span>
                    <p className="font-semibold text-slate-800">{patient.tanggalMulaiOAT}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Klasifikasi:</span>
                    <p className="font-semibold text-[#35907D]">{patient.klasifikasi} ({patient.lokasiAnatomi})</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Hasil Bakteriologis:</span>
                    <p className="font-semibold text-slate-800">{patient.hasilBakteriologis}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Regimen OAT:</span>
                    <p className="font-semibold text-slate-800">{patient.regimenOAT}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Perkiraan Selesai:</span>
                    <p className="font-semibold text-slate-800">{patient.perkiraanSelesai}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Petugas Penanggung Jawab:</span>
                  <p className="font-semibold text-slate-800">{patient.petugasPenanggungJawab} ({patient.fasyankes})</p>
                </div>

                <div>
                  <span className="text-slate-400">Catatan Klinis:</span>
                  <p className="text-slate-600 bg-[#FDF5EB] p-2 rounded-xl mt-1">{patient.catatanKlinis}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block">Status Pencatatan SITB Kemenkes:</span>
                    <span className="font-bold text-[#1C5456]">
                      {patient.sitbRecorded
                        ? `Sudah dicatat (${patient.sitbRecordedDate || '-'} oleh ${patient.sitbRecordedBy || 'Petugas'})`
                        : 'Belum ditandai sudah dicatat di SITB'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSitbRecordedPatient(patient.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all shrink-0 ${
                      patient.sitbRecorded
                        ? 'bg-[#D1E6D9] text-[#193F35] hover:bg-[#6BAE9D]/40'
                        : 'bg-[#F9D059] text-[#193F35] hover:bg-[#FCB775]'
                    }`}
                  >
                    {patient.sitbRecorded ? 'SITB: Ya (Ubah)' : 'Tandai Sudah di SITB'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICATION PICKUP */}
          {activeTab === 'medication' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#FBE6C9] flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Jadwal Ambil Obat Berikutnya:</span>
                  <h4 className="font-mono font-black text-lg text-[#1C5456]">{patient.jadwalAmbilObatBerikutnya}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Kepatuhan Berobat:</span>
                  <p className="font-bold text-xs text-[#58904A]">{patient.kepatuhanMinumObat}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#FBE6C9] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAEEE0] text-[#1C5456] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal Jadwal</th>
                      <th className="py-2.5 px-3">Tanggal Ambil</th>
                      <th className="py-2.5 px-3">Jumlah Obat</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Petugas</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientPickups.map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono font-medium">{p.tanggalJadwal}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.tanggalRealisasi || '-'}</td>
                        <td className="py-2.5 px-3">{p.jumlahObatHari} hari ({p.namaObat})</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Tepat Waktu' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'Terlambat' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{p.petugas}</td>
                        <td className="py-2.5 px-3 text-center">
                          {p.status !== 'Tepat Waktu' && (
                            <button
                              onClick={() => recordPickup(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#35907D] text-white text-[10px] font-bold hover:bg-[#1C5456] cursor-pointer"
                            >
                              Catat Ambil
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOWUP BULANAN */}
          {activeTab === 'followup' && (
            <div className="space-y-3">
              {patientFollowups.map(f => (
                <div key={f.id} className="p-4 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="font-bold text-[#1C5456]">Bulan Pengobatan Ke-{f.bulanPengobatanKe} ({f.tanggalFollowup})</span>
                    <span className="font-mono text-slate-600">BB: {f.beratBadanKg} kg · Kepatuhan: {f.kepatuhan}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Hasil Dahak Evaluasi:</span>
                      <p className="font-bold text-[#35907D]">{f.hasilPemeriksaanDahak || 'Tidak Diperiksa'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Petugas Pemeriksa:</span>
                      <p className="font-semibold text-slate-800">{f.petugas}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-[#FDF5EB] p-2 rounded-xl">
                    <strong>Rencana Tindak Lanjut:</strong> {f.rencanaTindakLanjut}
                  </p>
                </div>
              ))}

              {patientFollowups.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-[#FBE6C9]">
                  Belum ada catatan follow-up bulanan.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KUNJUNGAN RUMAH */}
          {activeTab === 'homevisit' && (
            <div className="space-y-3">
              {patientHomeVisits.map(h => (
                <div key={h.id} className="p-4 rounded-2xl bg-white border border-[#FBE6C9] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C5456]">{h.tujuan} ({h.tanggalKunjungan})</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#D1E6D9] text-[#193F35] font-bold text-[10px]">{h.status}</span>
                  </div>
                  <p className="text-slate-600">{h.hasilKunjungan}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Petugas: {h.petugas}</span>
                    <span>Tindak Lanjut: {h.rencanaTindakLanjut}</span>
                  </div>
                </div>
              ))}

              {patientHomeVisits.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-[#FBE6C9]">
                  Belum ada jadwal atau riwayat kunjungan rumah untuk keluarga ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              {patientWa.map(w => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-white border border-[#FBE6C9] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C5456]">{w.templateType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{w.waktuKirim}</span>
                  </div>
                  <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-sans">
                    "{w.pesanTeks}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Status: <strong className="text-emerald-700">{w.statusKirim}</strong></span>
                    <span>Dikirim oleh: {w.petugas}</span>
                  </div>
                </div>
              ))}

              {patientWa.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-[#FBE6C9]">
                  Belum ada log pesan WhatsApp yang dikirimkan.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Kerahasiaan data medis dilindungi UU PDP No. 27 Tahun 2022.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

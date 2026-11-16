import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Users, 
  FileSpreadsheet, 
  Upload,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { SitbImportModal } from '../modals/SitbImportModal';

interface PatientsViewProps {
  onOpenAddPatient: () => void;
  onOpenPatientDetail: (patientId: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({ 
  onOpenAddPatient, 
  onOpenPatientDetail 
}) => {
  const { patients, deletePatient, getPatientSummary, searchQuery, toggleSitbRecordedPatient } = useData();

  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [sitbFilter, setSitbFilter] = useState<'Semua' | 'Sudah' | 'Belum'>('Semua');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Combined search and filtering
  const activeSearch = (searchQuery || localSearch).toLowerCase();

  const filteredPatients = patients.filter(p => {
    const matchesKelurahan = selectedKelurahan === 'Semua' || p.kelurahan === selectedKelurahan;
    const matchesStatus = selectedStatus === 'Semua' || p.statusPengobatan === selectedStatus;
    const matchesSitb =
      sitbFilter === 'Semua' ||
      (sitbFilter === 'Sudah' && !!p.sitbRecorded) ||
      (sitbFilter === 'Belum' && !p.sitbRecorded);
    const matchesSearch = !activeSearch || (
      p.namaLengkap.toLowerCase().includes(activeSearch) ||
      p.id.toLowerCase().includes(activeSearch) ||
      p.nomorRegisterSitb.toLowerCase().includes(activeSearch) ||
      p.noRekamMedis.toLowerCase().includes(activeSearch) ||
      p.kelurahan.toLowerCase().includes(activeSearch) ||
      p.alamat.toLowerCase().includes(activeSearch) ||
      p.noWhatsApp.includes(activeSearch)
    );
    return matchesKelurahan && matchesStatus && matchesSitb && matchesSearch;
  });

  const unrecordedSitbCount = patients.filter(p => !p.sitbRecorded).length;

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pasien ${name} (${id})? Seluruh riwayat akan dicatat di log audit.`)) {
      deletePatient(id);
    }
  };

  const exportToExcel = () => {
    const exportRows = filteredPatients.map(p => ({
      'ID TEMAN TPT': p.id,
      'Nomor Register SITB': p.nomorRegisterSitb,
      'Sudah Dicatat di SITB': p.sitbRecorded ? 'Ya' : 'Belum',
      'Tgl Catat SITB': p.sitbRecordedDate || '-',
      'No Rekam Medis': p.noRekamMedis,
      'Nama Lengkap': p.namaLengkap,
      'Umur': p.umur,
      'JK': p.jenisKelamin,
      'Kelurahan': p.kelurahan,
      'No WhatsApp': p.noWhatsApp,
      'Klasifikasi': p.klasifikasi,
      'Bakteriologis': p.hasilBakteriologis,
      'Tgl Mulai OAT': p.tanggalMulaiOAT,
      'Status Pengobatan': p.statusPengobatan,
      'Fase Pengobatan': p.fasePengobatan
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pasien_TB_Pauh');
    XLSX.writeFile(wb, `Rekap_Pasien_TB_Puskesmas_Pauh_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Data Pasien Tuberkulosis (TB) Aktif</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#35907D]/10 text-[#35907D] font-bold">
              {filteredPatients.length} Pasien
            </span>
            {unrecordedSitbCount > 0 && (
              <button
                onClick={() => setSitbFilter(sitbFilter === 'Belum' ? 'Semua' : 'Belum')}
                className="text-xs px-2.5 py-0.5 rounded-full bg-[#F9D059] text-[#193F35] font-bold hover:opacity-90 cursor-pointer"
                title="Klik untuk memfilter pasien yang belum dicatat di SITB"
              >
                {unrecordedSitbCount} Belum Dicatat di SITB
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data ringkas pasien indeks TB sebagai titik awal pelacakan kontak erat, skrining, TPT, dan pengingat WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C5456] hover:bg-[#193F35] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#F9D059]" />
            <span>Impor dari SITB</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#35907D] text-[#35907D] hover:bg-[#35907D]/10 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={onOpenAddPatient}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pasien</span>
          </button>
        </div>
      </div>

      {/* SITB Dual-System Integration Clarification Banner */}
      <div className="bg-[#D1E6D9]/55 border border-[#6BAE9D]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#193F35]">
        <div className="w-8 h-8 rounded-xl bg-[#1C5456] text-[#F9D059] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[#1C5456]">
            Prinsip Integrasi SITB Kemenkes — Bebas Input Ganda:
          </p>
          <p className="leading-relaxed text-[#193F35]/90">
            <strong>SITB</strong> tetap menjadi sistem pencatatan resmi Kemenkes RI. <strong>TEMAN TPT</strong> adalah alat kerja lapangan Puskesmas Pauh untuk mengawal kontak erat, skrining, TPT, dan pengingat WhatsApp. Gunakan <strong>Nomor Register SITB</strong> sebagai penghubung dan fitur <strong>Impor dari SITB</strong> untuk menarik file Excel/CSV hasil ekspor SITB secara praktis.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9]">
        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Cari Pasien / No. SITB:</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Nama, No. SITB, RM, ID..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#FBE6C9] rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Wilayah Kelurahan:</label>
          <select
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Kelurahan (9 Wilayah)</option>
            {PUSKESMAS_KELURAHAN.map(kel => (
              <option key={kel} value={kel}>{kel}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Status Pengobatan OAT:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Sedang Berobat">Sedang Berobat</option>
            <option value="Sembuh">Sembuh</option>
            <option value="Pengobatan Lengkap">Pengobatan Lengkap</option>
            <option value="Putus Berobat">Putus Berobat (LTFU)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Status Pencatatan SITB:</label>
          <select
            value={sitbFilter}
            onChange={(e) => setSitbFilter(e.target.value as 'Semua' | 'Sudah' | 'Belum')}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Status SITB</option>
            <option value="Sudah">Sudah dicatat di SITB (Ya)</option>
            <option value="Belum">Belum dicatat di SITB</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C5456] text-white font-heading font-semibold text-[11px]">
                <th className="py-3 px-4">No. Register SITB & ID</th>
                <th className="py-3 px-4">Nama Pasien & Umur</th>
                <th className="py-3 px-4">Kelurahan & Alamat</th>
                <th className="py-3 px-4">Fase & Status OAT</th>
                <th className="py-3 px-4 text-center">Dicatat di SITB</th>
                <th className="py-3 px-4 text-center">Integrasi Kontak Erat</th>
                <th className="py-3 px-4 text-center">Jadwal Obat</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const summary = getPatientSummary(patient.id);
                const isOverdue = patient.pernahTerlambat || patient.sisaObatHari === 0;

                return (
                  <tr key={patient.id} className="hover:bg-[#FDF5EB]/60 transition-colors">
                    {/* No Register SITB & ID */}
                    <td className="py-3 px-4">
                      <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1C5456]/10 text-[#1C5456] mb-1">
                        {patient.nomorRegisterSitb || 'Belum Ada No. SITB'}
                      </span>
                      <div className="text-[11px] font-mono font-semibold text-slate-700">{patient.id}</div>
                      <p className="text-[10px] text-slate-500 font-mono">RM: {patient.noRekamMedis}</p>
                    </td>

                    {/* Nama & Umur */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${patient.jenisKelamin === 'L' ? 'bg-[#D1E6D9] text-[#193F35]' : 'bg-[#FBE6C9] text-[#CE5924]'}`}>
                          {patient.jenisKelamin}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{patient.namaLengkap}</span>
                          <p className="text-[10px] text-slate-500">{patient.umur} th · NIK: {patient.nik.slice(0, 6)}******{patient.nik.slice(-2)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Kelurahan */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{patient.kelurahan}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{patient.alamat}</p>
                    </td>

                    {/* Status Pengobatan */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        patient.statusPengobatan === 'Sedang Berobat' ? 'bg-[#D1E6D9] text-[#193F35]' :
                        patient.statusPengobatan === 'Sembuh' || patient.statusPengobatan === 'Pengobatan Lengkap' ? 'bg-[#58904A] text-white' :
                        'bg-[#CE5924] text-white'
                      }`}>
                        {patient.statusPengobatan}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {patient.klasifikasi} · {patient.fasePengobatan}
                      </p>
                    </td>

                    {/* Penanda Sudah Dicatat di SITB */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSitbRecordedPatient(patient.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          patient.sitbRecorded
                            ? 'bg-[#D1E6D9] text-[#193F35] hover:bg-[#6BAE9D]/40'
                            : 'bg-[#F9D059] text-[#193F35] hover:bg-[#FCB775]'
                        }`}
                        title="Klik untuk mengubah status pencatatan di SITB Kemenkes"
                      >
                        {patient.sitbRecorded ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#58904A]" />
                            <span>SITB: Ya</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-[#CE5924]" />
                            <span>SITB: Belum</span>
                          </>
                        )}
                      </button>
                      {patient.sitbRecorded && patient.sitbRecordedDate && (
                        <p className="text-[9px] text-slate-500 mt-1">
                          {patient.sitbRecordedDate}
                        </p>
                      )}
                    </td>

                    {/* Kontak Erat Integration Badge */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1 bg-[#FAEEE0] p-1.5 rounded-xl border border-[#FBE6C9]">
                        <div className="flex items-center gap-1 text-xs font-bold text-[#1C5456]">
                          <Users className="w-3.5 h-3.5 text-[#35907D]" />
                          <span>{summary.totalContacts} Kontak</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-[#58904A] font-semibold" title="Sudah diskrining">{summary.screenedCount} Skrining</span>
                          <span>·</span>
                          <span className="text-[#35907D] font-bold" title="Mulai TPT">{summary.tptStartedCount} TPT</span>
                          {summary.unscreenedCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-[#CE5924] font-bold" title="Belum diskrining">!{summary.unscreenedCount}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Jadwal Ambil Obat */}
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono text-[11px] font-bold ${isOverdue ? 'text-[#CE5924]' : 'text-slate-800'}`}>
                        {patient.jadwalAmbilObatBerikutnya}
                      </span>
                      <p className={`text-[10px] ${isOverdue ? 'text-[#CE5924] font-bold' : 'text-slate-500'}`}>
                        {patient.sisaObatHari > 0 ? `Sisa ${patient.sisaObatHari} hari` : 'Habis / Lewat'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPatientDetail(patient.id)}
                          className="p-1.5 rounded-lg bg-[#35907D]/10 text-[#35907D] hover:bg-[#35907D] hover:text-white transition-colors cursor-pointer"
                          title="Lihat Detail & Kontak Erat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(patient.id, patient.namaLengkap)}
                          className="p-1.5 rounded-lg bg-[#CE5924]/10 text-[#CE5924] hover:bg-[#CE5924] hover:text-white transition-colors cursor-pointer"
                          title="Hapus Data Pasien"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data pasien yang cocok dengan filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian, pilihan kelurahan, atau filter SITB.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SITB Import Modal */}
      <SitbImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};


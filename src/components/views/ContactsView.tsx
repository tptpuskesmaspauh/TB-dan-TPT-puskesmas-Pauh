import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  Stethoscope, 
  ShieldCheck, 
  Phone, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  Upload,
  Link2,
  GitMerge
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ContactStatus } from '../../types/tb';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { LegacyTptImportModal } from '../modals/LegacyTptImportModal';
import { LinkPatientModal } from '../modals/LinkPatientModal';
import { MergeDuplicateContactsModal, findDuplicateContactPairs } from '../modals/MergeDuplicateContactsModal';

interface ContactsViewProps {
  onOpenAddContact: () => void;
  onOpenScreeningModal: (contactId: string) => void;
  onOpenTptModal: (contactId: string) => void;
  onOpenPatientDetail: (patientId: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  onOpenAddContact,
  onOpenScreeningModal,
  onOpenTptModal,
  onOpenPatientDetail
}) => {
  const { contacts, deleteContact, searchQuery, toggleSitbRecordedContact } = useData();

  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('Semua');
  const [sitbFilter, setSitbFilter] = useState<'Semua' | 'Sudah' | 'Belum'>('Semua');
  const [sourceFilter, setSourceFilter] = useState<'Semua' | 'input_langsung' | 'impor_data_lama'>('Semua');
  const [localSearch, setLocalSearch] = useState('');

  const [showLegacyImport, setShowLegacyImport] = useState(false);
  const [linkModalContactId, setLinkModalContactId] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const duplicatePairs = useMemo(() => findDuplicateContactPairs(contacts), [contacts]);

  const activeSearch = (searchQuery || localSearch).toLowerCase();

  const filteredContacts = contacts.filter(c => {
    const matchesStatus = selectedStatus === 'Semua' || c.status === selectedStatus;
    const matchesKelurahan = selectedKelurahan === 'Semua' || c.kelurahan === selectedKelurahan;
    const matchesSitb =
      sitbFilter === 'Semua' ||
      (sitbFilter === 'Sudah' && !!c.sitbRecorded) ||
      (sitbFilter === 'Belum' && !c.sitbRecorded);
    const effectiveSource = c.sumberData || 'input_langsung';
    const matchesSource = sourceFilter === 'Semua' || effectiveSource === sourceFilter;
    const matchesSearch = !activeSearch || (
      c.namaLengkap.toLowerCase().includes(activeSearch) ||
      c.id.toLowerCase().includes(activeSearch) ||
      (c.patientName || '').toLowerCase().includes(activeSearch) ||
      c.kelurahan.toLowerCase().includes(activeSearch) ||
      c.noWhatsApp.includes(activeSearch)
    );
    return matchesStatus && matchesKelurahan && matchesSitb && matchesSource && matchesSearch;
  });

  const unrecordedContactsCount = contacts.filter(c => !c.sitbRecorded).length;
  const unlinkedContactsCount = contacts.filter(c => !c.patientId).length;

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'Pasien indeks belum terhubung':
        return 'bg-slate-200 text-slate-700';
      case 'TPT selesai':
        return 'bg-[#58904A] text-white';
      case 'Sedang menjalani TPT':
        return 'bg-[#35907D] text-white';
      case 'Memenuhi kriteria TPT':
        return 'bg-[#92B060] text-white';
      case 'Menunggu keputusan petugas':
      case 'Sedang menjalani pemeriksaan':
        return 'bg-[#F9D059] text-[#193F35] font-bold';
      case 'Belum diskrining':
      case 'TPT belum dimulai':
      case 'Belum diperiksa lebih lanjut':
        return 'bg-[#CE5924] text-white';
      case 'Tidak memenuhi kriteria TPT':
      case 'TPT dihentikan/putus tindak lanjut':
        return 'bg-slate-300 text-slate-800';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  const exportCSV = () => {
    const headers = ['ID Kontak,Nama Lengkap,Umur,JK,Hubungan,Pasien Indeks,Sumber Data,Kategori Sasaran,Kelurahan,No WA,Status,Sudah Skrining,Regimen TPT,Dicatat di SITB'];
    const rows = filteredContacts.map(c => 
      `"${c.id}","${c.namaLengkap}","${c.umur}","${c.jenisKelamin}","${c.hubunganDenganPasien}","${c.patientName || 'Pasien indeks belum terhubung'}","${c.sumberData === 'impor_data_lama' ? 'Impor Data Lama' : 'Input Langsung'}","${c.kategoriSasaranTPT || '-'}","${c.kelurahan}","${c.noWhatsApp}","${c.status}","${c.dataSkriningTidakTersedia ? 'Tidak ada data' : c.sudahDiskrining ? 'Ya' : 'Belum'}","${c.regimenTPT || '-'}","${c.sitbRecorded ? 'Ya' : 'Belum'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Kontak_Erat_Puskesmas_Pauh_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Data Kontak Erat &amp; Sasaran TPT</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#35907D]/10 text-[#35907D] font-bold">
              {filteredContacts.length} Data
            </span>
            {unlinkedContactsCount > 0 && (
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Pasien indeks belum terhubung' ? 'Semua' : 'Pasien indeks belum terhubung')}
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 cursor-pointer"
                title="Data TPT lama tanpa pasien indeks"
              >
                {unlinkedContactsCount} Belum Terhubung Indeks
              </button>
            )}
            {unrecordedContactsCount > 0 && (
              <button
                onClick={() => setSitbFilter(sitbFilter === 'Belum' ? 'Semua' : 'Belum')}
                className="text-xs px-2.5 py-0.5 rounded-full bg-[#F9D059] text-[#193F35] font-bold hover:opacity-90 cursor-pointer"
                title="Klik untuk memfilter kontak yang belum dicatat ke SITB"
              >
                {unrecordedContactsCount} Belum di SITB
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mencakup kontak erat serumah yang terhubung pasien TB aktif serta data TPT lama tanpa pasien indeks (warna abu-abu = data memang tidak tersedia).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowMergeModal(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              duplicatePairs.length > 0
                ? 'bg-[#F9D059] text-[#193F35] hover:bg-[#FCB775]'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>Duplikat ({duplicatePairs.length})</span>
          </button>

          <button
            onClick={() => setShowLegacyImport(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C5456] hover:bg-[#193F35] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#F9D059]" />
            <span>Impor Data TPT Lama</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#35907D] text-[#35907D] hover:bg-[#35907D]/10 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={onOpenAddContact}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Kontak</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9]">
        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Cari Kontak / Pasien:</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Nama kontak, ID, pasien indeks..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#FBE6C9] rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Status Kontak / TPT:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Pasien indeks belum terhubung">Pasien indeks belum terhubung</option>
            <option value="Belum diskrining">1. Belum diskrining</option>
            <option value="Sudah diskrining">2. Sudah diskrining</option>
            <option value="Belum diperiksa lebih lanjut">3. Belum diperiksa lebih lanjut</option>
            <option value="Sedang menjalani pemeriksaan">4. Sedang menjalani pemeriksaan</option>
            <option value="Memenuhi kriteria TPT">5. Memenuhi kriteria TPT</option>
            <option value="Tidak memenuhi kriteria TPT">6. Tidak memenuhi kriteria TPT</option>
            <option value="Menunggu keputusan petugas">7. Menunggu keputusan petugas</option>
            <option value="TPT belum dimulai">8. TPT belum dimulai</option>
            <option value="Sedang menjalani TPT">9. Sedang menjalani TPT</option>
            <option value="TPT selesai">10. TPT selesai</option>
            <option value="TPT dihentikan/putus tindak lanjut">11. TPT dihentikan/putus</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Kelurahan:</label>
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
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Sumber Data:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'Semua' | 'input_langsung' | 'impor_data_lama')}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Sumber Data</option>
            <option value="input_langsung">Input Langsung</option>
            <option value="impor_data_lama">Impor Data Lama (TPT)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1C5456] mb-1">Status SITB:</label>
          <select
            value={sitbFilter}
            onChange={(e) => setSitbFilter(e.target.value as 'Semua' | 'Sudah' | 'Belum')}
            className="w-full bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D] cursor-pointer"
          >
            <option value="Semua">Semua Status SITB</option>
            <option value="Sudah">Sudah di SITB (Ya)</option>
            <option value="Belum">Belum di SITB</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C5456] text-white font-heading font-semibold text-[11px]">
                <th className="py-3 px-4">ID, Nama &amp; Sumber</th>
                <th className="py-3 px-4">Hubungan &amp; Sasaran</th>
                <th className="py-3 px-4">Terhubung Pasien Indeks</th>
                <th className="py-3 px-4">Kelurahan</th>
                <th className="py-3 px-4">Status &amp; Alur TPT</th>
                <th className="py-3 px-4 text-center">Dicatat di SITB</th>
                <th className="py-3 px-4">Hasil Skrining</th>
                <th className="py-3 px-4 text-center">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => {
                const isUnlinked = !contact.patientId;
                return (
                  <tr key={contact.id} className="hover:bg-[#FDF5EB]/60 transition-colors">
                    {/* ID, Nama & Sumber */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{contact.id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          contact.sumberData === 'impor_data_lama'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-[#D1E6D9] text-[#193F35]'
                        }`}>
                          {contact.sumberData === 'impor_data_lama' ? 'Data Lama' : 'Input Langsung'}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{contact.namaLengkap}</span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        WA: {contact.noWhatsApp || <span className="text-slate-400">Tidak ada data</span>}
                      </p>
                    </td>

                    {/* Hubungan & Sasaran */}
                    <td className="py-3 px-4">
                      {contact.hubunganDenganPasien === 'Tidak ada data' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          Tidak ada data
                        </span>
                      ) : (
                        <span className="font-semibold text-[#1C5456]">{contact.hubunganDenganPasien}</span>
                      )}
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {contact.umur > 0 ? `${contact.umur} th` : 'Umur: -'} ({contact.jenisKelamin})
                      </p>
                      {contact.kategoriSasaranTPT && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-[#FAEEE0] text-[#1C5456] border border-[#FBE6C9]">
                          {contact.kategoriSasaranTPT}
                        </span>
                      )}
                    </td>

                    {/* Pasien Indeks TB */}
                    <td className="py-3 px-4">
                      {isUnlinked ? (
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Pasien indeks belum terhubung
                          </span>
                          <button
                            onClick={() => setLinkModalContactId(contact.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#CE5924] hover:underline cursor-pointer"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Hubungkan ke Pasien</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => contact.patientId && onOpenPatientDetail(contact.patientId)}
                            className="font-bold text-[#35907D] hover:underline flex items-center gap-1 text-left cursor-pointer"
                            title="Klik untuk buka profil pasien indeks"
                          >
                            <span>{contact.patientName}</span>
                            <ExternalLink className="w-3 h-3 text-[#35907D] shrink-0" />
                          </button>
                          <span className="text-[10px] font-mono text-slate-400">{contact.patientId}</span>
                        </>
                      )}
                    </td>

                    {/* Kelurahan */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{contact.kelurahan}</span>
                    </td>

                    {/* Status Badges */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                      {contact.legacyTptStatus && isUnlinked && (
                        <p className="text-[10px] text-slate-600 mt-1">TPT: <strong>{contact.legacyTptStatus}</strong></p>
                      )}
                      {contact.regimenTPT && (
                        <p className="text-[10px] text-slate-600 mt-0.5 font-mono">Regimen: {contact.regimenTPT.split(' ')[0]}</p>
                      )}
                    </td>

                    {/* Penanda SITB */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSitbRecordedContact(contact.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          contact.sitbRecorded
                            ? 'bg-[#D1E6D9] text-[#193F35] hover:bg-[#6BAE9D]/40'
                            : 'bg-[#F9D059] text-[#193F35] hover:bg-[#FCB775]'
                        }`}
                        title="Klik untuk menandai apakah kontak/TPT ini sudah diinput ke SITB"
                      >
                        {contact.sitbRecorded ? (
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
                      {contact.sitbRecorded && contact.sitbRecordedDate && (
                        <p className="text-[9px] text-slate-500 mt-1">{contact.sitbRecordedDate}</p>
                      )}
                    </td>

                    {/* Skrining / Evaluasi — WARNA ABU-ABU jika memang tidak ada data */}
                    <td className="py-3 px-4">
                      {contact.sudahDiskrining ? (
                        <div>
                          <span className="text-[#58904A] font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {contact.penilaianSkrining || 'Tidak Bergejala'}
                          </span>
                          <p className="text-[10px] text-slate-500">Skrining: {contact.tanggalSkrining}</p>
                        </div>
                      ) : contact.dataSkriningTidakTersedia ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold text-[10px]">
                          Tidak ada data skrining
                        </span>
                      ) : (
                        <span className="text-[#CE5924] font-bold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Belum Diskrining
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isUnlinked ? (
                          <button
                            onClick={() => setLinkModalContactId(contact.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#1C5456] hover:bg-[#193F35] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Hubungkan ke Pasien Indeks TB"
                          >
                            <Link2 className="w-3.5 h-3.5 text-[#F9D059]" />
                            <span>Hubungkan</span>
                          </button>
                        ) : !contact.sudahDiskrining ? (
                          <button
                            onClick={() => onOpenScreeningModal(contact.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#CE5924] hover:bg-[#D77252] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Lakukan Skrining Gejala TB"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Skrining</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenTptModal(contact.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#35907D] hover:bg-[#1C5456] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Evaluasi dan Keputusan TPT"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>TPT</span>
                          </button>
                        )}

                        {contact.noWhatsApp && (
                          <a
                            href={`https://wa.me/62${contact.noWhatsApp.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#58904A] text-white hover:bg-[#35907D] transition-all cursor-pointer"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Hapus data kontak erat ${contact.namaLengkap}?`)) {
                              deleteContact(contact.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#CE5924]/10 text-[#CE5924] hover:bg-[#CE5924] hover:text-white transition-all cursor-pointer"
                          title="Hapus Kontak Erat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada kontak erat yang cocok dengan filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy TPT Import, Link Patient & Merge Duplicate Modals */}
      <LegacyTptImportModal
        isOpen={showLegacyImport}
        onClose={() => setShowLegacyImport(false)}
      />

      <LinkPatientModal
        contactId={linkModalContactId}
        onClose={() => setLinkModalContactId(null)}
      />

      <MergeDuplicateContactsModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
      />
    </div>
  );
};



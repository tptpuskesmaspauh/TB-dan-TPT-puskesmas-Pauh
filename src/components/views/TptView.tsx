import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  Upload,
  Link2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { LegacyTptImportModal } from '../modals/LegacyTptImportModal';
import { LinkPatientModal } from '../modals/LinkPatientModal';

interface TptViewProps {
  onOpenTptModal: (contactId: string) => void;
  onOpenPatientDetail: (patientId: string) => void;
}

export const TptView: React.FC<TptViewProps> = ({ onOpenTptModal, onOpenPatientDetail }) => {
  const { contacts, searchQuery, updateContact, toggleSitbRecordedContact } = useData();

  const [tptTab, setTptTab] = useState<'all' | 'in_progress' | 'eligible_not_started' | 'waiting' | 'completed' | 'legacy_unlinked'>('in_progress');
  const [onlyUnrecordedSitb, setOnlyUnrecordedSitb] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [showLegacyImport, setShowLegacyImport] = useState(false);
  const [linkModalContactId, setLinkModalContactId] = useState<string | null>(null);

  const activeSearch = (searchQuery || localSearch).toLowerCase();

  // Metrics
  const inProgressList = contacts.filter(c => c.status === 'Sedang menjalani TPT' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'Sedang menjalani TPT'));
  const eligibleNotStartedList = contacts.filter(c => c.status === 'TPT belum dimulai');
  const waitingList = contacts.filter(c => c.status === 'Menunggu keputusan petugas');
  const completedList = contacts.filter(c => c.status === 'TPT selesai' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'TPT selesai'));
  const unlinkedLegacyList = contacts.filter(c => !c.patientId);

  const filteredContacts = contacts.filter(c => {
    let matchesTab = true;
    if (tptTab === 'in_progress') matchesTab = c.status === 'Sedang menjalani TPT' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'Sedang menjalani TPT');
    if (tptTab === 'eligible_not_started') matchesTab = c.status === 'TPT belum dimulai';
    if (tptTab === 'waiting') matchesTab = c.status === 'Menunggu keputusan petugas';
    if (tptTab === 'completed') matchesTab = c.status === 'TPT selesai' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'TPT selesai');
    if (tptTab === 'legacy_unlinked') matchesTab = !c.patientId;

    const matchesSitb = !onlyUnrecordedSitb || !c.sitbRecorded;

    const matchesSearch = !activeSearch || (
      c.namaLengkap.toLowerCase().includes(activeSearch) ||
      (c.patientName || '').toLowerCase().includes(activeSearch) ||
      c.kelurahan.toLowerCase().includes(activeSearch) ||
      (c.regimenTPT && c.regimenTPT.toLowerCase().includes(activeSearch))
    );

    return matchesTab && matchesSitb && matchesSearch;
  });

  const handleMarkCompleted = (contactId: string) => {
    if (confirm('Tandai bahwa penerima TPT ini telah MENYELESAIKAN seluruh rangkaian dosis TPT dengan sukses?')) {
      const target = contacts.find(c => c.id === contactId);
      updateContact(contactId, {
        status: target?.patientId ? 'TPT selesai' : 'Pasien indeks belum terhubung',
        legacyTptStatus: 'TPT selesai',
        statusAkhirTPT: 'Selesai Sesuai Jadwal',
        tanggalSelesaiTPT: new Date().toISOString().slice(0, 10)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Terapi Pencegahan Tuberkulosis (TPT)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#58904A] text-white font-bold">
              {inProgressList.length} Sedang Minum TPT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pencegahan TB laten, pelaporan SITB, serta pengelolaan data TPT lama tanpa pasien indeks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLegacyImport(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C5456] hover:bg-[#193F35] text-white text-xs font-bold cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#F9D059]" />
            <span>Impor Data TPT Lama</span>
          </button>

          <span className="text-xs bg-[#D1E6D9] text-[#193F35] border border-[#6BAE9D]/40 px-3 py-1.5 rounded-xl font-bold">
            {completedList.length} Selesai Tuntas
          </span>
        </div>
      </div>

      {/* 5-Step Pipeline Strip */}
      <div className="bg-gradient-to-r from-[#1C5456] to-[#35907D] p-4 rounded-2xl text-white text-xs">
        <p className="font-bold uppercase tracking-wider text-[#F9D059] text-[10px] mb-2">Alur Standar Terapi Pencegahan TB (TPT):</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2 rounded-xl bg-white/10">
            <span className="font-bold block text-[#F9D059]">1. Skrining TB</span>
            <span className="text-[10px] opacity-80">Pastikan tidak bergejala</span>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="font-bold block text-[#F9D059]">2. Evaluasi Klinis</span>
            <span className="text-[10px] opacity-80">Rontgen / Mantoux bila ada indikasi</span>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="font-bold block text-[#F9D059]">3. Keputusan Nakes</span>
            <span className="text-[10px] opacity-80">Dokter tentukan kelayakan &amp; regimen</span>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="font-bold block text-[#F9D059]">4. Minum TPT</span>
            <span className="text-[10px] opacity-80">Regimen 3HP (12 Dosis) / 6H</span>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="font-bold block text-[#F9D059]">5. TPT Selesai</span>
            <span className="text-[10px] opacity-80">Keluarga terlindungi seumur hidup</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        <button
          onClick={() => setTptTab('in_progress')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'in_progress' ? 'bg-[#35907D] text-white shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>Sedang TPT ({inProgressList.length})</span>
        </button>

        <button
          onClick={() => setTptTab('eligible_not_started')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'eligible_not_started' ? 'bg-[#D77252] text-white shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>Belum Mulai ({eligibleNotStartedList.length})</span>
        </button>

        <button
          onClick={() => setTptTab('waiting')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'waiting' ? 'bg-[#F9D059] text-[#193F35] shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>Menunggu Nakes ({waitingList.length})</span>
        </button>

        <button
          onClick={() => setTptTab('completed')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'completed' ? 'bg-[#58904A] text-white shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>TPT Selesai ({completedList.length})</span>
        </button>

        <button
          onClick={() => setTptTab('legacy_unlinked')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'legacy_unlinked' ? 'bg-slate-600 text-white shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>Data Lama ({unlinkedLegacyList.length})</span>
        </button>

        <button
          onClick={() => setTptTab('all')}
          className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${tptTab === 'all' ? 'bg-[#1C5456] text-white shadow-xs' : 'bg-white border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'}`}
        >
          <span>Semua Data</span>
        </button>
      </div>

      {/* Search & SITB Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAEEE0] p-3.5 rounded-2xl border border-[#FBE6C9]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Cari nama kontak, pasien indeks, kelurahan, atau regimen..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#FBE6C9] rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-bold text-[#1C5456] cursor-pointer bg-white px-3 py-2 rounded-xl border border-[#FBE6C9]">
          <input
            type="checkbox"
            checked={onlyUnrecordedSitb}
            onChange={(e) => setOnlyUnrecordedSitb(e.target.checked)}
            className="w-4 h-4 accent-[#CE5924] rounded cursor-pointer"
          />
          <span>Hanya Tampilkan yang Belum Dicatat di SITB</span>
        </label>
      </div>

      {/* TPT Data Table */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C5456] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Penerima TPT / Kontak</th>
                <th className="py-3 px-4">Pasien Indeks TB</th>
                <th className="py-3 px-4">Status TPT</th>
                <th className="py-3 px-4">Regimen &amp; Tanggal Mulai</th>
                <th className="py-3 px-4 text-center">Dicatat di SITB</th>
                <th className="py-3 px-4">Kepatuhan &amp; Sumber</th>
                <th className="py-3 px-4">Dokter Penentu</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => {
                const isUnlinked = !contact.patientId;
                const displayTptStatus = isUnlinked && contact.legacyTptStatus ? contact.legacyTptStatus : contact.status;
                return (
                  <tr key={contact.id} className="hover:bg-[#FDF5EB]/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{contact.namaLengkap}</span>
                      <span className="text-[10px] text-slate-500">
                        {contact.umur > 0 ? `${contact.umur} th` : '-'} ({contact.hubunganDenganPasien}) · {contact.kelurahan}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isUnlinked ? (
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Pasien indeks belum terhubung
                          </span>
                          <button
                            onClick={() => setLinkModalContactId(contact.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#CE5924] hover:underline cursor-pointer"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Hubungkan Indeks</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => contact.patientId && onOpenPatientDetail(contact.patientId)}
                          className="font-semibold text-[#35907D] hover:underline cursor-pointer"
                        >
                          {contact.patientName}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        displayTptStatus === 'TPT selesai' ? 'bg-[#D1E6D9] text-[#193F35]' :
                        displayTptStatus === 'Sedang menjalani TPT' ? 'bg-[#35907D] text-white' :
                        displayTptStatus === 'TPT belum dimulai' ? 'bg-[#FBE6C9] text-[#CE5924]' :
                        'bg-[#F9D059] text-[#193F35]'
                      }`}>
                        {displayTptStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{contact.regimenTPT || 'Tidak ada data'}</span>
                      <span className="text-[10px] text-slate-500">Mulai: {contact.tanggalMulaiTPT || '-'}</span>
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
                        title="Klik untuk menandai apakah data TPT kontak ini sudah diinput ke SITB"
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

                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#58904A] block">{contact.kepatuhanTPT || 'Tidak ada data'}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {contact.sumberData === 'impor_data_lama' ? 'Sumber: Data TPT Lama' : contact.efekSampingTPT || 'Tidak ada keluhan'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {contact.nakesPenentu || <span className="text-slate-400">Tidak ada data</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenTptModal(contact.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#35907D] hover:bg-[#1C5456] text-white text-[10px] font-bold transition-all cursor-pointer"
                          title="Evaluasi atau Ubah Status TPT"
                        >
                          Evaluasi Medis
                        </button>

                        {displayTptStatus === 'Sedang menjalani TPT' && (
                          <button
                            onClick={() => handleMarkCompleted(contact.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#58904A] hover:bg-[#35907D] text-white text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Selesai Tuntas"
                          >
                            Selesai Tuntas
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada data pada kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LegacyTptImportModal
        isOpen={showLegacyImport}
        onClose={() => setShowLegacyImport(false)}
      />

      <LinkPatientModal
        contactId={linkModalContactId}
        onClose={() => setLinkModalContactId(null)}
      />
    </div>
  );
};



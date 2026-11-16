import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Phone,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ScreeningViewProps {
  onOpenScreeningModal: (contactId: string) => void;
  onOpenTptModal: (contactId: string) => void;
  onOpenPatientDetail: (patientId: string) => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  onOpenScreeningModal,
  onOpenTptModal,
  onOpenPatientDetail
}) => {
  const { contacts, searchQuery } = useData();

  const [tabFilter, setTabFilter] = useState<'semua' | 'belum' | 'bergejala' | 'aman' | 'tidak_ada'>('semua');
  const [localSearch, setLocalSearch] = useState('');

  const activeSearch = (searchQuery || localSearch).toLowerCase();

  // Metrics (Data TPT lama tanpa skrining dipisahkan agar tidak dihitung merah sebagai belum skrining)
  const contactsWithScreeningExpectation = contacts.filter(c => !c.dataSkriningTidakTersedia || c.sudahDiskrining);
  const total = contactsWithScreeningExpectation.length;
  const belum = contacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia);
  const dataTidakAda = contacts.filter(c => !c.sudahDiskrining && c.dataSkriningTidakTersedia);
  const sudah = contacts.filter(c => c.sudahDiskrining);
  const bergejala = contacts.filter(c => c.sudahDiskrining && c.penilaianSkrining === 'Suspek TB (Bergejala)');
  const aman = contacts.filter(c => c.sudahDiskrining && c.penilaianSkrining === 'Tidak Bergejala (Kandidat Evaluasi TPT)');

  const filteredList = contacts.filter(c => {
    let matchesTab = true;
    if (tabFilter === 'belum') matchesTab = !c.sudahDiskrining && !c.dataSkriningTidakTersedia;
    if (tabFilter === 'bergejala') matchesTab = c.sudahDiskrining && c.penilaianSkrining === 'Suspek TB (Bergejala)';
    if (tabFilter === 'aman') matchesTab = c.sudahDiskrining && c.penilaianSkrining === 'Tidak Bergejala (Kandidat Evaluasi TPT)';
    if (tabFilter === 'tidak_ada') matchesTab = !c.sudahDiskrining && Boolean(c.dataSkriningTidakTersedia);

    const matchesSearch = !activeSearch || (
      c.namaLengkap.toLowerCase().includes(activeSearch) ||
      (c.patientName || '').toLowerCase().includes(activeSearch) ||
      c.kelurahan.toLowerCase().includes(activeSearch)
    );

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Skrining Gejala Tuberkulosis (TB)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F9D059] text-[#193F35] font-bold">
              {belum.length} Belum Diskrining
            </span>
            {dataTidakAda.length > 0 && (
              <button
                onClick={() => setTabFilter(tabFilter === 'tidak_ada' ? 'semua' : 'tidak_ada')}
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer transition-colors"
              >
                {dataTidakAda.length} Data Lama (Tidak Ada Data Skrining)
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penilaian 4 gejala kardinal TB (Batuk, Demam, Keringat Malam, Berat Badan Turun) pada seluruh kontak erat keluarga serumah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 bg-[#FAEEE0] px-3 py-1.5 rounded-xl border border-[#FBE6C9] font-medium">
            Tingkat Skrining: <strong className="text-[#35907D]">{total > 0 ? Math.round((sudah.length / total) * 100) : 0}%</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setTabFilter('semua')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${tabFilter === 'semua' ? 'bg-[#1C5456] text-white shadow-md' : 'bg-white border-[#FBE6C9] hover:bg-[#FDF5EB]'}`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block">Wajib Skrining</span>
          <p className="text-2xl font-black font-mono mt-1">{total}</p>
          <span className="text-[10px] opacity-80 mt-1 block">Terpisah dari {dataTidakAda.length} data lama</span>
        </button>

        <button
          onClick={() => setTabFilter('belum')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${tabFilter === 'belum' ? 'bg-[#CE5924] text-white shadow-md' : 'bg-white border-red-200 hover:bg-red-50/50'}`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Belum Diskrining
          </span>
          <p className="text-2xl font-black font-mono mt-1">{belum.length}</p>
          <span className="text-[10px] opacity-80 mt-1 block">Wajib ditindaklanjuti</span>
        </button>

        <button
          onClick={() => setTabFilter('bergejala')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${tabFilter === 'bergejala' ? 'bg-[#D77252] text-white shadow-md' : 'bg-white border-orange-200 hover:bg-orange-50/50'}`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" /> Suspek TB (Bergejala)
          </span>
          <p className="text-2xl font-black font-mono mt-1">{bergejala.length}</p>
          <span className="text-[10px] opacity-80 mt-1 block">Rujuk TCM Dahak/Rontgen</span>
        </button>

        <button
          onClick={() => setTabFilter('aman')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${tabFilter === 'aman' ? 'bg-[#58904A] text-white shadow-md' : 'bg-white border-emerald-200 hover:bg-emerald-50/50'}`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Tidak Bergejala
          </span>
          <p className="text-2xl font-black font-mono mt-1">{aman.length}</p>
          <span className="text-[10px] opacity-80 mt-1 block">Siap dievaluasi TPT</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Cari nama kontak..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#35907D]"
            />
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan <strong>{filteredList.length}</strong> dari {contacts.length} kontak
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C5456] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Kontak Erat</th>
                <th className="py-3 px-4">Pasien Indeks TB</th>
                <th className="py-3 px-4">Kelurahan</th>
                <th className="py-3 px-4">Status Skrining</th>
                <th className="py-3 px-4">Hasil / Gejala Terdeteksi</th>
                <th className="py-3 px-4 text-center">Aksi Skrining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#FDF5EB]/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{contact.namaLengkap}</span>
                    <span className="text-[10px] text-slate-500">{contact.umur} th, {contact.hubunganDenganPasien}</span>
                  </td>

                  <td className="py-3 px-4">
                    {contact.patientId ? (
                      <>
                        <button
                          onClick={() => onOpenPatientDetail(contact.patientId!)}
                          className="font-medium text-[#35907D] hover:underline block cursor-pointer"
                        >
                          {contact.patientName || 'Pasien Indeks'}
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">{contact.patientId}</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Pasien indeks belum terhubung
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-700">{contact.kelurahan}</td>

                  <td className="py-3 px-4">
                    {contact.sudahDiskrining ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D1E6D9] text-[#193F35]">
                        <CheckCircle2 className="w-3 h-3 text-[#58904A]" /> Sudah ({contact.tanggalSkrining})
                      </span>
                    ) : contact.dataSkriningTidakTersedia ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" /> Tidak ada data (Data Lama)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#CE5924]">
                        <AlertTriangle className="w-3 h-3 text-[#CE5924]" /> Belum Diskrining
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {contact.sudahDiskrining ? (
                      <div>
                        <span className={`font-semibold ${contact.penilaianSkrining === 'Suspek TB (Bergejala)' ? 'text-[#CE5924]' : 'text-[#58904A]'}`}>
                          {contact.penilaianSkrining}
                        </span>
                        {contact.gejalaLainnya && (
                          <p className="text-[10px] text-slate-500">{contact.gejalaLainnya}</p>
                        )}
                      </div>
                    ) : contact.dataSkriningTidakTersedia ? (
                      <span className="text-slate-400 italic">Tidak ada data</span>
                    ) : (
                      <span className="text-slate-400 italic">Menunggu penilaian</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {!contact.sudahDiskrining ? (
                      <button
                        onClick={() => onOpenScreeningModal(contact.id)}
                        className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1 ${
                          contact.dataSkriningTidakTersedia
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'bg-[#CE5924] hover:bg-[#D77252]'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{contact.dataSkriningTidakTersedia ? 'Lengkapi Skrining' : 'Isi Skrining'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenScreeningModal(contact.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold transition-all cursor-pointer"
                        >
                          Ubah Skrining
                        </button>
                        {contact.penilaianSkrining === 'Tidak Bergejala (Kandidat Evaluasi TPT)' && (
                          <button
                            onClick={() => onOpenTptModal(contact.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#35907D] hover:bg-[#1C5456] text-white text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Evaluasi TPT →
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

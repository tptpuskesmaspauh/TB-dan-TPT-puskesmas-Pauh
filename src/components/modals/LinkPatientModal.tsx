import React, { useState } from 'react';
import { X, Link2, Search, UserCheck, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CloseContact } from '../../types/tb';

interface LinkPatientModalProps {
  contactId: string | null;
  onClose: () => void;
}

export const LinkPatientModal: React.FC<LinkPatientModalProps> = ({ contactId, onClose }) => {
  const { contacts, patients, linkContactToPatient } = useData();
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [hubungan, setHubungan] = useState<CloseContact['hubunganDenganPasien']>('Tidak ada data');

  if (!contactId) return null;
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return null;

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.namaLengkap.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.nomorRegisterSitb.toLowerCase().includes(q) ||
      p.kelurahan.toLowerCase().includes(q) ||
      p.alamat.toLowerCase().includes(q)
    );
  });

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Pilih pasien TB indeks terlebih dahulu.');
      return;
    }
    linkContactToPatient(contact.id, selectedPatientId, hubungan);
    setSearch('');
    setSelectedPatientId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#F9D059]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">Hubungkan ke Pasien Indeks TB</h3>
              <p className="text-xs text-[#D1E6D9]">
                Penerima TPT: <strong>{contact.namaLengkap}</strong> ({contact.kelurahan})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1C5456] mb-1">Cari Pasien TB Indeks (Nama, No. SITB, Kelurahan, Alamat):</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama pasien atau kelurahan..."
                className="w-full pl-9 pr-3 py-2 bg-[#FDF5EB] border border-[#FBE6C9] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#35907D]"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 border border-[#FBE6C9] rounded-2xl p-2 bg-[#FDF5EB]/40">
            {filteredPatients.map(p => {
              const isSelected = selectedPatientId === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#D1E6D9] border-[#35907D]'
                      : 'bg-white border-[#FBE6C9] hover:bg-[#FAEEE0]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C5456]">{p.namaLengkap}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1C5456]/10 text-[#1C5456]">
                        {p.nomorRegisterSitb}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.kelurahan} · {p.alamat}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#58904A] shrink-0" />}
                </button>
              );
            })}
            {filteredPatients.length === 0 && (
              <p className="text-center text-slate-400 py-6">Tidak ada pasien yang cocok.</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-[#1C5456] mb-1">Hubungan Dengan Pasien Indeks (Opsional):</label>
            <select
              value={hubungan}
              onChange={(e) => setHubungan(e.target.value as CloseContact['hubunganDenganPasien'])}
              className="w-full p-2.5 rounded-xl border border-[#FBE6C9] bg-white text-xs cursor-pointer"
            >
              <option value="Tidak ada data">Tidak ada data (Isi nanti saat verifikasi)</option>
              <option value="Suami">Suami</option>
              <option value="Istri">Istri</option>
              <option value="Anak">Anak</option>
              <option value="Orang Tua">Orang Tua</option>
              <option value="Saudara Kandung">Saudara Kandung</option>
              <option value="Lainnya (Serumah)">Lainnya (Serumah)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Hubungkan Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

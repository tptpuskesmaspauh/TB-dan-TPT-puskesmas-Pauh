import React, { useState } from 'react';
import { 
  CalendarClock, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Plus, 
  Calendar, 
  UserCheck,
  Phone
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const MonitoringView: React.FC<{ onOpenPatientDetail: (id: string) => void }> = ({ onOpenPatientDetail }) => {
  const { pickups, recordPickup, addPickup, patients } = useData();

  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [showAddPickupModal, setShowAddPickupModal] = useState(false);

  // Add pickup state
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [tanggalJadwal, setTanggalJadwal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlahObatHari, setJumlahObatHari] = useState(30);
  const [namaObat, setNamaObat] = useState('FDC RH 150/75 Fase Lanjutan');

  const filteredPickups = pickups.filter(p => {
    if (filterStatus === 'Semua') return true;
    return p.status === filterStatus;
  });

  const overdueList = pickups.filter(p => p.status === 'Terlambat');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    addPickup({
      patientId,
      patientName: patient.namaLengkap,
      tanggalJadwal,
      jumlahObatHari: Number(jumlahObatHari),
      namaObat,
      status: 'Belum Diambil',
      petugas: 'Petugas Farmasi Puskesmas Pauh'
    });

    setShowAddPickupModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Monitoring Pengobatan & Ambil Obat</h2>
            {overdueList.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> {overdueList.length} Terlambat
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Jadwal kepatuhan pengambilan obat OAT dan TPT untuk mencegah putus berobat (Loss to Follow-up / LTFU).
          </p>
        </div>

        <button
          onClick={() => setShowAddPickupModal(true)}
          className="px-4 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Jadwalkan Ambil Obat Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        {['Semua', 'Terlambat', 'Belum Diambil', 'Tepat Waktu'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === st 
                ? 'bg-[#1C5456] text-white shadow-xs' 
                : 'bg-white border border-[#FBE6C9] text-slate-700 hover:bg-[#FDF5EB]'
            }`}
          >
            {st} {st === 'Terlambat' && overdueList.length > 0 && `(${overdueList.length})`}
          </button>
        ))}
      </div>

      {/* Pickup Schedule Table */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C5456] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Pasien / Kontak</th>
                <th className="py-3 px-4">Tanggal Jadwal</th>
                <th className="py-3 px-4">Tanggal Realisasi</th>
                <th className="py-3 px-4">Jumlah & Jenis Obat</th>
                <th className="py-3 px-4">Status Kepatuhan</th>
                <th className="py-3 px-4">Catatan Petugas</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPickups.map((pickup) => (
                <tr key={pickup.id} className="hover:bg-[#FDF5EB]/50 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenPatientDetail(pickup.patientId)}
                      className="font-bold text-slate-900 hover:text-[#35907D] text-left block"
                    >
                      {pickup.patientName}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">{pickup.patientId}</span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {pickup.tanggalJadwal}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600">
                    {pickup.tanggalRealisasi || '-'}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{pickup.jumlahObatHari} hari</span>
                    <p className="text-[10px] text-slate-500">{pickup.namaObat}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pickup.status === 'Tepat Waktu' ? 'bg-emerald-100 text-emerald-800' :
                      pickup.status === 'Terlambat' ? 'bg-red-100 text-red-800 font-extrabold' :
                      'bg-amber-100 text-amber-900'
                    }`}>
                      {pickup.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {pickup.catatan || '-'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {pickup.status !== 'Tepat Waktu' ? (
                      <button
                        onClick={() => recordPickup(pickup.id, 'Diserahkan langsung di loket obat Puskesmas Pauh')}
                        className="px-3 py-1 rounded-lg bg-[#35907D] hover:bg-[#1C5456] text-white text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Catat Ambil
                      </button>
                    ) : (
                      <span className="text-[#58904A] font-semibold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pickup Modal */}
      {showAddPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#FBE6C9] shadow-2xl space-y-4 text-xs">
            <h3 className="font-heading font-black text-sm text-[#1C5456]">Jadwalkan Pengambilan Obat Baru</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Pasien:</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.namaLengkap} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Jadwal Ambil:</label>
                <input
                  type="date"
                  required
                  value={tanggalJadwal}
                  onChange={(e) => setTanggalJadwal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Obat (Hari):</label>
                <input
                  type="number"
                  value={jumlahObatHari}
                  onChange={(e) => setJumlahObatHari(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama / Sediaan Obat:</label>
                <input
                  type="text"
                  value={namaObat}
                  onChange={(e) => setNamaObat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPickupModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

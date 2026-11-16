import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Users, 
  UserCheck, 
  ShieldCheck 
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';

export const ReportsView: React.FC = () => {
  const { patients, contacts, pickups, followups } = useData();

  const [period, setPeriod] = useState<string>('Tahun 2026');
  const [reportType, setReportType] = useState<string>('rekap_kelurahan');

  const completeContactsAll = contacts.filter(c => Boolean(c.patientId) && c.sumberData !== 'impor_data_lama');
  const legacyContactsAll = contacts.filter(c => !c.patientId || c.sumberData === 'impor_data_lama');

  // Breakdown by 9 Kelurahan
  const kelurahanStats = PUSKESMAS_KELURAHAN.map(kel => {
    const pts = patients.filter(p => p.kelurahan === kel);
    const cts = completeContactsAll.filter(c => c.kelurahan === kel);
    const legacyCts = legacyContactsAll.filter(c => c.kelurahan === kel);
    const screened = cts.filter(c => c.sudahDiskrining).length;
    const tptEligible = cts.filter(c => c.memenuhiKriteriaTPT).length;
    const tptStarted = cts.filter(c => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length;
    const tptComplete = cts.filter(c => c.status === 'TPT selesai').length;

    return {
      kelurahan: kel,
      totalTB: pts.length,
      tbSedangBerobat: pts.filter(p => p.statusPengobatan === 'Sedang Berobat').length,
      tbSembuh: pts.filter(p => p.statusPengobatan === 'Sembuh' || p.statusPengobatan === 'Pengobatan Lengkap').length,
      totalKontak: cts.length,
      kontakDiskrining: screened,
      cakupanSkriningPersen: cts.length > 0 ? Math.round((screened / cts.length) * 100) : 0,
      kandidatTPT: tptEligible,
      tptMulai: tptStarted,
      cakupanTPTPersen: tptEligible > 0 ? Math.round((tptStarted / tptEligible) * 100) : 0,
      tptSelesai: tptComplete,
      dataTptLama: legacyCts.length
    };
  });

  const exportTableCSV = () => {
    const headers = ['Kelurahan,Pasien TB,TB Sedang Berobat,TB Sembuh,Kontak Berindeks,Kontak Diskrining,Cakupan Skrining (%),Kandidat TPT,TPT Dimulai,Cakupan TPT (%),TPT Selesai,Data TPT Lama (Terpisah)'];
    const rows = kelurahanStats.map(s => 
      `"${s.kelurahan}","${s.totalTB}","${s.tbSedangBerobat}","${s.tbSembuh}","${s.totalKontak}","${s.kontakDiskrining}","${s.cakupanSkriningPersen}%","${s.kandidatTPT}","${s.tptMulai}","${s.cakupanTPTPersen}%","${s.tptSelesai}","${s.dataTptLama}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_TB_TPT_Puskesmas_Pauh_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Laporan & Statistik Capaian Program</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C5456] text-white font-bold">
              Kemenkes & Dinkes Kota Padang
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi berkala kohort pengobatan TB dan penemuan serta inisiasi Terapi Pencegahan TB (TPT).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTableCSV}
            className="px-3.5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Selection */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9] text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="font-bold text-[#1C5456]">Pilih Periode Laporan:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="p-2 bg-white border border-[#FBE6C9] rounded-xl font-medium focus:outline-none cursor-pointer"
          >
            <option value="Bulan Berjalan (November 2026)">Bulan Berjalan (November 2026)</option>
            <option value="Triwulan IV (Okt - Des 2026)">Triwulan IV (Okt - Des 2026)</option>
            <option value="Semester 2 (Juli - Des 2026)">Semester 2 (Juli - Des 2026)</option>
            <option value="Tahun 2026">Tahun Berjalan 2026 (Kumulatif)</option>
          </select>
        </div>

        <div className="text-slate-500 text-[11px]">
          Fasilitas Pelayanan Kesehatan: <strong>UPTD Puskesmas Pauh (Kode: P137107)</strong>
        </div>
      </div>

      {/* Primary Report Table: Recap by 9 Kelurahan */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C5456]">
            Tabel Rekapitulasi TB dan Kontak Erat per Kelurahan
          </h3>
          <span className="text-xs text-slate-500 font-mono">9 Kelurahan Lengkap</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1C5456] text-white font-semibold text-[11px]">
                <th className="py-3 px-4">Nama Kelurahan</th>
                <th className="py-3 px-3 text-center">Pasien TB Aktif</th>
                <th className="py-3 px-3 text-center">Sedang Berobat</th>
                <th className="py-3 px-3 text-center">Sembuh / Tuntas</th>
                <th className="py-3 px-3 text-center">Total Kontak</th>
                <th className="py-3 px-3 text-center">Diskrining</th>
                <th className="py-3 px-3 text-center">Cakupan Skrining</th>
                <th className="py-3 px-3 text-center">Kandidat TPT</th>
                <th className="py-3 px-3 text-center">TPT Dimulai</th>
                <th className="py-3 px-3 text-center">Cakupan TPT</th>
                <th className="py-3 px-3 text-center">Data TPT Lama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kelurahanStats.map((stat, i) => (
                <tr key={stat.kelurahan} className="hover:bg-[#FDF5EB]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {i + 1}. {stat.kelurahan}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#1C5456]">{stat.totalTB}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">{stat.tbSedangBerobat}</td>
                  <td className="py-3 px-3 text-center font-mono text-[#58904A] font-semibold">{stat.tbSembuh}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#35907D]">{stat.totalKontak}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">{stat.kontakDiskrining}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      stat.cakupanSkriningPersen >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      stat.cakupanSkriningPersen >= 50 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stat.cakupanSkriningPersen}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">{stat.kandidatTPT}</td>
                  <td className="py-3 px-3 text-center font-mono text-[#58904A] font-bold">{stat.tptMulai}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      stat.cakupanTPTPersen >= 70 ? 'bg-emerald-100 text-emerald-800' :
                      stat.cakupanTPTPersen >= 40 ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {stat.cakupanTPTPersen}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">
                    {stat.dataTptLama > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                        {stat.dataTptLama}
                      </span>
                    ) : (
                      '0'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer Row */}
            <tfoot className="bg-[#FAEEE0] font-bold text-slate-900 border-t-2 border-[#FBE6C9]">
              <tr>
                <td className="py-3 px-4">TOTAL UPTD PUSKESMAS PAUH</td>
                <td className="py-3 px-3 text-center font-mono">{patients.length}</td>
                <td className="py-3 px-3 text-center font-mono">{patients.filter(p => p.statusPengobatan === 'Sedang Berobat').length}</td>
                <td className="py-3 px-3 text-center font-mono text-[#58904A]">{patients.filter(p => p.statusPengobatan === 'Sembuh' || p.statusPengobatan === 'Pengobatan Lengkap').length}</td>
                <td className="py-3 px-3 text-center font-mono">{completeContactsAll.length}</td>
                <td className="py-3 px-3 text-center font-mono">{completeContactsAll.filter(c => c.sudahDiskrining).length}</td>
                <td className="py-3 px-3 text-center font-mono">
                  {completeContactsAll.length > 0 ? Math.round((completeContactsAll.filter(c => c.sudahDiskrining).length / completeContactsAll.length) * 100) : 0}%
                </td>
                <td className="py-3 px-3 text-center font-mono">{completeContactsAll.filter(c => c.memenuhiKriteriaTPT).length}</td>
                <td className="py-3 px-3 text-center font-mono text-[#58904A]">
                  {completeContactsAll.filter(c => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {completeContactsAll.filter(c => c.memenuhiKriteriaTPT).length > 0 
                    ? Math.round((completeContactsAll.filter(c => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length / completeContactsAll.filter(c => c.memenuhiKriteriaTPT).length) * 100)
                    : 0}%
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-600">{legacyContactsAll.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

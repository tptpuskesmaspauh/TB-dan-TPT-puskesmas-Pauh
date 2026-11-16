import React from 'react';
import { 
  UserCog, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Stethoscope, 
  KeyRound,
  History
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const UserManagementView: React.FC = () => {
  const { users, currentUser, switchRole, auditLogs } = useData();

  const permissionsMatrix = [
    { module: 'Dashboard & Statistik Capaian', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Input Pasien TB & Kontak Erat', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Pengisian Skrining Gejala TB', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Keputusan Medis Kelayakan TPT', superAdmin: true, adminPuskesmas: false, petugasTB: false, nakes: true },
    { module: 'Pencatatan Ambil Obat & Kunjungan', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'WhatsApp Center & Notifikasi', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: false },
    { module: 'Unduh Rekap Laporan & Statistik', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Manajemen Akun & Hak Akses', superAdmin: true, adminPuskesmas: false, petugasTB: false, nakes: false },
    { module: 'Pengaturan Sistem & API WhatsApp', superAdmin: true, adminPuskesmas: true, petugasTB: false, nakes: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Manajemen Pengguna & Hak Akses (RBAC)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C5456] text-white font-bold">
              4 Peran Standar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan hak akses bertingkat sesuai kewenangan medis dan administratif kesehatan (UU PDP No. 27/2022).
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-[#FAEEE0] px-3.5 py-2 rounded-xl border border-[#FBE6C9]">
          Peran Anda Saat Ini: <strong className="text-[#1C5456]">{currentUser.roleLabel}</strong>
        </div>
      </div>

      {/* User Accounts List */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C5456]">
            Daftar Akun Pengguna UPTD Puskesmas Pauh
          </h3>
          <span className="text-xs text-slate-400">Klik 'Aktifkan Peran' untuk berpindah simulasi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {users.map(u => {
            const isCurrent = currentUser.id === u.id;
            return (
              <div 
                key={u.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isCurrent 
                    ? 'bg-[#FAEEE0] border-[#35907D] shadow-sm ring-1 ring-[#35907D]' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C5456] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-slate-900 block">{u.name}</span>
                    <span className="text-[#35907D] font-bold block">{u.roleLabel}</span>
                    <p className="text-[11px] text-slate-500 font-mono">NIP: {u.nip || '-'}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isCurrent ? (
                    <span className="px-2.5 py-1 rounded-lg bg-[#58904A] text-white text-[10px] font-bold">
                      Aktif
                    </span>
                  ) : (
                    <button
                      onClick={() => switchRole(u.role)}
                      className="px-3 py-1 rounded-lg border border-[#35907D] text-[#35907D] hover:bg-[#35907D] hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      Beralih ke Akun Ini
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-heading font-bold text-sm text-[#1C5456]">
            Matriks Hak Akses Kewenangan (Role-Based Access Control)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keputusan TPT hanya dapat disahkan oleh Tenaga Kesehatan / Dokter Pemeriksa.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C5456] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Fitur / Modul Sistem</th>
                <th className="py-3 px-3 text-center">Super Admin</th>
                <th className="py-3 px-3 text-center">Admin Puskesmas</th>
                <th className="py-3 px-3 text-center">Petugas TB</th>
                <th className="py-3 px-3 text-center">Tenaga Kesehatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#FDF5EB]/50">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{p.module}</td>
                  <td className="py-2.5 px-3 text-center">
                    {p.superAdmin ? <CheckCircle2 className="w-4 h-4 text-[#58904A] mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.adminPuskesmas ? <CheckCircle2 className="w-4 h-4 text-[#58904A] mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.petugasTB ? <CheckCircle2 className="w-4 h-4 text-[#58904A] mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.nakes ? <CheckCircle2 className="w-4 h-4 text-[#58904A] mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#35907D]" />
            Catatan Jejak Audit Sistem (Audit Log)
          </h3>
          <span className="text-xs text-slate-400">Siapa, Kapan, & Apa yang Diubah</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-[#FDF5EB]/40 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1C5456]">{log.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {log.userRole}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{log.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {log.userName}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  KeyRound,
  History,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { RoleType } from '../../types/tb';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    auditLogs,
    createStaffAccount,
    updateStaffAccount,
    changeOwnPassword
  } = useData();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin_puskesmas';

  // Create Staff Form (Super Admin only)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('PauhTpt#2026');
  const [role, setRole] = useState<RoleType>('petugas_tb');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [createStatus, setCreateStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // Self password change
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus(null);
    setCreating(true);
    const res = await createStaffAccount({
      name,
      email,
      password: tempPassword,
      role,
      nip,
      phone
    });
    setCreateStatus(res);
    setCreating(false);
    if (res.ok) {
      setName('');
      setEmail('');
      setNip('');
      setPhone('');
    }
  };

  const handleSelfPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    if (newPass.length < 8) {
      setPassMsg('Kata sandi minimal 8 karakter.');
      return;
    }
    try {
      await changeOwnPassword(newPass);
      setNewPass('');
      setPassMsg('Kata sandi Anda berhasil diperbarui.');
    } catch (err) {
      setPassMsg(err instanceof Error ? err.message : 'Gagal memperbarui kata sandi. Anda mungkin perlu login ulang terlebih dahulu.');
    }
  };

  const permissionsMatrix = [
    { module: 'Dashboard & Statistik Capaian', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Input Pasien TB & Kontak Erat', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: false },
    { module: 'Pengisian Skrining Gejala TB', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Keputusan Medis Kelayakan TPT', superAdmin: true, adminPuskesmas: false, petugasTB: false, nakes: true },
    { module: 'Pencatatan Ambil Obat & Kunjungan', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'WhatsApp Center & Notifikasi', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: false },
    { module: 'Unduh Rekap Laporan & Statistik', superAdmin: true, adminPuskesmas: true, petugasTB: true, nakes: true },
    { module: 'Manajemen Akun & Hak Akses', superAdmin: true, adminPuskesmas: false, petugasTB: false, nakes: false },
    { module: 'Pengaturan Sistem & API WhatsApp', superAdmin: true, adminPuskesmas: true, petugasTB: false, nakes: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">Manajemen Pengguna & Hak Akses (RBAC)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C5456] text-white font-bold">
              Dijaga Firestore Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Peran disimpan pada koleksi users/&#123;uid&#125; dengan status isActive = true dan dipaksa langsung oleh Cloud Firestore Security Rules.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-[#FAEEE0] px-3.5 py-2 rounded-xl border border-[#FBE6C9]">
          Peran Anda Saat Ini: <strong className="text-[#1C5456]">{currentUser.roleLabel}</strong>
        </div>
      </div>

      {/* Super Admin: Create New Staff Account */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#35907D]" />
                Tambah Akun Petugas Baru (Khusus Super Admin)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Akun baru otomatis ditandai wajib mengganti kata sandi sementara pada login pertama.
              </p>
            </div>
          </div>

          {createStatus && (
            <div
              className={`p-3 rounded-xl border font-medium ${
                createStatus.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {createStatus.message}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="dr. Rahmat Hidayat"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Dinas *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@puskesmaspauh.id"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Sementara *</label>
              <input
                type="text"
                required
                minLength={8}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Peran RBAC *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              >
                <option value="petugas_tb">Petugas Program TB</option>
                <option value="nakes">Tenaga Kesehatan / Dokter Pemeriksa</option>
                <option value="admin_puskesmas">Admin Puskesmas / Tata Usaha</option>
                <option value="super_admin">Super Admin / Kepala Puskesmas</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP (Opsional)</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="1988..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. HP / WA *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-[#1C5456] hover:bg-[#35907D] text-white font-bold cursor-pointer disabled:opacity-60"
              >
                {creating ? 'Membuat Akun...' : '+ Buat & Aktifkan Akun Petugas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Accounts List */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C5456]">
            {isAdmin ? 'Daftar Akun Petugas Terdaftar di Firestore' : 'Profil Akun Anda (Terisolasi Privasi PII)'}
          </h3>
          <span className="text-xs text-slate-400">
            {isAdmin ? `${users.length} akun terdaftar` : 'Akses daftar staf hanya untuk Admin'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {users.map((u) => {
            const isCurrent = currentUser.id === u.id;
            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#FAEEE0] border-[#35907D] shadow-sm ring-1 ring-[#35907D]'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
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
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                      u.isActive !== false ? 'bg-[#58904A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {u.isActive !== false ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {isSuperAdmin && !isCurrent && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <select
                      value={u.role}
                      onChange={(e) => void updateStaffAccount(u.id, { role: e.target.value as RoleType })}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] cursor-pointer"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin_puskesmas">Admin Puskesmas</option>
                      <option value="petugas_tb">Petugas TB</option>
                      <option value="nakes">Tenaga Kesehatan</option>
                    </select>
                    <button
                      onClick={() => void updateStaffAccount(u.id, { isActive: u.isActive === false })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        u.isActive !== false
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {u.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Own Password Card */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs p-5 space-y-3 text-xs">
        <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#35907D]" />
          Ubah Kata Sandi Akun Saya
        </h3>
        {passMsg && <p className="text-[11px] font-semibold text-[#35907D]">{passMsg}</p>}
        <form onSubmit={handleSelfPasswordUpdate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            minLength={8}
            required
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Kata sandi baru minimal 8 karakter..."
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold cursor-pointer"
          >
            Perbarui Kata Sandi
          </button>
        </form>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-[#FBE6C9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#35907D]" />
            Matriks Hak Akses Kewenangan (Role-Based Access Control)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keputusan TPT hanya dapat disahkan oleh Tenaga Kesehatan / Dokter Pemeriksa (atau Super Admin) dan ditegakkan oleh Firestore Rules.
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
            Catatan Jejak Audit Sistem Permanen (Append-Only)
          </h3>
          <span className="text-xs text-slate-400">Hanya boleh ditambah, tidak dapat diubah/dihapus</span>
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

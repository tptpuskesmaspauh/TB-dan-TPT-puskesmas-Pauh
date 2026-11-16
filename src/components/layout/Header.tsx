import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  UserCircle2, 
  Plus, 
  RotateCcw, 
  ShieldAlert, 
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { RoleType } from '../../types/tb';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  onOpenAddPatient: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, onOpenAddPatient }) => {
  const { 
    currentUser, 
    switchRole, 
    users, 
    searchQuery, 
    setSearchQuery, 
    resetAllData,
    pickups,
    contacts,
    setActiveTab,
    logout
  } = useData();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Live alerts
  const overduePickups = pickups.filter(p => p.status === 'Terlambat');
  const unscreenedContacts = contacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia);
  const pendingTptDecision = contacts.filter(c => c.status === 'Menunggu keputusan petugas');
  const eligibleNotStarted = contacts.filter(c => c.status === 'TPT belum dimulai');

  const totalAlerts = overduePickups.length + unscreenedContacts.length + pendingTptDecision.length + eligibleNotStarted.length;

  return (
    <header className="sticky top-0 z-30 bg-[#FAEEE0] border-b border-[#FBE6C9] px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-white text-[#1C5456] border border-[#FBE6C9] hover:bg-[#FDF5EB] cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#35907D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasien TB, kontak erat, NIK, kelurahan, atau no. HP..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#FBE6C9] rounded-xl text-xs text-[#193F35] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#35907D] transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* Quick Add Patient Button */}
        <button
          onClick={onOpenAddPatient}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pasien TB</span>
        </button>

        {/* Live Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-xl bg-white border border-[#FBE6C9] text-[#1C5456] hover:bg-[#FDF5EB] relative cursor-pointer"
            title="Peringatan Klinis & Tindak Lanjut"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#CE5924] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#FBE6C9] p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#FBE6C9]">
                <h4 className="font-heading font-bold text-xs text-[#1C5456] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#CE5924]" />
                  Peringatan & Tindak Lanjut ({totalAlerts})
                </h4>
                <button 
                  onClick={() => setNotificationOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                {overduePickups.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setActiveTab('monitoring'); setNotificationOpen(false); }}
                    className="p-2.5 rounded-xl bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-red-700">Terlambat Ambil Obat OAT</span>
                      <span className="text-[10px] text-red-500 font-mono">Jadwal: {p.tanggalJadwal}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{p.patientName}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{p.catatan}</p>
                  </div>
                ))}

                {unscreenedContacts.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => { setActiveTab('screening'); setNotificationOpen(false); }}
                    className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#CE5924]">Kontak Belum Diskrining</span>
                      <span className="text-[10px] text-slate-500">{c.kelurahan}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{c.namaLengkap} ({c.umur} th, {c.hubunganDenganPasien})</p>
                    <p className="text-[10px] text-slate-500">Kontak dari pasien: {c.patientName || 'Pasien indeks belum terhubung'}</p>
                  </div>
                ))}

                {pendingTptDecision.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => { setActiveTab('tpt'); setNotificationOpen(false); }}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800">Menunggu Keputusan Nakes TPT</span>
                      <span className="text-[10px] text-amber-600">Perlu Evaluasi</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{c.namaLengkap}</p>
                    <p className="text-[10px] text-slate-600">Sudah diskrining tidak bergejala, siap dinilai dokter</p>
                  </div>
                ))}

                {totalAlerts === 0 && (
                  <div className="py-6 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-[#58904A] mx-auto mb-2" />
                    <p className="text-xs font-medium">Semua jadwal dan tindak lanjut terpantau tertib!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reset Demo Data */}
        <button
          onClick={() => {
            if (confirm('Kembalikan data ke awal simulasi UPTD Puskesmas Pauh?')) {
              resetAllData();
            }
          }}
          className="hidden md:flex items-center gap-1 p-2 rounded-xl bg-white border border-[#FBE6C9] text-slate-600 hover:text-[#1C5456] hover:bg-[#FDF5EB] cursor-pointer"
          title="Reset Data Simulasi"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Role Switcher (RBAC) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#FBE6C9] hover:bg-[#FDF5EB] cursor-pointer transition-all"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#35907D] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#1C5456] leading-tight truncate max-w-[120px]">{currentUser.name}</p>
              <p className="text-[10px] text-[#35907D] font-medium leading-tight truncate max-w-[120px]">{currentUser.roleLabel}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#FBE6C9] p-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Pilih Hak Akses Pengguna (RBAC):
              </div>
              <div className="mt-1 space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchRole(u.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`
                      w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer
                      ${currentUser.id === u.id ? 'bg-[#35907D]/10 text-[#1C5456] font-bold' : 'text-slate-700 hover:bg-slate-50'}
                    `}
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.roleLabel}</p>
                    </div>
                    {currentUser.id === u.id && <CheckCircle2 className="w-4 h-4 text-[#35907D]" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-bold transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Keluar dari Akun (Logout)</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

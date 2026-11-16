import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  CalendarClock, 
  FileHeart, 
  MessageSquareShare, 
  BookOpenCheck, 
  FileSpreadsheet, 
  UserCog, 
  Settings,
  Pill,
  BookOpen,
  Eye,
  HeartHandshake,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useData, ActiveNavTab } from '../../context/DataContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, contacts, pickups } = useData();

  // Urgent counts
  const overduePickups = pickups.filter(p => p.status === 'Terlambat').length;
  const unscreenedContacts = contacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia).length;
  const pendingTptDecision = contacts.filter(c => c.status === 'Menunggu keputusan petugas').length;

  const navItems: { id: ActiveNavTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: '1. Dashboard Utama', icon: LayoutDashboard },
    { id: 'patients', label: '2. Pasien TB Aktif', icon: UserCheck },
    { 
      id: 'contacts', 
      label: '3. Kontak Erat Terpadu', 
      icon: Users,
      badge: unscreenedContacts > 0 ? unscreenedContacts : undefined,
      badgeColor: 'bg-[#D77252] text-white'
    },
    { 
      id: 'screening', 
      label: '4. Skrining Gejala TB', 
      icon: Stethoscope,
      badge: unscreenedContacts > 0 ? unscreenedContacts : undefined,
      badgeColor: 'bg-[#F9D059] text-[#193F35]'
    },
    { 
      id: 'tpt', 
      label: '5. Terapi Pencegahan (TPT)', 
      icon: ShieldCheck,
      badge: pendingTptDecision > 0 ? pendingTptDecision : undefined,
      badgeColor: 'bg-[#35907D] text-white'
    },
    { 
      id: 'monitoring', 
      label: '6. Monitoring Pengobatan', 
      icon: CalendarClock,
      badge: overduePickups > 0 ? overduePickups : undefined,
      badgeColor: 'bg-[#CE5924] text-white'
    },
    { id: 'followup', label: '7. Follow-up & Kunjungan', icon: FileHeart },
    { id: 'whatsapp', label: '8. WhatsApp Center', icon: MessageSquareShare },
    { id: 'education', label: '9. Edukasi Kesehatan', icon: BookOpenCheck },
    { id: 'reports', label: '10. Laporan & Statistik', icon: FileSpreadsheet },
    { id: 'users', label: '11. Manajemen Pengguna', icon: UserCog },
    { id: 'settings', label: '12. Pengaturan Sistem', icon: Settings },
  ];

  const handleNavClick = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1C5456] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-[#33736A] flex items-center gap-3 bg-[#193F35]/50">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#F9D059] shadow-md bg-white shrink-0 flex items-center justify-center">
            <img 
              src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg" 
              alt="Logo Resmi TEMAN TPT" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-lg tracking-tight text-[#F9D059]">TEMAN TPT</span>
              <span className="text-[10px] bg-[#D77252] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">v1.0</span>
            </div>
            <p className="text-xs text-[#D1E6D9] font-medium truncate">UPTD Puskesmas Pauh</p>
            <p className="text-[10px] text-[#6BAE9D] truncate">Kota Padang, Sumatera Barat</p>
          </div>
        </div>

        {/* 4 Pilar Sesuai 4 Ikon Bulat di Logo Resmi */}
        <div className="px-3 py-2.5 bg-[#143B3D] border-b border-[#33736A]/60">
          <p className="text-[10px] uppercase font-bold text-[#D1E6D9] tracking-wider mb-1.5 px-1">4 Pilar Program (Sesuai Logo):</p>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* 1. Obat - Oranye Kemerahan */}
            <button 
              onClick={() => handleNavClick('tpt')} 
              title="Terapi (Kepatuhan OAT & TPT)"
              className="p-1.5 rounded-lg bg-[#35907D]/30 hover:bg-[#35907D]/60 transition-colors flex flex-col items-center group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#D77252] flex items-center justify-center text-white mb-0.5 shadow-xs">
                <Pill className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-[#D1E6D9] group-hover:text-white">Terapi</span>
            </button>

            {/* 2. Buku Edukasi - Oranye Cerah */}
            <button 
              onClick={() => handleNavClick('education')} 
              title="Edukasi TB & TPT"
              className="p-1.5 rounded-lg bg-[#35907D]/30 hover:bg-[#35907D]/60 transition-colors flex flex-col items-center group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#F08A6D] flex items-center justify-center text-white mb-0.5 shadow-xs">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-[#D1E6D9] group-hover:text-white">Edukasi</span>
            </button>

            {/* 3. Monitoring / Kaca Pembesar + Grafik - Kuning */}
            <button 
              onClick={() => handleNavClick('monitoring')} 
              title="Monitoring Jadwal & Efek Samping"
              className="p-1.5 rounded-lg bg-[#35907D]/30 hover:bg-[#35907D]/60 transition-colors flex flex-col items-center group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#F9D059] flex items-center justify-center text-[#193F35] mb-0.5 shadow-xs">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-[#D1E6D9] group-hover:text-white">Monitoring</span>
            </button>

            {/* 4. Keluarga / Aksi Nyata - Hijau Teal */}
            <button 
              onClick={() => handleNavClick('followup')} 
              title="Aksi Nyata Kunjungan & Skrining"
              className="p-1.5 rounded-lg bg-[#35907D]/30 hover:bg-[#35907D]/60 transition-colors flex flex-col items-center group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#35907D] flex items-center justify-center text-white mb-0.5 shadow-xs">
                <HeartHandshake className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-[#D1E6D9] group-hover:text-white">Aksi Nyata</span>
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer
                  ${isActive 
                    ? 'bg-[#35907D] text-white shadow-md font-bold' 
                    : 'text-[#D1E6D9] hover:bg-[#33736A]/50 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F9D059]' : 'text-[#6BAE9D]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-red-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#F9D059]" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-[#33736A] bg-[#143B3D]/70 text-[11px] text-[#6BAE9D]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#D1E6D9] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F9D059]" /> Siap Terintegrasi
            </span>
            <span className="font-mono text-[10px] text-[#F9D059]">9 Kelurahan</span>
          </div>
          <p className="text-[10px] leading-tight text-[#D1E6D9]/80">
            Satu Pasien TB Aktif → Terkoneksi Seluruh Kontak Erat
          </p>
        </div>
      </aside>
    </>
  );
};

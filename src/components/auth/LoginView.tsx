import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  UserCheck, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Building2,
  Stethoscope,
  Users
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { INITIAL_USERS } from '../../data/dummyData';
import { UserAccount } from '../../types/tb';

export const LoginView: React.FC = () => {
  const { login } = useData();

  const [selectedUser, setSelectedUser] = useState<UserAccount>(INITIAL_USERS[1]); // default to Petugas TB
  const [emailInput, setEmailInput] = useState(INITIAL_USERS[1].email);
  const [passwordInput, setPasswordInput] = useState('puskesmaspauh2026');

  const handleSelectRole = (user: UserAccount) => {
    setSelectedUser(user);
    setEmailInput(user.email);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedUser);
  };

  return (
    <div className="min-h-screen bg-[#FDF5EB] flex flex-col justify-center items-center p-4 sm:p-6 text-[#193F35]">
      
      {/* Background Subtle Gradient Accents */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-[#FBE6C9] overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in zoom-in-95">
        
        {/* Left Side: Brand & Official Mascot Showcase */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1C5456] via-[#33736A] to-[#35907D] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden text-center md:text-left">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[#F9D059] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Inovasi Digital Puskesmas
            </div>
            
            <h1 className="font-heading font-black text-2xl lg:text-3xl tracking-tight text-white leading-tight">
              TEMAN TPT
            </h1>
            <p className="text-xs text-[#F9D059] font-bold">
              Terapi, Edukasi, Monitoring, dan Aksi Nyata TPT
            </p>
            <p className="text-xs text-[#D1E6D9] leading-relaxed">
              Sistem Informasi Terintegrasi Pemantauan Pasien Tuberkulosis (TB) dan Kontak Erat – UPTD Puskesmas Pauh Kota Padang.
            </p>
          </div>

          {/* Official Mascot Illustration */}
          <div className="my-6 relative z-10 flex flex-col items-center">
            <div className="w-48 h-36 sm:w-56 sm:h-40 rounded-3xl overflow-hidden border-4 border-[#F9D059] shadow-2xl bg-white p-1.5 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img 
                src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg" 
                alt="Logo & Maskot Resmi TEMAN TPT" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-[#F9D059] font-bold mt-2 bg-[#193F35]/70 px-3 py-0.5 rounded-full">
              Satu Pasien TB → Seluruh Kontak Terlindungi
            </p>
          </div>

          <div className="text-[10px] text-[#D1E6D9]/80 border-t border-white/15 pt-3">
            Kepatuhan Privasi Pasien Berdasarkan UU PDP No. 27 Tahun 2022 & Rekam Medis Kemenkes RI.
          </div>
        </div>

        {/* Right Side: Login & Role Selection */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-[#FAEEE0]/30">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#FBE6C9]">
              <div>
                <h2 className="font-heading font-black text-xl text-[#1C5456]">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-500">Pilih hak akses kewenangan Anda untuk mulai bertugas</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#1C5456]/10 text-[#1C5456] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* Quick 1-Click Role Selector */}
            <div className="mt-4 space-y-2">
              <label className="block text-[11px] font-bold text-[#1C5456] uppercase tracking-wider">
                Pilih Akun & Peran (Role-Based Access Control):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {INITIAL_USERS.map((user) => {
                  const isSelected = selectedUser.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectRole(user)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1C5456] text-white border-[#1C5456] shadow-md ring-2 ring-[#35907D]/30' 
                          : 'bg-white border-[#FBE6C9] hover:bg-[#FAEEE0] text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-[#F9D059] text-[#193F35]' : 'bg-[#D1E6D9] text-[#193F35]'
                        }`}>
                          {user.roleLabel.split('/')[0].trim()}
                        </span>
                        {isSelected && <Sparkles className="w-3.5 h-3.5 text-[#F9D059]" />}
                      </div>
                      <p className="font-bold text-xs truncate">{user.name}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-[#D1E6D9]' : 'text-slate-400'}`}>
                        {user.email}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standard Credentials Form */}
            <form onSubmit={handleFormLogin} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / NIP Pengguna:</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#FBE6C9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi (Password):</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#FBE6C9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
              >
                <span>Masuk sebagai {selectedUser.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-[#FBE6C9] text-center text-[11px] text-slate-500">
            UPTD Puskesmas Pauh Kota Padang · Dinas Kesehatan Kota Padang
          </div>
        </div>

      </div>
    </div>
  );
};

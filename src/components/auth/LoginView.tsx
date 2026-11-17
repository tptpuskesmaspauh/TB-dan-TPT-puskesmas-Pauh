import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  MailCheck,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export const LoginView: React.FC = () => {
  const {
    loginWithEmail,
    loginWithGoogle,
    authError,
    clearAuthError,
    unverifiedUserEmail,
    resendVerificationEmail,
    refreshEmailVerification,
    sessionTimeoutNotice
  } = useData();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const [verificationSentMsg, setVerificationSentMsg] = useState('');

  useEffect(() => {
    if (lockoutSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setLockoutSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockoutSecondsLeft]);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecondsLeft > 0 || submitting) return;
    clearAuthError();
    setSubmitting(true);
    try {
      await loginWithEmail(emailInput, passwordInput);
      setFailedAttempts(0);
    } catch {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      if (nextFails >= MAX_FAILED_ATTEMPTS) {
        setLockoutSecondsLeft(LOCKOUT_SECONDS);
        setFailedAttempts(0);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (submitting) return;
    clearAuthError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      // authError already set in DataContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationSentMsg('');
    try {
      await resendVerificationEmail();
      setVerificationSentMsg('Tautan verifikasi baru telah dikirim ke email Anda. Silakan cek kotak masuk / folder Spam.');
    } catch {
      setVerificationSentMsg('Gagal mengirim ulang email verifikasi. Coba beberapa saat lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5EB] flex flex-col justify-center items-center p-4 sm:p-6 text-[#193F35]">
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
            Dilindungi Cloud Firestore Security Rules & Firebase Authentication (UU PDP No. 27 Tahun 2022).
          </div>
        </div>

        {/* Right Side: Real Firebase Authentication */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-[#FAEEE0]/30">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#FBE6C9]">
              <div>
                <h2 className="font-heading font-black text-xl text-[#1C5456]">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-500">
                  Khusus petugas & tenaga kesehatan terdaftar UPTD Puskesmas Pauh
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#1C5456]/10 text-[#1C5456] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {sessionTimeoutNotice && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{sessionTimeoutNotice}</span>
              </div>
            )}

            {authError && (
              <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#CE5924] shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {lockoutSecondsLeft > 0 && (
              <div className="mt-4 p-3 rounded-2xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Terlalu banyak percobaan salah. Tunggu {lockoutSecondsLeft} detik sebelum mencoba lagi.</span>
              </div>
            )}

            {unverifiedUserEmail ? (
              <div className="mt-5 p-4 rounded-2xl bg-[#FAEEE0] border border-[#F7D6A5] space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MailCheck className="w-5 h-5 text-[#1C5456] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#1C5456]">Verifikasi Email Diperlukan</p>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Email <strong>{unverifiedUserEmail}</strong> belum terverifikasi. Demi keamanan data medis, klik tautan verifikasi pada kotak masuk email Anda terlebih dahulu.
                    </p>
                  </div>
                </div>
                {verificationSentMsg && (
                  <p className="text-[11px] text-[#58904A] font-semibold bg-white p-2 rounded-xl border border-[#D1E6D9]">
                    {verificationSentMsg}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleResendVerification()}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#FBE6C9] text-[#1C5456] font-bold hover:bg-[#FDF5EB] cursor-pointer"
                  >
                    Kirim Ulang Link Verifikasi
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshEmailVerification()}
                    className="px-3.5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Saya Sudah Verifikasi</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Google Sign-In Button (Enabled by default by Firebase Provisioning) */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void handleGoogleLogin()}
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FDF5EB] border-2 border-[#FBE6C9] text-[#1C5456] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#35907D]" />
                    <span>Masuk dengan Akun Google Puskesmas</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    Rekomendasi untuk Super Admin (<strong>tpt.puskesmaspauh@gmail.com</strong>) & petugas berakun Google.
                  </p>
                </div>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-[#FBE6C9] w-full" />
                  <span className="bg-[#FDF9F3] px-3 text-[10px] font-bold uppercase text-slate-400 shrink-0">
                    Atau Email & Kata Sandi
                  </span>
                  <div className="border-t border-[#FBE6C9] w-full" />
                </div>

                {/* Email & Password Login Form */}
                <form onSubmit={handleFormLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Petugas:</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="contoh: petugas.tb@puskesmaspauh.id"
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
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full p-2.5 bg-white border border-[#FBE6C9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35907D]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || lockoutSecondsLeft > 0}
                    className="w-full py-3 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>{submitting ? 'Memverifikasi...' : 'Masuk ke TEMAN TPT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            <div className="mt-4 p-3 rounded-2xl bg-[#FDF5EB] border border-[#FBE6C9] text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-[#1C5456]">Tidak ada pendaftaran mandiri:</strong> Akun hanya dibuat dan diaktifkan oleh Super Admin Puskesmas Pauh. Sesi otomatis berakhir setelah 30 menit tidak aktif.
            </div>
          </div>

          <div className="pt-3 border-t border-[#FBE6C9] text-center text-[11px] text-slate-500">
            UPTD Puskesmas Pauh Kota Padang · Dinas Kesehatan Kota Padang
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsedMessage = error.message || 'Terjadi kesalahan pada aplikasi.';
    let isPermissionError = false;

    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        parsedMessage = `${parsed.error} (Operasi: ${parsed.operationType || '-'}, Lokasi: ${parsed.path || '-'})`;
        if (String(parsed.error).toLowerCase().includes('permission')) {
          isPermissionError = true;
        }
      }
    } catch {
      if (parsedMessage.toLowerCase().includes('permission')) {
        isPermissionError = true;
      }
    }

    return {
      hasError: true,
      errorMessage: parsedMessage,
      isPermissionError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TEMAN TPT ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDF5EB] flex items-center justify-center p-6 text-[#193F35]">
          <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-[#FBE6C9] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#CE5924] flex items-center justify-center shrink-0">
                {this.state.isPermissionError ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="font-heading font-black text-lg text-[#1C5456]">
                  {this.state.isPermissionError
                    ? 'Akses Ditolak oleh Aturan Keamanan'
                    : 'Terjadi Kendala Sistem'}
                </h2>
                <p className="text-xs text-slate-500">
                  TEMAN TPT — UPTD Puskesmas Pauh
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] text-xs text-slate-700 leading-relaxed break-words">
              {this.state.errorMessage}
            </div>

            <p className="text-xs text-slate-600">
              {this.state.isPermissionError
                ? 'Peran akun Anda tidak memiliki izin untuk melakukan tindakan ini, atau akun belum aktif di koleksi users Firestore.'
                : 'Silakan muat ulang halaman. Jika kendala berlanjut, periksa koneksi internet atau konfigurasi Firebase.'}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-[#1C5456] hover:bg-[#35907D] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

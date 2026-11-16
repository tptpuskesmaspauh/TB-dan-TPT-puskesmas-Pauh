import React, { useState } from 'react';
import { 
  MessageSquareShare, 
  Send, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  UserCheck, 
  ExternalLink,
  Sparkles,
  Phone
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const WhatsAppCenterView: React.FC = () => {
  const { 
    whatsappMessages, 
    sendWhatsApp, 
    patients, 
    contacts, 
    currentUser 
  } = useData();

  // Sending state
  const [targetType, setTargetType] = useState<'Pasien TB' | 'Kontak Erat'>('Pasien TB');
  const [selectedId, setSelectedId] = useState<string>(patients[0]?.id ?? '');
  const [templateType, setTemplateType] = useState<string>('Pengingat Ambil Obat');
  const [customMessage, setCustomMessage] = useState<string>('');

  const selectedPatient = patients.find(p => p.id === selectedId);
  const selectedContact = contacts.find(c => c.id === selectedId);

  const recipientName = targetType === 'Pasien TB' 
    ? (selectedPatient?.namaLengkap || '') 
    : (selectedContact?.namaLengkap || '');

  const recipientPhone = targetType === 'Pasien TB'
    ? (selectedPatient?.noWhatsApp || '')
    : (selectedContact?.noWhatsApp || '');

  // Privacy-Preserving Standard Templates (Anti-Stigma & Compliant with UU PDP)
  const getStandardText = (type: string, name: string) => {
    switch (type) {
      case 'Pengingat Ambil Obat':
        return `Selamat pagi/siang, Bapak/Ibu ${name}. Kami dari UPTD Puskesmas Pauh ingin mengingatkan jadwal pelayanan pengambilan pengobatan rutin Bapak/Ibu di Puskesmas. Mohon dapat hadir sesuai jadwal agar kesehatan tetap terjaga prima. Jika ada kendala kehadiran, silakan balas pesan ini untuk konfirmasi. Terima kasih. (Layanan Informasi UPTD Puskesmas Pauh Kota Padang)`;

      case 'Undangan Skrining Kontak':
        return `Selamat pagi/siang, Bapak/Ibu ${name}. Kami dari Tim Pencegahan Penyakit UPTD Puskesmas Pauh mengundang Bapak/Ibu dan keluarga untuk pemeriksaan kesehatan gratis di Puskesmas Pauh sebagai bagian dari ikhtiar menjaga kesehatan keluarga tercinta. Layanan cepat dan ramah. Informasi & konfirmasi: hubungi petugas Puskesmas Pauh.`;

      case 'Jadwal Kontrol TPT':
        return `Selamat pagi/siang, Bapak/Ibu ${name}. Mengingatkan jadwal kontrol evaluasi berkala dan pengambilan paket perlindungan kesehatan (TPT) di UPTD Puskesmas Pauh besok. Mohon hadir sesuai waktu yang disepakati. Salam sehat untuk seluruh keluarga.`;

      case 'Pemeriksaan Dahak Ulang':
        return `Selamat pagi/siang, Bapak/Ibu ${name}. Mengingatkan jadwal evaluasi kesehatan dan pemeriksaan sampel dahak berkala di laboratorium Puskesmas Pauh. Pemeriksaan ini penting untuk memastikan progres kesehatan Bapak/Ibu berjalan sangat baik. Terima kasih.`;

      case 'Edukasi Kepatuhan':
        return `Halo Bapak/Ibu ${name}. Semoga sehat selalu. Tim UPTD Puskesmas Pauh mengingatkan pentingnya meminum obat secara teratur tanpa putus demi perlindungan keluarga. Bila ada keluhan mual atau pusing ringan, segera konsultasikan kepada dokter kami. Tetap semangat!`;

      default:
        return `Halo Bapak/Ibu ${name}. Salam sehat dari UPTD Puskesmas Pauh.`;
    }
  };

  const previewText = customMessage || getStandardText(templateType, recipientName || 'Bapak/Ibu');

  const handleSendOfficialApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone) {
      alert('Penerima belum memiliki nomor WhatsApp yang terdaftar!');
      return;
    }

    sendWhatsApp({
      receiverType: targetType,
      receiverName: recipientName,
      noWhatsApp: recipientPhone,
      templateType: templateType as any,
      pesanTeks: previewText,
      statusKirim: 'Terkirim',
      petugas: currentUser.name
    });

    setCustomMessage('');
    alert(`Pesan WhatsApp resmi berhasil dikirimkan ke ${recipientName} (${recipientPhone})!`);
  };

  const handleOpenDirectWhatsApp = () => {
    if (!recipientPhone) {
      alert('Penerima belum memiliki nomor WhatsApp yang terdaftar!');
      return;
    }

    const cleanPhone = recipientPhone.replace(/\D/g, '').replace(/^0/, '62');
    const encoded = encodeURIComponent(previewText);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    
    // Also record log
    sendWhatsApp({
      receiverType: targetType,
      receiverName: recipientName,
      noWhatsApp: recipientPhone,
      templateType: templateType as any,
      pesanTeks: previewText,
      statusKirim: 'Terkirim',
      petugas: currentUser.name
    });

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#FBE6C9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-xl text-[#1C5456]">
              WhatsApp Notification Center (Resmi & Terjadwal)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#193F35] font-bold flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5 text-[#25D366]" /> API Resmi Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengingat otomatis jadwal ambil obat, kontrol TPT, dan undangan skrining dengan perlindungan privasi ketat (UU PDP No. 27/2022).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-medium">
          <ShieldCheck className="w-4 h-4 text-[#58904A]" />
          <span>Anti-Stigma: Tidak Menyebutkan Diagnosis TB Secara Terbuka</span>
        </div>
      </div>

      {/* Main Grid: Send Composer & Sent History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Message Composer (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs space-y-4 text-xs">
          <h3 className="font-heading font-bold text-sm text-[#1C5456] flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquareShare className="w-4 h-4 text-[#35907D]" />
            Kirim Pengingat & Undangan WhatsApp
          </h3>

          <form onSubmit={handleSendOfficialApi} className="space-y-3.5">
            {/* Target Category */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Sasaran:</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setTargetType('Pasien TB'); setSelectedId(patients[0]?.id ?? ''); }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${targetType === 'Pasien TB' ? 'bg-[#1C5456] text-white shadow-xs' : 'text-slate-600'}`}
                  >
                    Pasien TB
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTargetType('Kontak Erat'); setSelectedId(contacts[0]?.id ?? ''); }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${targetType === 'Kontak Erat' ? 'bg-[#1C5456] text-white shadow-xs' : 'text-slate-600'}`}
                  >
                    Kontak Erat
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Nama Penerima:</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                >
                  {targetType === 'Pasien TB'
                    ? patients.map(p => (
                        <option key={p.id} value={p.id}>{p.namaLengkap} ({p.kelurahan} - {p.noWhatsApp})</option>
                      ))
                    : contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.namaLengkap} ({c.hubunganDenganPasien} - {c.noWhatsApp})</option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Template Pesan Puskesmas:</label>
              <select
                value={templateType}
                onChange={(e) => { setTemplateType(e.target.value); setCustomMessage(''); }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
              >
                <option value="Pengingat Ambil Obat">Pengingat Jadwal Pengambilan Obat OAT</option>
                <option value="Undangan Skrining Kontak">Undangan Skrining Kesehatan Keluarga (Kontak Erat)</option>
                <option value="Jadwal Kontrol TPT">Jadwal Kontrol Terapi Pencegahan TB (TPT)</option>
                <option value="Pemeriksaan Dahak Ulang">Pemeriksaan Evaluasi Dahak Berkala</option>
                <option value="Edukasi Kepatuhan">Konseling & Edukasi Motivasi Minum Obat</option>
              </select>
            </div>

            {/* Live Message Preview (Styled like WhatsApp chat bubble) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pratinjau Pesan yang Diterima:</label>
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#D1D7DB] relative shadow-inner">
                <div className="max-w-[90%] bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs text-slate-800 text-xs space-y-2 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold border-b border-slate-100 pb-1">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    <span>UPTD PUSKESMAS PAUH OFFICIAL</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap font-sans">{previewText}</p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
                    <span>10:30 WIB</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Edit Option */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kustomisasi Isi Pesan (Opsional):</label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Biarkan kosong untuk menggunakan template standar di atas..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            {/* Dispatch Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5 items-center justify-end">
              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Buka langsung di WhatsApp Web / Aplikasi WhatsApp"
              >
                <Phone className="w-4 h-4" />
                <span>Buka di WhatsApp Web Langsung</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1C5456] hover:bg-[#35907D] text-white font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#F9D059]" />
                <span>Kirim via Cloud API Resmi</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Message History & Status Log (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white border border-[#FBE6C9] shadow-xs flex flex-col max-h-[600px]">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[#1C5456]">
              Riwayat Pesan Terkirim ({whatsappMessages.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Logs</span>
          </div>

          <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1 text-xs">
            {whatsappMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{msg.receiverName}</span>
                  <span className="text-[9px] font-mono text-slate-500">{msg.waktuKirim}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-semibold text-[#1C5456]">{msg.templateType}</span>
                  <span className="font-mono">{msg.noWhatsApp}</span>
                </div>
                <p className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-xl italic line-clamp-2">
                  "{msg.pesanTeks}"
                </p>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> {msg.statusKirim}
                  </span>
                  <span className="text-slate-400">{msg.petugas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

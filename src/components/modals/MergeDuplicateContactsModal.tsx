import React, { useMemo, useState } from 'react';
import { X, GitMerge, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CloseContact } from '../../types/tb';

interface MergeDuplicateContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DuplicatePair {
  primary: CloseContact;
  duplicate: CloseContact;
  reason: string;
}

function norm(s?: string | null): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findDuplicateContactPairs(contacts: CloseContact[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i];
      const b = contacts[j];
      if (!a.namaLengkap || !b.namaLengkap) continue;
      if (norm(a.namaLengkap) !== norm(b.namaLengkap)) continue;

      const sameDob = Boolean(a.tanggalLahir && b.tanggalLahir && a.tanggalLahir === b.tanggalLahir);
      const sameAddr = Boolean(norm(a.alamat) && norm(a.alamat) !== 'tidak ada data' && norm(a.alamat) === norm(b.alamat));
      const sameKelUmur = Boolean(a.kelurahan === b.kelurahan && a.umur > 0 && a.umur === b.umur);

      if (sameDob || sameAddr || sameKelUmur) {
        const reasons: string[] = ['Nama sama'];
        if (sameDob) reasons.push('Tanggal lahir sama');
        if (sameAddr) reasons.push('Alamat sama');
        if (!sameDob && !sameAddr && sameKelUmur) reasons.push('Kelurahan & umur sama');
        pairs.push({
          primary: a,
          duplicate: b,
          reason: reasons.join(' + ')
        });
      }
    }
  }
  return pairs;
}

export const MergeDuplicateContactsModal: React.FC<MergeDuplicateContactsModalProps> = ({ isOpen, onClose }) => {
  const { contacts, mergeDuplicateContacts } = useData();
  const [selectedPairIdx, setSelectedPairIdx] = useState(0);

  const pairs = useMemo(() => findDuplicateContactPairs(contacts), [contacts]);

  if (!isOpen) return null;

  const activePair = pairs[selectedPairIdx] || pairs[0];

  const handleMerge = (keep: CloseContact, remove: CloseContact) => {
    const mergedFields: Partial<CloseContact> = {
      patientId: keep.patientId || remove.patientId || '',
      patientName: keep.patientName || remove.patientName || '',
      noWhatsApp: keep.noWhatsApp || remove.noWhatsApp || '',
      nik: keep.nik || remove.nik || '',
      tanggalLahir: keep.tanggalLahir || remove.tanggalLahir,
      tanggalMulaiTPT: keep.tanggalMulaiTPT || remove.tanggalMulaiTPT,
      tanggalSelesaiTPT: keep.tanggalSelesaiTPT || remove.tanggalSelesaiTPT,
      regimenTPT: keep.regimenTPT || remove.regimenTPT,
      sitbRecorded: Boolean(keep.sitbRecorded || remove.sitbRecorded),
      sitbRecordedDate: keep.sitbRecordedDate || remove.sitbRecordedDate,
      sitbRecordedBy: keep.sitbRecordedBy || remove.sitbRecordedBy,
      hubunganDenganPasien:
        keep.hubunganDenganPasien !== 'Tidak ada data'
          ? keep.hubunganDenganPasien
          : remove.hubunganDenganPasien,
      kategoriSasaranTPT:
        keep.kategoriSasaranTPT && keep.kategoriSasaranTPT !== 'Tidak ada data'
          ? keep.kategoriSasaranTPT
          : remove.kategoriSasaranTPT
    };

    mergeDuplicateContacts(keep.id, remove.id, mergedFields);
    setSelectedPairIdx(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] overflow-hidden my-auto">
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-[#F9D059]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">Deteksi &amp; Gabung Data Ganda (Duplikat)</h3>
              <p className="text-xs text-[#D1E6D9]">
                Mencocokkan kesamaan Nama, Tanggal Lahir, dan Alamat pada data kontak / TPT.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs bg-[#FDF5EB]/40">
          {pairs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#FBE6C9] p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#58904A] mx-auto" />
              <h4 className="font-heading font-bold text-sm text-[#1C5456]">Tidak Ada Data Ganda Terdeteksi</h4>
              <p className="text-slate-500">Semua catatan kontak erat dan penerima TPT saat ini sudah bersih dan unik.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-[#F9D059]/30 border border-[#F9D059] rounded-2xl p-3 text-[#193F35]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#CE5924] shrink-0" />
                  <span>
                    Ditemukan <strong>{pairs.length} pasangan data berpotensi ganda</strong>. Pilih data utama yang ingin dipertahankan — kolom yang kosong akan otomatis dilengkapi dari pasangannya.
                  </span>
                </div>
              </div>

              {pairs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {pairs.map((p, idx) => (
                    <button
                      key={`${p.primary.id}-${p.duplicate.id}`}
                      onClick={() => setSelectedPairIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer ${
                        idx === selectedPairIdx ? 'bg-[#1C5456] text-white' : 'bg-white border border-[#FBE6C9] text-slate-700'
                      }`}
                    >
                      Pasangan #{idx + 1}: {p.primary.namaLengkap}
                    </button>
                  ))}
                </div>
              )}

              {activePair && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-[#CE5924]">
                    Alasan Terdeteksi Duplikat: {activePair.reason}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[activePair.primary, activePair.duplicate].map((item, idx) => {
                      const other = idx === 0 ? activePair.duplicate : activePair.primary;
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-[#FBE6C9] p-4 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-mono font-bold text-[#1C5456]">{item.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAEEE0] text-[#1C5456] font-bold">
                              {item.sumberData === 'impor_data_lama' ? 'Impor Data Lama' : 'Input Langsung'}
                            </span>
                          </div>
                          <div><strong>Nama:</strong> {item.namaLengkap} ({item.umur} th, {item.jenisKelamin})</div>
                          <div><strong>Tgl Lahir:</strong> {item.tanggalLahir || <span className="text-slate-400">Tidak ada data</span>}</div>
                          <div><strong>Alamat:</strong> {item.alamat}, {item.kelurahan}</div>
                          <div><strong>No. WA:</strong> {item.noWhatsApp || <span className="text-slate-400">Kosong</span>}</div>
                          <div><strong>Pasien Indeks:</strong> {item.patientName || <span className="text-slate-400">Belum terhubung</span>}</div>
                          <div><strong>TPT:</strong> {item.regimenTPT || '-'} ({item.tanggalMulaiTPT || '-'})</div>
                          <div><strong>SITB:</strong> {item.sitbRecorded ? 'Sudah' : 'Belum'}</div>

                          <button
                            type="button"
                            onClick={() => handleMerge(item, other)}
                            className="w-full mt-2 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold cursor-pointer"
                          >
                            Pertahankan {item.id} &amp; Gabung
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  History,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Lock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { Gender, IndexPatient, SitbColumnMapping, TBTreatmentStatus } from '../../types/tb';

interface SitbImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAPPING_STORAGE_KEY = 'teman_tpt_pauh_sitb_mapping_v1';

const DEFAULT_MAPPING: SitbColumnMapping = {
  nomorRegisterSitb: 'No_Register_SITB',
  namaLengkap: 'Nama_Pasien',
  nik: 'NIK',
  noRekamMedis: 'No_RM',
  jenisKelamin: 'Jenis_Kelamin',
  umur: 'Umur',
  alamat: 'Alamat',
  kelurahan: 'Kelurahan',
  noWhatsApp: 'No_HP',
  tanggalMulaiOAT: 'Tgl_Mulai_Pengobatan',
  statusPengobatan: 'Status_Pengobatan',
  jadwalAmbilObatBerikutnya: 'Jadwal_Ambil_Obat',
};

interface ParsedRowPreview {
  rowNumber: number;
  status: 'new' | 'duplicate' | 'error';
  errors: string[];
  raw: Record<string, string>;
  mapped?: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>;
  existingPatient?: IndexPatient;
  diffs?: { field: string; oldVal: string; newVal: string }[];
  approveUpdate: boolean;
}

export const SitbImportModal: React.FC<SitbImportModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, patients, importLogs, importSitbPatients } = useData();

  const canImport = ['super_admin', 'admin_puskesmas', 'petugas_tb'].includes(currentUser.role);

  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<SitbColumnMapping>(() => {
    const saved = localStorage.getItem(MAPPING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MAPPING;
  });
  const [approvedDuplicateIds, setApprovedDuplicateIds] = useState<Record<number, boolean>>({});
  const [mappingSavedToast, setMappingSavedToast] = useState(false);

  const clearRawMemory = () => {
    setFileName('');
    setRawHeaders([]);
    setRawRows([]);
    setApprovedDuplicateIds({});
    setStep('upload');
  };

  const handleClose = () => {
    clearRawMemory();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        No_Register_SITB: 'SITB-137107-2026-019',
        Nama_Pasien: 'Hendra Wijaya (Dummy)',
        NIK: '1371071503880009',
        No_RM: 'RM-11501',
        Jenis_Kelamin: 'L',
        Umur: 38,
        Alamat: 'Jl. Padang Besi RT 02 / RW 01',
        Kelurahan: 'Pisang',
        No_HP: '081277001122',
        Tgl_Mulai_Pengobatan: '2026-11-01',
        Status_Pengobatan: 'Sedang Berobat',
        Jadwal_Ambil_Obat: '2026-12-01'
      },
      {
        No_Register_SITB: 'SITB-137107-2026-020',
        Nama_Pasien: 'Ratna Sari (Dummy)',
        NIK: '1371075407940003',
        No_RM: 'RM-11502',
        Jenis_Kelamin: 'P',
        Umur: 32,
        Alamat: 'Komp. Piai Indah Blok C2',
        Kelurahan: 'Piai Nan VII',
        No_HP: '081365008899',
        Tgl_Mulai_Pengobatan: '2026-11-04',
        Status_Pengobatan: 'Sedang Berobat',
        Jadwal_Ambil_Obat: '2026-12-04'
      },
      {
        // Baris yang cocok dengan pasien yang sudah ada untuk demonstrasi pencocokan duplikat
        No_Register_SITB: 'SITB-137107-2026-002',
        Nama_Pasien: 'Dewi Lestari',
        NIK: '1371075508920002',
        No_RM: 'RM-10518',
        Jenis_Kelamin: 'P',
        Umur: 34,
        Alamat: 'Komplek Unand Blok B3 No. 7',
        Kelurahan: 'Limau Manis',
        No_HP: '081363223344',
        Tgl_Mulai_Pengobatan: '2026-02-07',
        Status_Pengobatan: 'Sedang Berobat',
        Jadwal_Ambil_Obat: '2026-12-08'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_SITB');
    XLSX.writeFile(workbook, 'Template_Impor_SITB_Puskesmas_Pauh.xlsx');
  };

  const autoDetectMapping = (headers: string[]): SitbColumnMapping => {
    const findCol = (keywords: string[], fallback: string) => {
      const matched = headers.find(h =>
        keywords.some(kw => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kw))
      );
      return matched || fallback;
    };

    return {
      nomorRegisterSitb: findCol(['registersitb', 'nositb', 'sitb', 'register'], mapping.nomorRegisterSitb),
      namaLengkap: findCol(['namapasien', 'nama', 'namalengkap'], mapping.namaLengkap),
      nik: findCol(['nik', 'noktp'], mapping.nik),
      noRekamMedis: findCol(['norm', 'rekammedis', 'rm'], mapping.noRekamMedis),
      jenisKelamin: findCol(['jeniskelamin', 'kelamin', 'jk', 'gender'], mapping.jenisKelamin),
      umur: findCol(['umur', 'usia'], mapping.umur),
      alamat: findCol(['alamat', 'domisili'], mapping.alamat),
      kelurahan: findCol(['kelurahan', 'desa', 'wilayah'], mapping.kelurahan),
      noWhatsApp: findCol(['nohp', 'whatsapp', 'telepon', 'telp', 'wa'], mapping.noWhatsApp),
      tanggalMulaiOAT: findCol(['tglmulai', 'tanggalmulai', 'mulaioat', 'mulai'], mapping.tanggalMulaiOAT),
      statusPengobatan: findCol(['statuspengobatan', 'status', 'hasilakhir'], mapping.statusPengobatan),
      jadwalAmbilObatBerikutnya: findCol(['jadwalambil', 'jadwalobat', 'kontrolberikutnya'], mapping.jadwalAmbilObatBerikutnya),
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (jsonRows.length === 0) {
        alert('File Excel/CSV kosong atau tidak memiliki baris data.');
        return;
      }

      const headers = Object.keys(jsonRows[0]);
      const normalizedRows = jsonRows.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach(h => {
          obj[h] = String(row[h] ?? '').trim();
        });
        return obj;
      });

      setFileName(file.name);
      setRawHeaders(headers);
      setRawRows(normalizedRows);
      setMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch {
      alert('Gagal membaca file. Pastikan format file adalah .xlsx atau .csv yang valid.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveMappingTemplate = () => {
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    setMappingSavedToast(true);
    setTimeout(() => setMappingSavedToast(false), 2500);
  };

  const isValidDate = (val: string) => {
    if (!val) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(val) || !isNaN(Date.parse(val));
  };

  const normalizeDate = (val: string) => {
    if (!val) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return val;
  };

  const previewRows: ParsedRowPreview[] = useMemo(() => {
    return rawRows.map((row, idx) => {
      const rowNumber = idx + 2; // Excel header is row 1
      const errors: string[] = [];

      const regSitb = (row[mapping.nomorRegisterSitb] || '').trim();
      const nama = (row[mapping.namaLengkap] || '').trim();
      const nikRaw = (row[mapping.nik] || '').replace(/\D/g, '');
      const rmRaw = (row[mapping.noRekamMedis] || '').trim();
      const jkRaw = (row[mapping.jenisKelamin] || 'L').toUpperCase();
      const umurRaw = Number(row[mapping.umur] || 0);
      const alamatRaw = (row[mapping.alamat] || '').trim();
      const kelRaw = (row[mapping.kelurahan] || '').trim();
      const hpRaw = (row[mapping.noWhatsApp] || '').trim();
      const tglMulaiRaw = (row[mapping.tanggalMulaiOAT] || '').trim();
      const statusRaw = (row[mapping.statusPengobatan] || 'Sedang Berobat').trim();
      const jadwalRaw = (row[mapping.jadwalAmbilObatBerikutnya] || '').trim();

      if (!regSitb) errors.push('Nomor Register SITB kosong');
      if (!nama) errors.push('Nama pasien kosong');
      if (tglMulaiRaw && !isValidDate(tglMulaiRaw)) errors.push(`Format tanggal mulai tidak valid (${tglMulaiRaw})`);
      if (jadwalRaw && !isValidDate(jadwalRaw)) errors.push(`Format jadwal obat tidak valid (${jadwalRaw})`);
      if (nikRaw && nikRaw.length !== 16) errors.push('NIK harus 16 digit jika diisi');

      if (errors.length > 0) {
        return {
          rowNumber,
          status: 'error',
          errors,
          raw: row,
          approveUpdate: false
        };
      }

      const matchedKel = PUSKESMAS_KELURAHAN.find(k => k.toLowerCase() === kelRaw.toLowerCase()) || kelRaw || PUSKESMAS_KELURAHAN[0];
      const gender: Gender = jkRaw.startsWith('P') || jkRaw === 'F' ? 'P' : 'L';
      const normalizedStart = normalizeDate(tglMulaiRaw);
      const normalizedJadwal = jadwalRaw ? normalizeDate(jadwalRaw) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const allowedStatuses: TBTreatmentStatus[] = ['Sedang Berobat', 'Pengobatan Lengkap', 'Sembuh', 'Gagal', 'Putus Berobat', 'Meninggal', 'Pindah'];
      const matchedStatus = allowedStatuses.find(s => s.toLowerCase() === statusRaw.toLowerCase()) || 'Sedang Berobat';

      const mappedPatient: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'> = {
        nomorRegisterSitb: regSitb,
        sitbRecorded: true,
        sitbRecordedDate: new Date().toISOString().slice(0, 10),
        sitbRecordedBy: currentUser.name,
        nik: nikRaw || '1371070000000000',
        noRekamMedis: rmRaw || `RM-SITB-${rowNumber}`,
        namaLengkap: nama,
        jenisKelamin: gender,
        tanggalLahir: '1990-01-01',
        umur: umurRaw > 0 ? umurRaw : 30,
        alamat: alamatRaw || 'Wilayah Kerja Puskesmas Pauh',
        kelurahan: matchedKel,
        noWhatsApp: hpRaw,
        namaPendamping: '-',
        hubunganPendamping: 'Keluarga',
        noWhatsAppPendamping: hpRaw,
        tanggalDiagnosis: normalizedStart,
        klasifikasi: 'Paru',
        lokasiAnatomi: 'Sesuai Data Resmi SITB',
        hasilBakteriologis: 'Terkonfirmasi Bakteriologis (TCM+)',
        tanggalMulaiOAT: normalizedStart,
        fasyankes: 'UPTD Puskesmas Pauh',
        petugasPenanggungJawab: currentUser.name,
        regimenOAT: 'Sesuai Register SITB',
        fasePengobatan: matchedStatus === 'Sembuh' || matchedStatus === 'Pengobatan Lengkap' ? 'Selesai' : 'Awal (Intensif)',
        statusPengobatan: matchedStatus,
        perkiraanSelesai: new Date(new Date(normalizedStart).getTime() + 180 * 86400000).toISOString().slice(0, 10),
        komorbiditas: [],
        catatanKlinis: `Diimpor ringkas dari SITB (${fileName})`,
        kepatuhanMinumObat: 'Sangat Patuh (>95%)',
        jadwalAmbilObatBerikutnya: normalizedJadwal,
        jadwalAmbilObatTerakhir: normalizedStart,
        sisaObatHari: 30,
        pernahTerlambat: false,
        jumlahKeterlambatan: 0,
      };

      // Check duplicate via nomorRegisterSitb
      const existing = patients.find(p => p.nomorRegisterSitb.toLowerCase() === regSitb.toLowerCase());
      if (existing) {
        const diffs: { field: string; oldVal: string; newVal: string }[] = [];
        if (existing.namaLengkap !== mappedPatient.namaLengkap) diffs.push({ field: 'Nama', oldVal: existing.namaLengkap, newVal: mappedPatient.namaLengkap });
        if (existing.kelurahan !== mappedPatient.kelurahan) diffs.push({ field: 'Kelurahan', oldVal: existing.kelurahan, newVal: mappedPatient.kelurahan });
        if (existing.noWhatsApp !== mappedPatient.noWhatsApp && mappedPatient.noWhatsApp) diffs.push({ field: 'No. WA', oldVal: existing.noWhatsApp, newVal: mappedPatient.noWhatsApp });
        if (existing.statusPengobatan !== mappedPatient.statusPengobatan) diffs.push({ field: 'Status OAT', oldVal: existing.statusPengobatan, newVal: mappedPatient.statusPengobatan });
        if (existing.jadwalAmbilObatBerikutnya !== mappedPatient.jadwalAmbilObatBerikutnya) diffs.push({ field: 'Jadwal Obat', oldVal: existing.jadwalAmbilObatBerikutnya, newVal: mappedPatient.jadwalAmbilObatBerikutnya });

        return {
          rowNumber,
          status: 'duplicate',
          errors: [],
          raw: row,
          mapped: mappedPatient,
          existingPatient: existing,
          diffs,
          approveUpdate: Boolean(approvedDuplicateIds[rowNumber])
        };
      }

      return {
        rowNumber,
        status: 'new',
        errors: [],
        raw: row,
        mapped: mappedPatient,
        approveUpdate: false
      };
    });
  }, [rawRows, mapping, patients, approvedDuplicateIds, currentUser.name, fileName]);

  const newRowsCount = previewRows.filter(r => r.status === 'new').length;
  const dupRowsCount = previewRows.filter(r => r.status === 'duplicate').length;
  const errRowsCount = previewRows.filter(r => r.status === 'error').length;

  const handleConfirmImport = () => {
    const toInsert = previewRows
      .filter(r => r.status === 'new' && r.mapped)
      .map(r => r.mapped!);

    const toUpdate = previewRows
      .filter(r => r.status === 'duplicate' && r.existingPatient && approvedDuplicateIds[r.rowNumber] && r.mapped)
      .map(r => ({
        id: r.existingPatient!.id,
        updates: {
          namaLengkap: r.mapped!.namaLengkap,
          kelurahan: r.mapped!.kelurahan,
          noWhatsApp: r.mapped!.noWhatsApp || r.existingPatient!.noWhatsApp,
          statusPengobatan: r.mapped!.statusPengobatan,
          jadwalAmbilObatBerikutnya: r.mapped!.jadwalAmbilObatBerikutnya,
          sitbRecorded: true,
          sitbRecordedDate: new Date().toISOString().slice(0, 10),
          sitbRecordedBy: currentUser.name,
        }
      }));

    const skippedCount = previewRows.filter(r => r.status === 'duplicate' && !approvedDuplicateIds[r.rowNumber]).length;

    importSitbPatients({
      fileName,
      totalRows: rawRows.length,
      toInsert,
      toUpdate,
      skippedCount,
      errorCount: errRowsCount
    });

    // Clear raw file data from memory immediately after import completes
    clearRawMemory();
    setActiveTab('history');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] max-h-[92vh] overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[#F9D059]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white">Impor Data Pasien TB dari SITB</h3>
              <p className="text-xs text-[#D1E6D9]">
                Sinkronisasi ringkas menggunakan Nomor Register SITB tanpa pencatatan ulang berganda
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#FAEEE0] border-b border-[#FBE6C9] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'import' ? 'bg-[#1C5456] text-white' : 'bg-white text-[#1C5456]'}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor File Excel/CSV SITB</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-[#1C5456] text-white' : 'bg-white text-[#1C5456]'}`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Impor ({importLogs.length})</span>
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#35907D] text-[#35907D] hover:bg-[#35907D] hover:text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template Contoh (.xlsx)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          {!canImport && activeTab === 'import' ? (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
              <Lock className="w-6 h-6 text-[#CE5924] shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Akses Terbatas</h4>
                <p className="mt-1 leading-relaxed">
                  Fitur impor massal data dari SITB hanya tersedia untuk <strong>Super Admin, Admin Puskesmas, dan Petugas Program TB</strong>. Akun Anda saat ini adalah <em>{currentUser.roleLabel}</em>.
                </p>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-[#1C5456]">Riwayat Impor File SITB</h4>
              <div className="bg-white rounded-2xl border border-[#FBE6C9] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1C5456] text-white">
                    <tr>
                      <th className="py-2.5 px-3">Waktu & Petugas</th>
                      <th className="py-2.5 px-3">Nama File</th>
                      <th className="py-2.5 px-3 text-center">Baru</th>
                      <th className="py-2.5 px-3 text-center">Diperbarui</th>
                      <th className="py-2.5 px-3 text-center">Dilewati</th>
                      <th className="py-2.5 px-3 text-center">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importLogs.map(log => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 block">{log.userName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.fileName}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#58904A]">{log.insertedCount}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#35907D]">{log.updatedCount}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{log.skippedCount}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#CE5924]">{log.errorCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* Step Indicator */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2 rounded-xl border font-bold ${step === 'upload' ? 'bg-[#1C5456] text-white border-[#1C5456]' : 'bg-[#FDF5EB] text-[#1C5456] border-[#FBE6C9]'}`}>
                  1. Unggah Excel/CSV SITB
                </div>
                <div className={`p-2 rounded-xl border font-bold ${step === 'mapping' ? 'bg-[#1C5456] text-white border-[#1C5456]' : 'bg-[#FDF5EB] text-[#1C5456] border-[#FBE6C9]'}`}>
                  2. Pemetaan Kolom
                </div>
                <div className={`p-2 rounded-xl border font-bold ${step === 'preview' ? 'bg-[#1C5456] text-white border-[#1C5456]' : 'bg-[#FDF5EB] text-[#1C5456] border-[#FBE6C9]'}`}>
                  3. Pratinjau & Persetujuan
                </div>
              </div>

              {/* STEP 1: UPLOAD */}
              {step === 'upload' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FDF5EB] border border-[#FBE6C9] flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#35907D] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-[#1C5456]">Prinsip Impor Aman & Ringkas:</p>
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                        <li>Hanya kolom yang dibutuhkan untuk pemantauan & pengingat yang disimpan (bukan seluruh isi file SITB).</li>
                        <li>Pencocokan otomatis memakai <strong>Nomor Register SITB</strong> untuk mencegah data ganda.</li>
                        <li>File mentah otomatis dihapus dari memori browser segera setelah proses impor selesai.</li>
                      </ul>
                    </div>
                  </div>

                  <label className="flex flex-col items-center justify-center p-10 rounded-3xl border-2 border-dashed border-[#35907D] bg-[#FAEEE0]/40 hover:bg-[#FAEEE0] transition-colors cursor-pointer text-center">
                    <Upload className="w-10 h-10 text-[#35907D] mb-2" />
                    <span className="font-heading font-bold text-sm text-[#1C5456]">
                      Klik untuk memilih file Excel (.xlsx) atau CSV hasil ekspor SITB
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Belum punya contoh file? Klik tombol "Unduh Template Contoh (.xlsx)" di kanan atas terlebih dahulu.
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* STEP 2: MAPPING */}
              {step === 'mapping' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#1C5456]">
                        Pemetaan Kolom File: <span className="font-mono text-[#CE5924]">{fileName}</span> ({rawRows.length} baris)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Sistem mencocokkan kolom otomatis. Ubah bila nama kolom file SITB Anda berbeda.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {mappingSavedToast && (
                        <span className="text-[11px] font-bold text-[#58904A]">✓ Template tersimpan</span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveMappingTemplate}
                        className="px-3 py-1.5 rounded-xl border border-[#35907D] text-[#35907D] hover:bg-[#35907D]/10 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Template Pemetaan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9]">
                    {([
                      ['nomorRegisterSitb', 'Nomor Register SITB *'],
                      ['namaLengkap', 'Nama Lengkap Pasien *'],
                      ['nik', 'NIK (Dienkripsi / Terbatas)'],
                      ['noRekamMedis', 'No. Rekam Medis'],
                      ['jenisKelamin', 'Jenis Kelamin (L/P)'],
                      ['umur', 'Umur (Tahun)'],
                      ['alamat', 'Alamat Lengkap'],
                      ['kelurahan', 'Kelurahan'],
                      ['noWhatsApp', 'No. WhatsApp / HP'],
                      ['tanggalMulaiOAT', 'Tgl Mulai Pengobatan'],
                      ['statusPengobatan', 'Status Pengobatan'],
                      ['jadwalAmbilObatBerikutnya', 'Jadwal Ambil Obat Berikutnya'],
                    ] as [keyof SitbColumnMapping, string][]).map(([key, label]) => (
                      <div key={key}>
                        <label className="block font-bold text-[#1C5456] mb-1">{label}</label>
                        <select
                          value={mapping[key]}
                          onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-2 bg-white border border-[#FBE6C9] rounded-xl cursor-pointer"
                        >
                          <option value="">-- Abaikan / Kosongkan --</option>
                          {rawHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={clearRawMemory}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('preview')}
                      className="px-5 py-2 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Lanjut ke Pratinjau & Validasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW & DUPLICATE DIFF APPROVAL */}
              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block">Pasien Baru (Valid)</span>
                      <span className="text-2xl font-black font-mono text-[#58904A]">{newRowsCount}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">Sudah Ada di Sistem (Duplikat)</span>
                      <span className="text-2xl font-black font-mono text-amber-700">{dupRowsCount}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                      <span className="text-[10px] font-bold uppercase text-red-700 block">Baris Error (Dilewati)</span>
                      <span className="text-2xl font-black font-mono text-[#CE5924]">{errRowsCount}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#FBE6C9] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1C5456] text-white">
                        <tr>
                          <th className="py-2.5 px-3">Baris</th>
                          <th className="py-2.5 px-3">No. Register SITB</th>
                          <th className="py-2.5 px-3">Nama & Kelurahan</th>
                          <th className="py-2.5 px-3">Status Validasi</th>
                          <th className="py-2.5 px-3">Perbedaan / Persetujuan Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.map(row => (
                          <tr key={row.rowNumber} className="hover:bg-[#FDF5EB]/40">
                            <td className="py-2.5 px-3 font-mono text-slate-500">#{row.rowNumber}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#1C5456]">
                              {row.mapped?.nomorRegisterSitb || row.raw[mapping.nomorRegisterSitb] || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">
                                {row.mapped?.namaLengkap || row.raw[mapping.namaLengkap] || '-'}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {row.mapped?.kelurahan || '-'} · NIK: {row.mapped?.nik ? `${row.mapped.nik.slice(0, 6)}******${row.mapped.nik.slice(-2)}` : '-'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {row.status === 'new' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#58904A] font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Baru (Siap Simpan)
                                </span>
                              )}
                              {row.status === 'duplicate' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  <RefreshCw className="w-3 h-3" /> Cocok No. SITB
                                </span>
                              )}
                              {row.status === 'error' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-[#CE5924] font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3" /> Error Format
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.status === 'error' && (
                                <span className="text-[11px] text-[#CE5924] font-semibold">{row.errors.join(', ')}</span>
                              )}
                              {row.status === 'new' && (
                                <span className="text-[11px] text-slate-500">Akan ditambahkan sebagai pasien baru</span>
                              )}
                              {row.status === 'duplicate' && (
                                <div className="space-y-1">
                                  {row.diffs && row.diffs.length > 0 ? (
                                    <>
                                      <div className="text-[10px] text-slate-600 space-y-0.5">
                                        {row.diffs.map((d, i) => (
                                          <div key={i}>
                                            <strong>{d.field}:</strong> <span className="line-through text-slate-400">{d.oldVal}</span> → <span className="text-[#35907D] font-bold">{d.newVal}</span>
                                          </div>
                                        ))}
                                      </div>
                                      <label className="inline-flex items-center gap-1.5 font-bold text-[#1C5456] cursor-pointer pt-1">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(approvedDuplicateIds[row.rowNumber])}
                                          onChange={(e) => setApprovedDuplicateIds(prev => ({
                                            ...prev,
                                            [row.rowNumber]: e.target.checked
                                          }))}
                                          className="rounded text-[#35907D]"
                                        />
                                        <span>Setujui perbarui data pasien ini</span>
                                      </label>
                                    </>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">Data identik, otomatis dilewati (tidak digandakan).</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStep('mapping')}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      ← Kembali ke Pemetaan
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-6 py-2.5 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Data Valid ke TEMAN TPT</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

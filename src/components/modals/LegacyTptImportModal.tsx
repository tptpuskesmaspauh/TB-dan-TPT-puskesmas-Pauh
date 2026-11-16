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
  Lock,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { CloseContact, Gender, TargetTptCategory, TPTRegimen } from '../../types/tb';

interface LegacyTptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LegacyMapping {
  namaLengkap: string;
  tanggalLahir: string;
  umur: string;
  jenisKelamin: string;
  alamat: string;
  kelurahan: string;
  noWhatsApp: string;
  tanggalMulaiTPT: string;
  regimenTPT: string;
  statusTPT: string;
  tanggalSelesaiTPT: string;
  kategoriSasaranTPT: string;
  nomorRegisterSitbPasien: string;
}

const MAPPING_STORAGE_KEY = 'teman_tpt_pauh_legacy_tpt_mapping_v1';

const DEFAULT_MAPPING: LegacyMapping = {
  namaLengkap: 'Nama',
  tanggalLahir: 'Tanggal_Lahir',
  umur: 'Umur',
  jenisKelamin: 'Jenis_Kelamin',
  alamat: 'Alamat',
  kelurahan: 'Kelurahan',
  noWhatsApp: 'No_HP',
  tanggalMulaiTPT: 'Tgl_Mulai_TPT',
  regimenTPT: 'Regimen_TPT',
  statusTPT: 'Status_TPT',
  tanggalSelesaiTPT: 'Tgl_Selesai_TPT',
  kategoriSasaranTPT: 'Kategori_Sasaran_TPT',
  nomorRegisterSitbPasien: 'No_Register_SITB_Indeks'
};

interface ParsedLegacyRow {
  rowNumber: number;
  status: 'new' | 'duplicate' | 'error';
  errors: string[];
  duplicateReason?: string;
  mapped?: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>;
}

function normalizeText(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDateString(raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw === 'number' && raw > 25000 && raw < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + raw * 86400000);
    return parsed.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
}

function normalizeRegimen(raw: string): TPTRegimen | undefined {
  const s = raw.toLowerCase();
  if (!s) return undefined;
  if (s.includes('3hp')) return '3HP (Isoniazid + Rifapentin 12 Dosis)';
  if (s.includes('6h')) return '6H (Isoniazid Tiap Hari 6 Bulan)';
  if (s.includes('3hr')) return '3HR (Isoniazid + Rifampisin 3 Bulan)';
  return 'Belum Ditentukan';
}

function normalizeKategori(raw: string): TargetTptCategory {
  const s = raw.toLowerCase();
  if (!s) return 'Tidak ada data';
  if (s.includes('serumah')) return 'Kontak Serumah';
  if (s.includes('erat')) return 'Kontak Erat';
  if (s.includes('balita') || s.includes('<5')) return 'Anak <5 Tahun';
  if (s.includes('odha') || s.includes('imuno')) return 'ODHA / Imunokompromais';
  return 'Kelompok Risiko Lain';
}

export const LegacyTptImportModal: React.FC<LegacyTptImportModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, patients, contacts, importLegacyContacts } = useData();
  const canImport = ['super_admin', 'admin_puskesmas', 'petugas_tb'].includes(currentUser.role);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<LegacyMapping>(() => {
    const saved = localStorage.getItem(MAPPING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MAPPING;
  });
  const [mappingSavedToast, setMappingSavedToast] = useState(false);

  const clearRawMemory = () => {
    setFileName('');
    setRawHeaders([]);
    setRawRows([]);
    setStep('upload');
  };

  const handleClose = () => {
    clearRawMemory();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        Nama: 'Rasyid Alfaruq (Dummy)',
        Tanggal_Lahir: '1990-06-14',
        Umur: 36,
        Jenis_Kelamin: 'L',
        Alamat: 'Jl. Kapalo Koto No. 18',
        Kelurahan: 'Kapalo Koto',
        No_HP: '081371223344',
        Tgl_Mulai_TPT: '2026-08-15',
        Regimen_TPT: '3HP',
        Status_TPT: 'Sedang menjalani TPT',
        Tgl_Selesai_TPT: '',
        Kategori_Sasaran_TPT: 'Kontak Serumah',
        No_Register_SITB_Indeks: ''
      },
      {
        Nama: 'Maira Putri (Dummy)',
        Tanggal_Lahir: '2023-02-11',
        Umur: 3,
        Jenis_Kelamin: 'P',
        Alamat: 'Jl. Pasar Baru No. 9',
        Kelurahan: 'Cupak Tangah',
        No_HP: '082288991100',
        Tgl_Mulai_TPT: '2026-04-01',
        Regimen_TPT: '3HR',
        Status_TPT: 'TPT selesai',
        Tgl_Selesai_TPT: '2026-07-01',
        Kategori_Sasaran_TPT: 'Anak <5 Tahun',
        No_Register_SITB_Indeks: ''
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_TPT_Lama');
    XLSX.writeFile(wb, 'Template_Data_TPT_Lama_Puskesmas_Pauh.xlsx');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

    if (rows.length === 0) {
      alert('File kosong atau tidak berisi data.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const stringRows = rows.map(r => {
      const obj: Record<string, string> = {};
      headers.forEach(h => {
        const val = r[h];
        obj[h] = h.toLowerCase().includes('tgl') || h.toLowerCase().includes('tanggal')
          ? normalizeDateString(val)
          : String(val ?? '').trim();
      });
      return obj;
    });

    // Auto-map matching headers
    const autoMap: LegacyMapping = { ...mapping };
    (Object.keys(autoMap) as (keyof LegacyMapping)[]).forEach(field => {
      const target = autoMap[field].toLowerCase();
      const exact = headers.find(h => h.toLowerCase() === target);
      if (exact) {
        autoMap[field] = exact;
      } else {
        const fuzzy = headers.find(h => {
          const lh = h.toLowerCase();
          if (field === 'namaLengkap') return lh.includes('nama');
          if (field === 'tanggalLahir') return lh.includes('lahir');
          if (field === 'umur') return lh.includes('umur') || lh.includes('usia');
          if (field === 'jenisKelamin') return lh.includes('kelamin') || lh === 'jk';
          if (field === 'alamat') return lh.includes('alamat');
          if (field === 'kelurahan') return lh.includes('kelurahan') || lh.includes('desa');
          if (field === 'noWhatsApp') return lh.includes('hp') || lh.includes('wa') || lh.includes('telp');
          if (field === 'tanggalMulaiTPT') return lh.includes('mulai');
          if (field === 'regimenTPT') return lh.includes('regimen');
          if (field === 'statusTPT') return lh.includes('status');
          if (field === 'tanggalSelesaiTPT') return lh.includes('selesai');
          if (field === 'kategoriSasaranTPT') return lh.includes('kategori') || lh.includes('sasaran');
          if (field === 'nomorRegisterSitbPasien') return lh.includes('sitb') || lh.includes('indeks');
          return false;
        });
        if (fuzzy) autoMap[field] = fuzzy;
      }
    });

    setMapping(autoMap);
    setFileName(file.name);
    setRawHeaders(headers);
    setRawRows(stringRows);
    setStep('mapping');
    e.target.value = '';
  };

  const handleSaveMappingTemplate = () => {
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    setMappingSavedToast(true);
    setTimeout(() => setMappingSavedToast(false), 2500);
  };

  const parsedPreview = useMemo<ParsedLegacyRow[]>(() => {
    return rawRows.map((row, index) => {
      const errors: string[] = [];
      const namaLengkap = (row[mapping.namaLengkap] || '').trim();
      const tanggalLahir = normalizeDateString(row[mapping.tanggalLahir] || '');
      const umurRaw = Number(row[mapping.umur] || 0);
      const jkRaw = (row[mapping.jenisKelamin] || '').trim().toUpperCase();
      const jenisKelamin: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
      const alamat = (row[mapping.alamat] || '').trim() || 'Tidak ada data';
      const kelurahanRaw = (row[mapping.kelurahan] || '').trim();
      const matchedKel = PUSKESMAS_KELURAHAN.find(k => k.toLowerCase() === kelurahanRaw.toLowerCase()) || kelurahanRaw || 'Tidak ada data';
      const noWhatsApp = (row[mapping.noWhatsApp] || '').trim();
      const tglMulai = normalizeDateString(row[mapping.tanggalMulaiTPT] || '');
      const tglSelesai = normalizeDateString(row[mapping.tanggalSelesaiTPT] || '');
      const regimen = normalizeRegimen(row[mapping.regimenTPT] || '');
      const statusTptRaw = (row[mapping.statusTPT] || '').trim();
      const kategori = normalizeKategori(row[mapping.kategoriSasaranTPT] || '');
      const sitbIndeks = (row[mapping.nomorRegisterSitbPasien] || '').trim();

      if (!namaLengkap) errors.push('Nama penerima TPT wajib ada');
      if (tglMulai && !/^\d{4}-\d{2}-\d{2}$/.test(tglMulai)) {
        errors.push(`Format Tgl Mulai TPT tidak valid (${tglMulai})`);
      }
      if (tglSelesai && !/^\d{4}-\d{2}-\d{2}$/.test(tglSelesai)) {
        errors.push(`Format Tgl Selesai TPT tidak valid (${tglSelesai})`);
      }

      // Check linked patient ONLY if nomorRegisterSitbPasien matches an existing patient
      const linkedPatient = sitbIndeks
        ? patients.find(p => p.nomorRegisterSitb.toLowerCase() === sitbIndeks.toLowerCase() || p.id.toLowerCase() === sitbIndeks.toLowerCase())
        : undefined;

      // Duplicate check against existing contacts (nama + tanggal lahir, or nama + alamat)
      const normName = normalizeText(namaLengkap);
      const normAlamat = normalizeText(alamat);
      const existingDup = contacts.find(c => {
        if (normalizeText(c.namaLengkap) !== normName) return false;
        if (tanggalLahir && c.tanggalLahir && c.tanggalLahir === tanggalLahir) return true;
        if (normAlamat && normAlamat !== 'tidak ada data' && normalizeText(c.alamat) === normAlamat) return true;
        return false;
      });

      const isCompleted = statusTptRaw.toLowerCase().includes('selesai') || Boolean(tglSelesai);
      const legacyTptStatus = statusTptRaw || (isCompleted ? 'TPT selesai' : tglMulai ? 'Sedang menjalani TPT' : 'Tidak ada data');

      const mapped: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId: linkedPatient ? linkedPatient.id : '',
        patientName: linkedPatient ? linkedPatient.namaLengkap : '',
        sumberData: 'impor_data_lama',
        kategoriSasaranTPT: kategori,
        legacyTptStatus,
        dataSkriningTidakTersedia: true, // Jangan menebak data skrining yang tidak ada!
        sitbRecorded: false,
        namaLengkap,
        nik: '',
        tanggalLahir: tanggalLahir || undefined,
        umur: umurRaw > 0 ? umurRaw : 0,
        jenisKelamin,
        hubunganDenganPasien: 'Tidak ada data', // Jangan menebak hubungan pasien!
        alamat,
        kelurahan: matchedKel,
        noWhatsApp,
        status: linkedPatient
          ? (isCompleted ? 'TPT selesai' : tglMulai ? 'Sedang menjalani TPT' : 'Belum diskrining')
          : 'Pasien indeks belum terhubung',
        sudahDiskrining: false,
        gejalaBatuk: false,
        gejalaDemam: false,
        gejalaKeringatMalam: false,
        gejalaBeratBadanTurun: false,
        riwayatTB: false,
        riwayatKontakTB: true,
        pemeriksaanLanjutanDiperlukan: false,
        memenuhiKriteriaTPT: Boolean(tglMulai || regimen || isCompleted),
        regimenTPT: regimen,
        tanggalMulaiTPT: tglMulai || undefined,
        tanggalSelesaiTPT: tglSelesai || undefined,
        statusAkhirTPT: isCompleted ? 'Selesai Sesuai Jadwal' : tglMulai ? 'Masih Berlangsung' : undefined
      };

      if (errors.length > 0) {
        return { rowNumber: index + 2, status: 'error', errors };
      }

      if (existingDup) {
        return {
          rowNumber: index + 2,
          status: 'duplicate',
          errors: [],
          duplicateReason: `Cocok dengan data ada (${existingDup.id}: ${existingDup.namaLengkap})`,
          mapped
        };
      }

      return { rowNumber: index + 2, status: 'new', errors: [], mapped };
    });
  }, [rawRows, mapping, patients, contacts]);

  const newRows = parsedPreview.filter(r => r.status === 'new');
  const duplicateRows = parsedPreview.filter(r => r.status === 'duplicate');
  const errorRows = parsedPreview.filter(r => r.status === 'error');

  const handleConfirmImport = () => {
    const toInsert = newRows
      .filter(r => r.mapped)
      .map(r => r.mapped as Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>);

    importLegacyContacts({
      fileName,
      totalRows: rawRows.length,
      toInsert,
      skippedCount: duplicateRows.length,
      errorCount: errorRows.length
    });

    alert(`Impor data TPT lama selesai!\n• ${toInsert.length} data masuk\n• ${duplicateRows.length} kemungkinan duplikat dilewati\n• ${errorRows.length} baris gagal validasi\n\nFile mentah sudah dibersihkan dari memori.`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#F9D059]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-white">
                Impor Data Lama (Hanya TPT Tanpa Pasien Indeks)
              </h3>
              <p className="text-xs text-[#D1E6D9]">
                Unggah data TPT lama apa adanya. Kolom kosong tetap &ldquo;Tidak ada data&rdquo; dan berstatus &ldquo;Pasien indeks belum terhubung&rdquo;.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#FDF5EB]/40 space-y-4 text-xs">
          {!canImport ? (
            <div className="bg-white border border-[#FBE6C9] rounded-2xl p-8 text-center space-y-2">
              <Lock className="w-10 h-10 text-[#CE5924] mx-auto" />
              <h4 className="font-heading font-bold text-sm text-[#1C5456]">Akses Impor Terbatas</h4>
              <p className="text-slate-600 max-w-md mx-auto">
                Hanya <strong>Super Admin</strong>, <strong>Admin Puskesmas</strong>, dan <strong>Petugas Program TB</strong> yang dapat mengimpor data TPT lama.
              </p>
            </div>
          ) : (
            <>
              {step === 'upload' && (
                <div className="space-y-4">
                  <div className="bg-[#D1E6D9]/60 border border-[#6BAE9D]/40 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#1C5456] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-[#193F35]">
                      <p className="font-bold">Aturan Penerimaan Data Lama:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>ID pasien indeks boleh kosong — status otomatis <strong>Pasien indeks belum terhubung</strong>.</li>
                        <li>Data yang tidak ada (seperti riwayat skrining &amp; hubungan pasien) dibiarkan <strong>Tidak ada data</strong> (warna abu-abu) dan tidak ditebak.</li>
                        <li>Duplikat otomatis dicek berdasarkan kesamaan <strong>Nama + Tanggal Lahir + Alamat</strong>.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-dashed border-[#6BAE9D] rounded-2xl p-8 text-center space-y-3">
                    <Upload className="w-10 h-10 text-[#35907D] mx-auto" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#1C5456]">Pilih File Excel (.xlsx) atau CSV Data TPT Lama</h4>
                      <p className="text-slate-500 mt-1">Gunakan data dummy untuk pengujian, bukan data pasien asli.</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <label className="px-4 py-2.5 rounded-xl bg-[#CE5924] hover:bg-[#D77252] text-white font-bold cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Pilih File Excel / CSV</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2.5 rounded-xl border border-[#35907D] text-[#35907D] hover:bg-[#35907D]/10 font-bold cursor-pointer inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Template Contoh (.xlsx)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'mapping' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#FBE6C9] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#1C5456]">File: {fileName}</span>
                      <p className="text-[11px] text-slate-500">{rawRows.length} baris terbaca · Cocokkan kolom seadanya (kosongkan jika tidak ada)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mappingSavedToast && (
                        <span className="text-[11px] font-bold text-[#58904A]">Template tersimpan!</span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveMappingTemplate}
                        className="px-3 py-1.5 rounded-xl border border-[#35907D] text-[#35907D] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Template</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#FBE6C9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'namaLengkap', label: 'Nama Penerima TPT *' },
                      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
                      { key: 'umur', label: 'Umur' },
                      { key: 'jenisKelamin', label: 'Jenis Kelamin' },
                      { key: 'alamat', label: 'Alamat' },
                      { key: 'kelurahan', label: 'Kelurahan' },
                      { key: 'noWhatsApp', label: 'No. HP / WhatsApp' },
                      { key: 'tanggalMulaiTPT', label: 'Tanggal Mulai TPT' },
                      { key: 'regimenTPT', label: 'Regimen TPT' },
                      { key: 'statusTPT', label: 'Status TPT' },
                      { key: 'tanggalSelesaiTPT', label: 'Tanggal Selesai TPT' },
                      { key: 'kategoriSasaranTPT', label: 'Kategori Sasaran TPT' },
                      { key: 'nomorRegisterSitbPasien', label: 'No. Register SITB Indeks (Opsional)' }
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-[11px] font-bold text-[#1C5456] mb-1">{item.label}</label>
                        <select
                          value={mapping[item.key as keyof LegacyMapping]}
                          onChange={(e) => setMapping({ ...mapping, [item.key]: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#FBE6C9] bg-[#FDF5EB]/50 text-xs cursor-pointer"
                        >
                          <option value="">-- Tidak ada di file --</option>
                          {rawHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
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
                      className="px-5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white font-bold cursor-pointer"
                    >
                      Pratinjau Sebelum Simpan →
                    </button>
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-[#D1E6D9] text-[#193F35]">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-[#58904A]" />
                      <div className="font-mono font-black text-lg">{newRows.length}</div>
                      <div className="text-[11px] font-bold">Siap Diimpor</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#F9D059]/40 text-[#193F35]">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-[#CE5924]" />
                      <div className="font-mono font-black text-lg">{duplicateRows.length}</div>
                      <div className="text-[11px] font-bold">Duplikat (Dilewati)</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FBE6C9] text-[#CE5924]">
                      <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-mono font-black text-lg">{errorRows.length}</div>
                      <div className="text-[11px] font-bold">Baris Error</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#FBE6C9] overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#1C5456] text-white text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Baris</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Nama & Kategori</th>
                            <th className="py-2 px-3">Kelurahan</th>
                            <th className="py-2 px-3">TPT & Regimen</th>
                            <th className="py-2 px-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedPreview.map(r => (
                            <tr key={r.rowNumber}>
                              <td className="py-2 px-3 font-mono">{r.rowNumber}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === 'new' ? 'bg-[#D1E6D9] text-[#193F35]' :
                                  r.status === 'duplicate' ? 'bg-[#F9D059] text-[#193F35]' :
                                  'bg-[#CE5924] text-white'
                                }`}>
                                  {r.status === 'new' ? 'Baru' : r.status === 'duplicate' ? 'Duplikat' : 'Error'}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <strong>{r.mapped?.namaLengkap || '-'}</strong>
                                <p className="text-[10px] text-slate-500">{r.mapped?.kategoriSasaranTPT || '-'}</p>
                              </td>
                              <td className="py-2 px-3">{r.mapped?.kelurahan || '-'}</td>
                              <td className="py-2 px-3">
                                <span>{r.mapped?.regimenTPT || 'Tidak ada data'}</span>
                                <p className="text-[10px] text-slate-500">{r.mapped?.legacyTptStatus || '-'}</p>
                              </td>
                              <td className="py-2 px-3 text-[11px]">
                                {r.status === 'error' ? (
                                  <span className="text-[#CE5924] font-semibold">{r.errors.join('; ')}</span>
                                ) : r.status === 'duplicate' ? (
                                  <span className="text-amber-800">{r.duplicateReason}</span>
                                ) : (
                                  <span className="text-slate-600">{r.mapped?.status}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('mapping')}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      ← Kembali ke Pemetaan
                    </button>
                    <button
                      type="button"
                      disabled={newRows.length === 0}
                      onClick={handleConfirmImport}
                      className="px-5 py-2 rounded-xl bg-[#CE5924] hover:bg-[#D77252] disabled:opacity-50 text-white font-bold cursor-pointer"
                    >
                      Simpan {newRows.length} Data TPT Lama
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

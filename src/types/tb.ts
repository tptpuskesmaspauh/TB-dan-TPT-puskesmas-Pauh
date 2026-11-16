/**
 * Types & Data Models for TEMAN TPT - UPTD Puskesmas Pauh
 */

export type RoleType = 'super_admin' | 'admin_puskesmas' | 'petugas_tb' | 'nakes';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  roleLabel: string;
  avatar: string;
  nip?: string;
  phone: string;
}

export type Gender = 'L' | 'P';

export type TBClassification = 'Paru' | 'Ekstraparu';
export type TBBacteriological = 'Terkonfirmasi Bakteriologis (TCM+)' | 'Terdiagnosis Klinis' | 'BTA Positif' | 'Resisten Obat (TB-RO)';
export type TBTreatmentPhase = 'Awal (Intensif)' | 'Lanjutan' | 'Selesai' | 'Putus Berobat (LTFU)';
export type TBTreatmentStatus = 'Sedang Berobat' | 'Pengobatan Lengkap' | 'Sembuh' | 'Gagal' | 'Putus Berobat' | 'Meninggal' | 'Pindah';

export interface IndexPatient {
  id: string; // e.g. "TB-PAUH-2026-001"
  nomorRegisterSitb: string; // Kunci penghubung resmi dengan SITB Kemenkes
  sitbRecorded: boolean; // Penanda: Sudah dicatat di SITB (Ya/Belum)
  sitbRecordedDate?: string;
  sitbRecordedBy?: string;
  nik: string; // akses terbatas / terenkripsi
  noRekamMedis: string; // e.g. "RM-10492"
  namaLengkap: string;
  jenisKelamin: Gender;
  tanggalLahir: string;
  umur: number;
  alamat: string;
  kelurahan: string; // e.g. "Pisang", "Cupak Tangah", etc.
  noWhatsApp: string;
  namaPendamping: string;
  hubunganPendamping: string;
  noWhatsAppPendamping: string;
  tanggalDiagnosis: string;
  klasifikasi: TBClassification;
  lokasiAnatomi: string; // e.g. "Paru kanan lobus atas"
  hasilBakteriologis: TBBacteriological;
  tanggalMulaiOAT: string;
  fasyankes: string; // "UPTD Puskesmas Pauh"
  petugasPenanggungJawab: string;
  regimenOAT: string; // e.g. "2RHZE / 4RH (Kategori 1 FDC)"
  fasePengobatan: TBTreatmentPhase;
  statusPengobatan: TBTreatmentStatus;
  perkiraanSelesai: string;
  komorbiditas: string[]; // ["Diabetes Mellitus", "Hipertensi"]
  catatanKlinis: string;
  kepatuhanMinumObat: 'Sangat Patuh (>95%)' | 'Cukup Patuh (80-95%)' | 'Kurang Patuh (<80%)';
  jadwalAmbilObatBerikutnya: string;
  jadwalAmbilObatTerakhir: string;
  sisaObatHari: number;
  pernahTerlambat: boolean;
  jumlahKeterlambatan: number;
  createdAt: string;
  updatedAt: string;
}

export type ScreeningStatus = 
  | 'Belum diskrining'
  | 'Sudah diskrining';

export type ContactStatus =
  | 'Pasien indeks belum terhubung'
  | 'Belum diskrining'
  | 'Sudah diskrining'
  | 'Belum diperiksa lebih lanjut'
  | 'Sedang menjalani pemeriksaan'
  | 'Memenuhi kriteria TPT'
  | 'Tidak memenuhi kriteria TPT'
  | 'Menunggu keputusan petugas'
  | 'TPT belum dimulai'
  | 'Sedang menjalani TPT'
  | 'TPT selesai'
  | 'TPT dihentikan/putus tindak lanjut';

export type DataSourceType = 'input_langsung' | 'impor_data_lama' | 'impor_sitb';

export type TargetTptCategory =
  | 'Kontak Serumah'
  | 'Kontak Erat'
  | 'Anak <5 Tahun'
  | 'ODHA / Imunokompromais'
  | 'Kelompok Risiko Lain'
  | 'Tidak ada data';

export type TPTRegimen = '3HP (Isoniazid + Rifapentin 12 Dosis)' | '6H (Isoniazid Tiap Hari 6 Bulan)' | '3HR (Isoniazid + Rifampisin 3 Bulan)' | 'Belum Ditentukan';

export interface CloseContact {
  id: string; // e.g. "KE-PAUH-2026-001"
  patientId?: string | null; // BOLEH KOSONG untuk data TPT lama tanpa pasien indeks
  patientName?: string | null; // Denormalized for rapid display
  sumberData?: DataSourceType;
  kategoriSasaranTPT?: TargetTptCategory;
  legacyTptStatus?: string; // Status TPT asli dari data lama sebelum terhubung pasien indeks
  dataSkriningTidakTersedia?: boolean; // True jika data lama tidak memiliki catatan skrining (tampil abu-abu, jangan ditebak)
  sitbRecorded?: boolean; // Penanda kontak & TPT sudah dicatat di SITB
  sitbRecordedDate?: string;
  sitbRecordedBy?: string;
  namaLengkap: string;
  nik: string;
  tanggalLahir?: string;
  umur: number;
  jenisKelamin: Gender;
  hubunganDenganPasien: 'Suami' | 'Istri' | 'Anak' | 'Orang Tua' | 'Saudara Kandung' | 'Lainnya (Serumah)' | 'Tidak ada data';
  alamat: string;
  kelurahan: string;
  noWhatsApp: string;
  status: ContactStatus;
  
  // Skrining
  sudahDiskrining: boolean;
  tanggalSkrining?: string;
  petugasSkrining?: string;
  gejalaBatuk: boolean;
  gejalaDemam: boolean;
  gejalaKeringatMalam: boolean;
  gejalaBeratBadanTurun: boolean;
  gejalaLainnya?: string;
  riwayatTB: boolean;
  riwayatKontakTB: boolean;
  penilaianSkrining?: 'Suspek TB (Bergejala)' | 'Tidak Bergejala (Kandidat Evaluasi TPT)';

  // Pemeriksaan Lanjutan
  pemeriksaanLanjutanDiperlukan: boolean;
  jenisPemeriksaanLanjutan?: 'TCM Dahak' | 'Foto Toraks (Rontgen)' | 'Uji Tuberkulin (Mantoux)' | 'IGRA' | 'Klinis Dokter';
  tanggalPemeriksaanLanjutan?: string;
  hasilPemeriksaanLanjutan?: 'TB Negatif (Aman untuk TPT)' | 'Terkonfirmasi TB Aktif (Alihkan ke OAT)' | 'Hasil Inkonklusif';
  statusDiagnosisTB?: 'Bukan TB Aktif' | 'TB Aktif Terkonfirmasi' | 'Menunggu Hasil';

  // TPT
  memenuhiKriteriaTPT: boolean; // Hasil evaluasi
  alasanKelayakanTPT?: string;
  keputusanTenagaKesehatan?: 'Layak Diberikan TPT' | 'Ditunda Karena Komorbid' | 'Tidak Layak (Ada Kontraindikasi)' | 'Menolak TPT' | 'Belum Ada Keputusan';
  catatanKeputusanNakes?: string;
  nakesPenentu?: string;
  tanggalMulaiTPT?: string;
  regimenTPT?: TPTRegimen;
  jadwalKontrolBerikutnya?: string;
  kepatuhanTPT?: 'Patuh' | 'Cukup' | 'Kurang Patuh' | 'Belum Dinilai';
  efekSampingTPT?: string;
  tanggalSelesaiTPT?: string;
  statusAkhirTPT?: 'Selesai Sesuai Jadwal' | 'Putus Pengobatan' | 'Dihentikan Medis' | 'Pindah' | 'Masih Berlangsung';

  createdAt: string;
  updatedAt: string;
}

export interface MedicationPickup {
  id: string;
  patientId: string;
  patientName: string;
  tanggalJadwal: string;
  tanggalRealisasi?: string;
  jumlahObatHari: number;
  namaObat: string;
  status: 'Tepat Waktu' | 'Terlambat' | 'Belum Diambil' | 'Tidak Hadir';
  petugas: string;
  keluhanPasien?: string;
  efekSamping?: string;
  catatan?: string;
}

export interface PatientFollowup {
  id: string;
  patientId: string;
  patientName: string;
  tanggalFollowup: string;
  bulanPengobatanKe: number;
  beratBadanKg: number;
  kepatuhan: 'Sangat Patuh' | 'Cukup' | 'Tidak Patuh';
  keluhan: string;
  efekSampingOAT: string;
  hasilPemeriksaanDahak?: 'BTA (-)' | 'BTA (+)' | 'Belum Ada Hasil' | 'Tidak Diperiksa';
  edukasiDiberikan: string;
  statusKunjungan: 'Hadir di Puskesmas' | 'Kunjungan Rumah' | 'Telepon / WhatsApp';
  petugas: string;
  rencanaTindakLanjut: string;
}

export interface HomeVisit {
  id: string;
  targetType: 'Pasien TB' | 'Kontak Erat';
  targetId: string;
  targetName: string;
  alamat: string;
  kelurahan: string;
  tanggalKunjungan: string;
  petugas: string;
  tujuan: 'Investigasi Kontak Erat' | 'Pelacakan Mangkir Minum Obat' | 'Edukasi Keluarga & Sanitasi Rumah' | 'Pemantauan Efek Samping';
  hasilKunjungan: string;
  edukasiDiberikan: string;
  kendalaLapang: string;
  rencanaTindakLanjut: string;
  status: 'Selesai' | 'Dijadwalkan' | 'Perlu Kunjungan Ulang';
}

export interface WhatsAppMessage {
  id: string;
  receiverType: 'Pasien TB' | 'Kontak Erat' | 'Keluarga Pendamping';
  receiverName: string;
  noWhatsApp: string;
  templateType: 'Pengingat Ambil Obat' | 'Undangan Skrining Kontak' | 'Jadwal Kontrol TPT' | 'Pemeriksaan Dahak Ulang' | 'Edukasi Kepatuhan';
  pesanTeks: string;
  statusKirim: 'Terkirim' | 'Gagal' | 'Terjadwal' | 'Dibaca';
  waktuKirim: string;
  petugas: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  category: 'Dasar TB' | 'Gejala & Penularan' | 'Terapi Pencegahan (TPT)' | 'Dukungan Keluarga' | 'Mitos & Fakta';
  summary: string;
  content: string;
  keyPoints: string[];
  readingTimeMinutes: number;
  iconName: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}

export interface ImportLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  fileName: string;
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  notes?: string;
}

export interface SitbColumnMapping {
  nomorRegisterSitb: string;
  namaLengkap: string;
  nik: string;
  noRekamMedis: string;
  jenisKelamin: string;
  umur: string;
  alamat: string;
  kelurahan: string;
  noWhatsApp: string;
  tanggalMulaiOAT: string;
  statusPengobatan: string;
  jadwalAmbilObatBerikutnya: string;
}


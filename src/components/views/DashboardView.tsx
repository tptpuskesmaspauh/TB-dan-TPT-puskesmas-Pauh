import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  AlertTriangle, 
  CalendarClock, 
  ArrowRight, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  HeartHandshake, 
  Activity, 
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Pill
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useData } from '../../context/DataContext';
import { PUSKESMAS_KELURAHAN } from '../../data/dummyData';
import { LinkPatientModal } from '../modals/LinkPatientModal';

export const DashboardView: React.FC<{ onOpenAddPatient: () => void }> = ({ onOpenAddPatient }) => {
  const { 
    patients, 
    contacts, 
    pickups, 
    homeVisits, 
    setActiveTab, 
    setSelectedPatientId, 
    setSelectedContactId,
    currentUser
  } = useData();

  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('Semua');
  const [linkModalContactId, setLinkModalContactId] = useState<string | null>(null);

  // Filtered datasets based on Kelurahan
  const filteredPatients = selectedKelurahan === 'Semua' 
    ? patients 
    : patients.filter(p => p.kelurahan === selectedKelurahan);

  const filteredContacts = selectedKelurahan === 'Semua'
    ? contacts
    : contacts.filter(c => c.kelurahan === selectedKelurahan);

  // Pisahkan data lengkap (terhubung pasien indeks) dan data lama (tanpa pasien indeks)
  const completeContacts = filteredContacts.filter(c => Boolean(c.patientId) && c.sumberData !== 'impor_data_lama');
  const legacyUnlinkedContacts = filteredContacts.filter(c => !c.patientId || c.sumberData === 'impor_data_lama');

  // Pasien TB Metrics
  const totalPatients = filteredPatients.length;
  const activePatients = filteredPatients.filter(p => p.statusPengobatan === 'Sedang Berobat').length;
  const curedPatients = filteredPatients.filter(p => p.statusPengobatan === 'Sembuh' || p.statusPengobatan === 'Pengobatan Lengkap').length;
  const ltfuPatients = filteredPatients.filter(p => p.statusPengobatan === 'Putus Berobat').length;

  // Pickups alerts
  const overduePickups = pickups.filter(p => p.status === 'Terlambat');

  // Kontak Erat Metrics (hanya dari data lengkap berpasien indeks agar persentase akurat!)
  const totalContacts = completeContacts.length;
  const screenedContacts = completeContacts.filter(c => c.sudahDiskrining).length;
  const unscreenedContacts = completeContacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia).length;
  const examinedContacts = completeContacts.filter(c => c.pemeriksaanLanjutanDiperlukan && c.tanggalPemeriksaanLanjutan).length;
  const unexaminedContacts = completeContacts.filter(c => c.status === 'Belum diperiksa lebih lanjut' || (c.pemeriksaanLanjutanDiperlukan && !c.tanggalPemeriksaanLanjutan)).length;

  // TPT Metrics (data lengkap vs data lama)
  const eligibleTpt = completeContacts.filter(c => c.memenuhiKriteriaTPT).length;
  const tptInProgress = filteredContacts.filter(c => c.status === 'Sedang menjalani TPT' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'Sedang menjalani TPT')).length;
  const tptCompleted = filteredContacts.filter(c => c.status === 'TPT selesai' || (c.status === 'Pasien indeks belum terhubung' && c.legacyTptStatus === 'TPT selesai')).length;
  const completeTptStartedOrDone = completeContacts.filter(c => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length;
  const tptNotStarted = completeContacts.filter(c => c.status === 'TPT belum dimulai').length;

  // Screening & TPT Rate — dihitung HANYA dari data lengkap dengan pasien indeks!
  const screeningRate = totalContacts > 0 ? Math.round((screenedContacts / totalContacts) * 100) : 0;
  const tptInitiationRate = eligibleTpt > 0 ? Math.round((completeTptStartedOrDone / eligibleTpt) * 100) : 0;

  // SITB Synchronization Status
  const patientsNotInSitb = filteredPatients.filter(p => !p.sitbRecorded).length;
  const contactsNotInSitb = filteredContacts.filter(c => !c.sitbRecorded).length;

  // Chart data: Distribution across 9 Kelurahan
  const kelurahanChartData = PUSKESMAS_KELURAHAN.map(kel => {
    const pts = patients.filter(p => p.kelurahan === kel).length;
    const cts = contacts.filter(c => c.kelurahan === kel).length;
    const tpt = contacts.filter(c => c.kelurahan === kel && (c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai')).length;
    return {
      name: kel.length > 12 ? kel.slice(0, 10) + '..' : kel,
      pasienTB: pts,
      kontakErat: cts,
      tptAktif: tpt
    };
  });

  // TPT Status Breakdown Pie (data lengkap dipisah dengan data lama)
  const completeTptCompleted = completeContacts.filter(c => c.status === 'TPT selesai').length;
  const completeTptInProgress = completeContacts.filter(c => c.status === 'Sedang menjalani TPT').length;
  const completeOther = Math.max(0, totalContacts - (completeTptCompleted + completeTptInProgress + tptNotStarted + unscreenedContacts));

  const tptPieData = [
    { name: 'TPT Selesai', value: completeTptCompleted, color: '#58904A' },
    { name: 'Sedang TPT', value: completeTptInProgress, color: '#35907D' },
    { name: 'Kandidat Belum Mulai', value: tptNotStarted, color: '#D77252' },
    { name: 'Belum Diskrining', value: unscreenedContacts, color: '#CE5924' },
    { name: 'Lainnya / Menunggu', value: completeOther, color: '#6BAE9D' },
    { name: 'Data TPT Lama (Terpisah)', value: legacyUnlinkedContacts.length, color: '#94A3B8' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Friendly Hero Banner with Mascot & 4 Pillars */}
      <div className="bg-gradient-to-br from-[#1C5456] via-[#33736A] to-[#35907D] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF5EB]/15 backdrop-blur-xs text-[#F9D059] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#F9D059]" />
              Inovasi Eliminasi TB 2030 UPTD Puskesmas Pauh
            </div>
            <h1 className="font-heading font-black text-2xl lg:text-3xl tracking-tight text-white">
              Selamat Bertugas, {currentUser.name}!
            </h1>
            <p className="text-sm text-[#D1E6D9] leading-relaxed">
              Sistem terintegrasi memastikan <strong className="text-white">setiap 1 Pasien TB Aktif</strong> terpantau utuh bersama seluruh kontak erat keluarganya demi percepatan cakupan Terapi Pencegahan TB (TPT).
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={onOpenAddPatient}
                className="px-4 py-2 rounded-xl bg-[#D77252] hover:bg-[#CE5924] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>+ Daftarkan Pasien TB Baru</span>
              </button>

              <button
                onClick={() => setActiveTab('screening')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D1E6D9] hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Stethoscope className="w-4 h-4 text-[#F9D059]" />
                <span>Mulai Skrining Kontak</span>
              </button>
            </div>
          </div>

          {/* Mascot Illustration Badge Sesuai Logo Resmi */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-32 h-24 sm:w-44 sm:h-32 rounded-3xl overflow-hidden border-4 border-[#F9D059] shadow-2xl bg-white relative flex items-center justify-center p-1">
              <img 
                src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg" 
                alt="Logo Resmi TEMAN TPT UPTD Puskesmas Pauh" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="mt-2 text-[11px] font-bold text-[#F9D059] tracking-wide bg-[#193F35]/70 px-3 py-0.5 rounded-full shadow-xs">
              Maskot Kapten TPT
            </span>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAEEE0] p-4 rounded-2xl border border-[#FBE6C9]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1C5456]">
          <Filter className="w-4 h-4 text-[#35907D]" />
          <span>Filter Wilayah Kerja (9 Kelurahan Puskesmas Pauh):</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="w-full sm:w-60 bg-white border border-[#FBE6C9] rounded-xl px-3 py-2 text-xs font-medium text-[#193F35] focus:ring-2 focus:ring-[#35907D] focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Kelurahan (Total 9 Kelurahan)</option>
            {PUSKESMAS_KELURAHAN.map(kel => (
              <option key={kel} value={kel}>{kel}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pasien TB Card */}
        <div 
          onClick={() => setActiveTab('patients')}
          className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasien TB Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-[#1C5456]/10 text-[#1C5456] flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1C5456] font-mono tabular-nums">{totalPatients}</span>
            <span className="text-xs text-slate-500">Pasien Terdata</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">{activePatients} sedang berobat</span>
            <span className="text-slate-500">{curedPatients} sembuh</span>
          </div>
        </div>

        {/* Kontak Erat Card */}
        <div 
          onClick={() => setActiveTab('contacts')}
          className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kontak Erat</span>
            <div className="w-9 h-9 rounded-xl bg-[#35907D]/10 text-[#35907D] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#35907D] font-mono tabular-nums">{totalContacts}</span>
            <span className="text-xs text-slate-500">Jiwa Terkoneksi</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#58904A] font-medium">{screenedContacts} sudah diskrining</span>
            <span className="text-[#CE5924] font-bold">{unscreenedContacts} belum</span>
          </div>
        </div>

        {/* TPT Aktif Card */}
        <div 
          onClick={() => setActiveTab('tpt')}
          className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Minum TPT</span>
            <div className="w-9 h-9 rounded-xl bg-[#58904A]/10 text-[#58904A] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#58904A] font-mono tabular-nums">{tptInProgress}</span>
            <span className="text-xs text-slate-500">Kontak Terlindungi</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#35907D] font-medium">{tptCompleted} selesai tuntas</span>
            <span className="text-[#D77252] font-semibold">{tptNotStarted} belum mulai</span>
          </div>
        </div>

        {/* Pengingat Keterlambatan */}
        <div 
          onClick={() => setActiveTab('monitoring')}
          className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#CE5924] uppercase tracking-wider">Keterlambatan OAT</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-[#CE5924] flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#CE5924] font-mono tabular-nums">{overduePickups.length}</span>
            <span className="text-xs text-slate-500">Perlu Tindak Lanjut</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Skrining Tertunda: {unscreenedContacts}</span>
            <span className="text-[#CE5924] font-semibold flex items-center gap-0.5">
              Lihat <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars: Skrining & TPT Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skrining Kontak Rate */}
        <div className="p-4 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9]">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C5456] mb-2">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#35907D]" />
              Cakupan Skrining Kontak Erat
            </span>
            <span className="font-mono text-sm text-[#35907D]">{screeningRate}% ({screenedContacts}/{totalContacts})</span>
          </div>
          <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-[#FBE6C9]">
            <div 
              className="bg-[#35907D] h-full rounded-full transition-all duration-500"
              style={{ width: `${screeningRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Dihitung hanya dari kontak dengan data pasien indeks lengkap (terpisah dari {legacyUnlinkedContacts.length} data TPT lama).
          </p>
        </div>

        {/* TPT Initiation Rate */}
        <div className="p-4 rounded-2xl bg-[#FAEEE0] border border-[#FBE6C9]">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C5456] mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#58904A]" />
              Inisiasi TPT (Data Lengkap Berindeks)
            </span>
            <span className="font-mono text-sm text-[#58904A]">{tptInitiationRate}% ({completeTptStartedOrDone}/{eligibleTpt})</span>
          </div>
          <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-[#FBE6C9]">
            <div 
              className="bg-[#58904A] h-full rounded-full transition-all duration-500"
              style={{ width: `${tptInitiationRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Data TPT lama tanpa pasien indeks ({legacyUnlinkedContacts.length} data) dihitung terpisah agar capaian akurat.
          </p>
        </div>
      </div>

      {/* SITB Kemenkes Synchronization Strip */}
      <div className="bg-white border border-[#FBE6C9] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D1E6D9] text-[#193F35] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#1C5456]">
              Pemantauan Pencatatan ke SITB Kemenkes RI
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Pantau data lapangan TEMAN TPT yang masih perlu ditandai sudah diinput ke aplikasi resmi SITB:
              <strong className="text-[#CE5924] ml-1">{patientsNotInSitb} Pasien TB</strong> ·
              <strong className="text-[#CE5924] ml-1">{contactsNotInSitb} Kontak Erat/TPT</strong> belum ditandai di SITB.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('patients')}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-[#1C5456] hover:bg-[#193F35] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Impor / Cek Pasien SITB
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-[#35907D] hover:bg-[#1C5456] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cek Kontak SITB
          </button>
        </div>
      </div>

      {/* Empty State when filtered kelurahan has zero data */}
      {totalPatients === 0 && totalContacts === 0 && (
        <div className="bg-white border border-dashed border-[#F7D6A5] rounded-2xl p-8 text-center">
          <img
            src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg"
            alt="Maskot Kapten TPT"
            className="w-24 h-24 object-contain mx-auto mb-3 rounded-2xl border border-[#FBE6C9] p-1 bg-[#FDF5EB]"
          />
          <h4 className="font-heading font-bold text-sm text-[#1C5456]">
            Belum ada data pasien di Kelurahan {selectedKelurahan}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tambahkan pasien TB baru atau impor file Excel/CSV dari SITB untuk mulai melacak kontak erat di wilayah ini.
          </p>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Kelurahan Distribution */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1C5456]">
                Distribusi Pasien & Kontak Erat di 9 Kelurahan
              </h3>
              <p className="text-xs text-slate-500">Wilayah Kerja UPTD Puskesmas Pauh Kota Padang</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-[#FDF5EB] text-[#35907D] rounded-lg border border-[#FBE6C9]">
              Recharts Aktual
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kelurahanChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#193F35' }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#193F35' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAEEE0', borderColor: '#FBE6C9', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="pasienTB" name="Pasien TB" fill="#1C5456" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kontakErat" name="Kontak Erat" fill="#35907D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tptAktif" name="TPT Aktif" fill="#F9D059" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: TPT Progress Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-heading font-bold text-sm text-[#1C5456]">
              Status Kelayakan & Capaian TPT
            </h3>
            <p className="text-xs text-slate-500">Proporsi seluruh kontak erat terdaftar</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tptPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tptPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAEEE0', borderColor: '#FBE6C9', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            {tptPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="truncate text-slate-600">{d.name}: <strong className="text-slate-900">{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Action Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert 1: Kontak Belum Diskrining */}
        <div className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#CE5924] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[#1C5456]">
                  Kontak Erat Belum Diskrining ({unscreenedContacts})
                </h4>
                <p className="text-[11px] text-slate-500">Segera hubungi via WhatsApp atau jadwalkan kunjungan rumah</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('screening')}
              className="text-xs font-bold text-[#CE5924] hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {filteredContacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia).slice(0, 3).map(c => (
              <div 
                key={c.id}
                onClick={() => { setSelectedContactId(c.id); setActiveTab('screening'); }}
                className="p-3 rounded-xl bg-[#FDF5EB] border border-[#FBE6C9] hover:bg-[#FAEEE0] cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C5456]">{c.namaLengkap}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#D77252] text-white font-medium">
                      {c.hubunganDenganPasien} ({c.umur} th)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pasien Indeks: <strong className="text-slate-700">{c.patientName || 'Pasien indeks belum terhubung'}</strong> · Kelurahan {c.kelurahan}
                  </p>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-[#35907D] text-white text-[10px] font-bold hover:bg-[#1C5456] shrink-0">
                  Skrining Sekarang
                </button>
              </div>
            ))}

            {unscreenedContacts === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#58904A] mx-auto mb-1" />
                Semua kontak erat telah menjalani skrining awal!
              </div>
            )}
          </div>
        </div>

        {/* Alert 2: Pasien Terlambat Ambil Obat / Jadwal Kunjungan */}
        <div className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-[#CE5924] flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[#1C5456]">
                  Tindak Lanjut Pengambilan Obat & Kunjungan
                </h4>
                <p className="text-[11px] text-slate-500">Cegah putus berobat (Loss to Follow-up)</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('monitoring')}
              className="text-xs font-bold text-[#35907D] hover:underline flex items-center gap-1"
            >
              Buka Jadwal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {/* Overdue items */}
            {overduePickups.map(p => (
              <div 
                key={p.id}
                onClick={() => setActiveTab('monitoring')}
                className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-800">{p.patientName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">
                      Terlambat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Jadwal OAT: {p.tanggalJadwal} · {p.namaObat}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('whatsapp');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#CE5924] text-white text-[10px] font-bold hover:bg-[#D77252] shrink-0"
                >
                  Kirim Pengingat WA
                </button>
              </div>
            ))}

            {/* Upcoming Home visits */}
            {homeVisits.filter(h => h.status === 'Dijadwalkan').map(h => (
              <div 
                key={h.id}
                onClick={() => setActiveTab('followup')}
                className="p-3 rounded-xl bg-[#FDF5EB] border border-[#FBE6C9] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C5456]">{h.targetName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#35907D] text-white font-medium">
                      Kunjungan {h.tanggalKunjungan}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {h.tujuan} · Kelurahan {h.kelurahan}
                  </p>
                </div>
                <span className="text-[10px] text-[#35907D] font-bold">Detail →</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perlu Dilengkapi: Data TPT Lama Tanpa Pasien Indeks */}
      {legacyUnlinkedContacts.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-[#FBE6C9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-heading font-bold text-sm text-[#1C5456]">
                Perlu Dilengkapi: Data TPT Lama Belum Terhubung Pasien Indeks ({legacyUnlinkedContacts.filter(c => !c.patientId).length})
              </h4>
              <p className="text-xs text-slate-500">
                Data penerima TPT ini diterima apa adanya tanpa menebak data yang kosong. Hubungkan ke pasien TB indeks bila sudah ditemukan.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('contacts')}
              className="text-xs font-bold text-[#35907D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Kelola Semua di Kontak Erat <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {legacyUnlinkedContacts.filter(c => !c.patientId).slice(0, 3).map(c => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1C5456]">{c.namaLengkap}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      Data Lama
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {c.kelurahan} · {c.regimenTPT?.split(' ')[0] || 'Regimen -'} ({c.legacyTptStatus || 'TPT'})
                  </p>
                </div>
                <button
                  onClick={() => setLinkModalContactId(c.id)}
                  className="w-full py-1.5 rounded-lg bg-[#1C5456] hover:bg-[#35907D] text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  Hubungkan ke Pasien Indeks
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <LinkPatientModal
        contactId={linkModalContactId}
        onClose={() => setLinkModalContactId(null)}
      />
    </div>
  );
};

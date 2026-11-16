import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  IndexPatient, 
  CloseContact, 
  MedicationPickup, 
  PatientFollowup, 
  HomeVisit, 
  WhatsAppMessage, 
  ActivityLog, 
  UserAccount, 
  RoleType,
  ScreeningStatus,
  ContactStatus,
  TPTRegimen,
  ImportLog
} from '../types/tb';
import { 
  INITIAL_PATIENTS, 
  INITIAL_CONTACTS, 
  INITIAL_PICKUPS, 
  INITIAL_FOLLOWUPS, 
  INITIAL_HOME_VISITS, 
  INITIAL_WA_MESSAGES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_USERS,
  INITIAL_IMPORT_LOGS
} from '../data/dummyData';

export type ActiveNavTab = 
  | 'dashboard'
  | 'patients'
  | 'contacts'
  | 'screening'
  | 'tpt'
  | 'monitoring'
  | 'followup'
  | 'whatsapp'
  | 'education'
  | 'reports'
  | 'users'
  | 'settings';

interface DataContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  isAuthenticated: boolean;
  login: (user: UserAccount) => void;
  logout: () => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  switchRole: (role: RoleType) => void;
  users: UserAccount[];
  
  // Data
  patients: IndexPatient[];
  contacts: CloseContact[];
  pickups: MedicationPickup[];
  followups: PatientFollowup[];
  homeVisits: HomeVisit[];
  whatsappMessages: WhatsAppMessage[];
  auditLogs: ActivityLog[];
  importLogs: ImportLog[];

  // Patient Actions
  addPatient: (patient: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>, initialContacts?: Omit<CloseContact, 'id' | 'patientId' | 'patientName' | 'createdAt' | 'updatedAt'>[]) => IndexPatient;
  updatePatient: (id: string, updates: Partial<IndexPatient>) => void;
  deletePatient: (id: string) => void;
  toggleSitbRecordedPatient: (id: string) => void;
  toggleSitbRecordedContact: (id: string) => void;
  importSitbPatients: (payload: {
    fileName: string;
    totalRows: number;
    toInsert: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>[];
    toUpdate: { id: string; updates: Partial<IndexPatient> }[];
    skippedCount: number;
    errorCount: number;
  }) => void;

  // Contact Actions
  addContact: (contact: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>) => CloseContact;
  updateContact: (id: string, updates: Partial<CloseContact>) => void;
  deleteContact: (id: string) => void;
  linkContactToPatient: (contactId: string, patientId: string, hubungan?: CloseContact['hubunganDenganPasien']) => void;
  importLegacyContacts: (payload: {
    fileName: string;
    totalRows: number;
    toInsert: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>[];
    skippedCount: number;
    errorCount: number;
  }) => void;
  mergeDuplicateContacts: (keepId: string, removeId: string, mergedFields: Partial<CloseContact>) => void;
  saveScreening: (contactId: string, screeningData: {
    gejalaBatuk: boolean;
    gejalaDemam: boolean;
    gejalaKeringatMalam: boolean;
    gejalaBeratBadanTurun: boolean;
    gejalaLainnya?: string;
    riwayatTB: boolean;
    riwayatKontakTB: boolean;
    penilaianSkrining: 'Suspek TB (Bergejala)' | 'Tidak Bergejala (Kandidat Evaluasi TPT)';
    petugasSkrining: string;
  }) => void;
  saveTptDecision: (contactId: string, decisionData: {
    keputusanTenagaKesehatan: 'Layak Diberikan TPT' | 'Ditunda Karena Komorbid' | 'Tidak Layak (Ada Kontraindikasi)' | 'Menolak TPT';
    catatanKeputusanNakes: string;
    nakesPenentu: string;
    memenuhiKriteriaTPT: boolean;
    alasanKelayakanTPT?: string;
    regimenTPT?: TPTRegimen;
    mulaiSekarang?: boolean;
    tanggalMulaiTPT?: string;
  }) => void;

  // Medication Pickup Actions
  recordPickup: (pickupId: string, notes?: string) => void;
  addPickup: (pickup: Omit<MedicationPickup, 'id'>) => void;

  // Followup Actions
  addFollowup: (followup: Omit<PatientFollowup, 'id'>) => void;

  // Home Visit Actions
  addHomeVisit: (visit: Omit<HomeVisit, 'id'>) => void;
  updateHomeVisit: (id: string, updates: Partial<HomeVisit>) => void;

  // WhatsApp Actions
  sendWhatsApp: (msg: Omit<WhatsAppMessage, 'id' | 'waktuKirim'>) => void;

  // Helpers
  getContactsForPatient: (patientId: string) => CloseContact[];
  getPatientSummary: (patientId: string) => {
    totalContacts: number;
    screenedCount: number;
    unscreenedCount: number;
    tptEligibleCount: number;
    tptStartedCount: number;
    tptCompletedCount: number;
  };
  resetAllData: () => void;

  // Selected Items for Drawer/Modals
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'teman_tpt_pauh_';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [users] = useState<UserAccount[]>(INITIAL_USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth');
    return saved !== null ? JSON.parse(saved) : true; // Default true so user can immediately browse or test login
  });
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[1]; // default to Petugas TB
  });

  const login = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auth', JSON.stringify(true));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(user));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auth', JSON.stringify(false));
  };

  const [patients, setPatients] = useState<IndexPatient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [contacts, setContacts] = useState<CloseContact[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [pickups, setPickups] = useState<MedicationPickup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'pickups');
    return saved ? JSON.parse(saved) : INITIAL_PICKUPS;
  });

  const [followups, setFollowups] = useState<PatientFollowup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'followups');
    return saved ? JSON.parse(saved) : INITIAL_FOLLOWUPS;
  });

  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'home_visits');
    return saved ? JSON.parse(saved) : INITIAL_HOME_VISITS;
  });

  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'wa_messages');
    return saved ? JSON.parse(saved) : INITIAL_WA_MESSAGES;
  });

  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [importLogs, setImportLogs] = useState<ImportLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'import_logs');
    return saved ? JSON.parse(saved) : INITIAL_IMPORT_LOGS;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'pickups', JSON.stringify(pickups));
  }, [pickups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'followups', JSON.stringify(followups));
  }, [followups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'home_visits', JSON.stringify(homeVisits));
  }, [homeVisits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'wa_messages', JSON.stringify(whatsappMessages));
  }, [whatsappMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'import_logs', JSON.stringify(importLogs));
  }, [importLogs]);

  // Log audit helper
  const addAuditLog = (action: string, details: string) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      userName: currentUser.name,
      userRole: currentUser.roleLabel,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const switchRole = (role: RoleType) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      addAuditLog('Ganti Peran Akses', `Beralih ke hak akses ${found.roleLabel}`);
    }
  };

  // Add Patient (One-to-many integration: can simultaneously register close contacts!)
  const addPatient = (
    patientData: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>,
    initialContactsData: Omit<CloseContact, 'id' | 'patientId' | 'patientName' | 'createdAt' | 'updatedAt'>[] = []
  ) => {
    const newIdNum = patients.length + 1;
    const newId = `TB-PAUH-2026-${String(newIdNum).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newPatient: IndexPatient = {
      ...patientData,
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setPatients(prev => [newPatient, ...prev]);

    // Create connected close contacts
    if (initialContactsData.length > 0) {
      const createdContacts: CloseContact[] = initialContactsData.map((c, idx) => {
        const contactId = `KE-PAUH-2026-${String(contacts.length + idx + 1).padStart(3, '0')}`;
        return {
          ...c,
          id: contactId,
          patientId: newId,
          patientName: newPatient.namaLengkap,
          createdAt: nowIso,
          updatedAt: nowIso
        };
      });
      setContacts(prev => [...createdContacts, ...prev]);
    }

    addAuditLog('Tambah Pasien TB Baru', `Mendaftarkan pasien ${newPatient.namaLengkap} (${newId}) dengan ${initialContactsData.length} kontak erat awal.`);
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<IndexPatient>) => {
    const nowIso = new Date().toISOString();
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates, updatedAt: nowIso };
        addAuditLog('Pembaruan Data Pasien', `Memperbarui data pasien ${updated.namaLengkap} (${id})`);
        return updated;
      }
      return p;
    }));
  };

  const deletePatient = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setPatients(prev => prev.filter(p => p.id !== id));
      addAuditLog('Hapus Pasien TB', `Menghapus pasien ${patient.namaLengkap} (${id})`);
    }
  };

  // Contact actions
  const addContact = (contactData: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `KE-PAUH-2026-${String(contacts.length + 1).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();
    const newContact: CloseContact = {
      ...contactData,
      sumberData: contactData.sumberData || 'input_langsung',
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    setContacts(prev => [newContact, ...prev]);
    addAuditLog(
      'Tambah Kontak Erat',
      `Mendaftarkan kontak ${newContact.namaLengkap} (${newId})${newContact.patientName ? ` untuk pasien ${newContact.patientName}` : ' (belum terhubung pasien indeks)'}`
    );
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<CloseContact>) => {
    const nowIso = new Date().toISOString();
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates, updatedAt: nowIso };
        addAuditLog('Pembaruan Kontak Erat', `Memperbarui kontak ${updated.namaLengkap} (${id})`);
        return updated;
      }
      return c;
    }));
  };

  const deleteContact = (id: string) => {
    const c = contacts.find(item => item.id === id);
    if (c) {
      setContacts(prev => prev.filter(item => item.id !== id));
      addAuditLog('Hapus Kontak Erat', `Menghapus data kontak ${c.namaLengkap} (${id})`);
    }
  };

  // Save Screening
  const saveScreening = (contactId: string, screeningData: {
    gejalaBatuk: boolean;
    gejalaDemam: boolean;
    gejalaKeringatMalam: boolean;
    gejalaBeratBadanTurun: boolean;
    gejalaLainnya?: string;
    riwayatTB: boolean;
    riwayatKontakTB: boolean;
    penilaianSkrining: 'Suspek TB (Bergejala)' | 'Tidak Bergejala (Kandidat Evaluasi TPT)';
    petugasSkrining: string;
  }) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isSymptomatic = screeningData.gejalaBatuk || screeningData.gejalaDemam || screeningData.gejalaKeringatMalam || screeningData.gejalaBeratBadanTurun;

    let newStatus: ContactStatus = 'Sudah diskrining';
    if (isSymptomatic) {
      newStatus = 'Sedang menjalani pemeriksaan'; // Suspect needs sputum/TCM exam!
    } else {
      newStatus = 'Menunggu keputusan petugas'; // Non-symptomatic awaits Nakes TPT review!
    }

    updateContact(contactId, {
      sudahDiskrining: true,
      dataSkriningTidakTersedia: false,
      tanggalSkrining: todayStr,
      status: newStatus,
      pemeriksaanLanjutanDiperlukan: isSymptomatic,
      jenisPemeriksaanLanjutan: isSymptomatic ? 'TCM Dahak' : 'Foto Toraks (Rontgen)',
      statusDiagnosisTB: isSymptomatic ? 'Menunggu Hasil' : 'Bukan TB Aktif',
      ...screeningData
    });

    addAuditLog('Skrining TB Selesai', `Menyelesaikan skrining kontak ${contactId}: ${screeningData.penilaianSkrining}`);
  };

  // Save TPT Decision by Healthcare Worker
  const saveTptDecision = (contactId: string, decisionData: {
    keputusanTenagaKesehatan: 'Layak Diberikan TPT' | 'Ditunda Karena Komorbid' | 'Tidak Layak (Ada Kontraindikasi)' | 'Menolak TPT';
    catatanKeputusanNakes: string;
    nakesPenentu: string;
    memenuhiKriteriaTPT: boolean;
    alasanKelayakanTPT?: string;
    regimenTPT?: TPTRegimen;
    mulaiSekarang?: boolean;
    tanggalMulaiTPT?: string;
  }) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let status: ContactStatus = 'Memenuhi kriteria TPT';
    if (decisionData.keputusanTenagaKesehatan === 'Tidak Layak (Ada Kontraindikasi)') {
      status = 'Tidak memenuhi kriteria TPT';
    } else if (decisionData.mulaiSekarang) {
      status = 'Sedang menjalani TPT';
    } else if (decisionData.keputusanTenagaKesehatan === 'Layak Diberikan TPT') {
      status = 'TPT belum dimulai';
    }

    updateContact(contactId, {
      ...decisionData,
      status,
      tanggalMulaiTPT: decisionData.mulaiSekarang ? (decisionData.tanggalMulaiTPT || todayStr) : undefined,
      statusAkhirTPT: decisionData.mulaiSekarang ? 'Masih Berlangsung' : undefined,
      kepatuhanTPT: decisionData.mulaiSekarang ? 'Patuh' : undefined
    });

    addAuditLog('Keputusan Medis TPT', `Dokter menetapkan status TPT kontak ${contactId}: ${decisionData.keputusanTenagaKesehatan}`);
  };

  // Medication Pickup actions
  const recordPickup = (pickupId: string, notes?: string) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setPickups(prev => prev.map(p => {
      if (p.id === pickupId) {
        const updated: MedicationPickup = {
          ...p,
          status: 'Tepat Waktu',
          tanggalRealisasi: todayStr,
          catatan: notes || p.catatan,
          petugas: currentUser.name
        };
        addAuditLog('Pengambilan Obat Dicatat', `Realisasi ambil obat pasien ${p.patientName} (${pickupId})`);
        return updated;
      }
      return p;
    }));
  };

  const addPickup = (pickupData: Omit<MedicationPickup, 'id'>) => {
    const newId = `PKP-${Date.now().toString().slice(-4)}`;
    const newPickup: MedicationPickup = { ...pickupData, id: newId };
    setPickups(prev => [newPickup, ...prev]);
    addAuditLog('Jadwal Ambil Obat', `Menjadwalkan ambil obat ${newPickup.patientName} tgl ${newPickup.tanggalJadwal}`);
  };

  // Followup Actions
  const addFollowup = (followupData: Omit<PatientFollowup, 'id'>) => {
    const newId = `FLP-${Date.now().toString().slice(-4)}`;
    const newFollowup: PatientFollowup = { ...followupData, id: newId };
    setFollowups(prev => [newFollowup, ...prev]);
    addAuditLog('Pencatatan Follow-up Bulanan', `Follow-up pasien ${newFollowup.patientName} bulan ke-${newFollowup.bulanPengobatanKe}`);
  };

  // Home Visit Actions
  const addHomeVisit = (visitData: Omit<HomeVisit, 'id'>) => {
    const newId = `HV-${Date.now().toString().slice(-4)}`;
    const newVisit: HomeVisit = { ...visitData, id: newId };
    setHomeVisits(prev => [newVisit, ...prev]);
    addAuditLog('Kunjungan Rumah Baru', `Kunjungan rumah ke ${newVisit.targetName} (${newVisit.kelurahan})`);
  };

  const updateHomeVisit = (id: string, updates: Partial<HomeVisit>) => {
    setHomeVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  // WhatsApp
  const sendWhatsApp = (msgData: Omit<WhatsAppMessage, 'id' | 'waktuKirim'>) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const newMsg: WhatsAppMessage = {
      ...msgData,
      id: `WA-${Date.now().toString().slice(-4)}`,
      waktuKirim: timeStr
    };
    setWhatsappMessages(prev => [newMsg, ...prev]);
    addAuditLog('Pesan WhatsApp Terkirim', `Kirim template ${newMsg.templateType} ke ${newMsg.receiverName} (${newMsg.noWhatsApp})`);
  };

  // Helpers
  const getContactsForPatient = (patientId: string) => {
    return contacts.filter(c => c.patientId === patientId);
  };

  const getPatientSummary = (patientId: string) => {
    const patientContacts = getContactsForPatient(patientId);
    return {
      totalContacts: patientContacts.length,
      screenedCount: patientContacts.filter(c => c.sudahDiskrining).length,
      unscreenedCount: patientContacts.filter(c => !c.sudahDiskrining).length,
      tptEligibleCount: patientContacts.filter(c => c.memenuhiKriteriaTPT).length,
      tptStartedCount: patientContacts.filter(c => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length,
      tptCompletedCount: patientContacts.filter(c => c.status === 'TPT selesai').length,
    };
  };

  const toggleSitbRecordedPatient = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        const nextVal = !p.sitbRecorded;
        addAuditLog(
          'Penanda Pencatatan SITB Pasien',
          `${p.namaLengkap} (${p.nomorRegisterSitb}) ditandai ${nextVal ? 'SUDAH dicatat di SITB' : 'BELUM dicatat di SITB'}`
        );
        return {
          ...p,
          sitbRecorded: nextVal,
          sitbRecordedDate: nextVal ? todayStr : undefined,
          sitbRecordedBy: nextVal ? currentUser.name : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const toggleSitbRecordedContact = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        const nextVal = !c.sitbRecorded;
        addAuditLog(
          'Penanda Pencatatan SITB Kontak/TPT',
          `Kontak ${c.namaLengkap} (${id}) ditandai ${nextVal ? 'SUDAH dicatat di SITB' : 'BELUM dicatat di SITB'}`
        );
        return {
          ...c,
          sitbRecorded: nextVal,
          sitbRecordedDate: nextVal ? todayStr : undefined,
          sitbRecordedBy: nextVal ? currentUser.name : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  const importSitbPatients = (payload: {
    fileName: string;
    totalRows: number;
    toInsert: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>[];
    toUpdate: { id: string; updates: Partial<IndexPatient> }[];
    skippedCount: number;
    errorCount: number;
  }) => {
    const nowIso = new Date().toISOString();
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    setPatients(prev => {
      let nextList = [...prev];

      // Apply approved updates matched by existing id / nomorRegisterSitb
      if (payload.toUpdate.length > 0) {
        const updateMap = new Map(payload.toUpdate.map(u => [u.id, u.updates]));
        nextList = nextList.map(p => {
          const upd = updateMap.get(p.id);
          return upd ? { ...p, ...upd, updatedAt: nowIso } : p;
        });
      }

      // Insert new patients with sequential IDs
      const startNum = nextList.length + 1;
      const inserted: IndexPatient[] = payload.toInsert.map((item, idx) => ({
        ...item,
        id: `TB-PAUH-2026-${String(startNum + idx).padStart(3, '0')}`,
        createdAt: nowIso,
        updatedAt: nowIso
      }));

      return [...inserted, ...nextList];
    });

    const newImportLog: ImportLog = {
      id: `IMP-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      userName: currentUser.name,
      userRole: currentUser.roleLabel,
      fileName: payload.fileName,
      totalRows: payload.totalRows,
      insertedCount: payload.toInsert.length,
      updatedCount: payload.toUpdate.length,
      skippedCount: payload.skippedCount,
      errorCount: payload.errorCount,
      notes: `Impor SITB: ${payload.toInsert.length} baru, ${payload.toUpdate.length} diperbarui, ${payload.skippedCount} dilewati, ${payload.errorCount} error`
    };

    setImportLogs(prev => [newImportLog, ...prev]);
    addAuditLog(
      'Impor Data SITB',
      `Mengimpor file "${payload.fileName}": ${payload.toInsert.length} pasien baru, ${payload.toUpdate.length} diperbarui, ${payload.skippedCount} dilewati, ${payload.errorCount} error.`
    );
  };

  const linkContactToPatient = (
    contactId: string,
    patientId: string,
    hubungan?: CloseContact['hubunganDenganPasien']
  ) => {
    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) return;

    const nowIso = new Date().toISOString();
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        let nextStatus: ContactStatus = c.status;
        if (c.status === 'Pasien indeks belum terhubung') {
          if (c.legacyTptStatus === 'TPT selesai' || c.statusAkhirTPT === 'Selesai Sesuai Jadwal') {
            nextStatus = 'TPT selesai';
          } else if (c.legacyTptStatus === 'Sedang menjalani TPT' || c.tanggalMulaiTPT) {
            nextStatus = 'Sedang menjalani TPT';
          } else if (c.sudahDiskrining) {
            nextStatus = 'Sudah diskrining';
          } else {
            nextStatus = 'Belum diskrining';
          }
        }
        return {
          ...c,
          patientId: targetPatient.id,
          patientName: targetPatient.namaLengkap,
          hubunganDenganPasien: hubungan || c.hubunganDenganPasien,
          status: nextStatus,
          updatedAt: nowIso
        };
      }
      return c;
    }));

    addAuditLog(
      'Hubungkan Pasien Indeks',
      `Menghubungkan kontak/TPT ${contactId} ke pasien indeks ${targetPatient.namaLengkap} (${targetPatient.id}).`
    );
  };

  const importLegacyContacts = (payload: {
    fileName: string;
    totalRows: number;
    toInsert: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>[];
    skippedCount: number;
    errorCount: number;
  }) => {
    const nowIso = new Date().toISOString();
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    setContacts(prev => {
      const startNum = prev.length + 1;
      const inserted: CloseContact[] = payload.toInsert.map((item, idx) => ({
        ...item,
        id: `KE-PAUH-2026-${String(startNum + idx).padStart(3, '0')}`,
        sumberData: item.sumberData || 'impor_data_lama',
        createdAt: nowIso,
        updatedAt: nowIso
      }));
      return [...inserted, ...prev];
    });

    const newImportLog: ImportLog = {
      id: `IMP-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      userName: currentUser.name,
      userRole: currentUser.roleLabel,
      fileName: payload.fileName,
      totalRows: payload.totalRows,
      insertedCount: payload.toInsert.length,
      updatedCount: 0,
      skippedCount: payload.skippedCount,
      errorCount: payload.errorCount,
      notes: `Impor Data TPT Lama/Kontak: ${payload.toInsert.length} baris masuk, ${payload.skippedCount} dilewati, ${payload.errorCount} error`
    };

    setImportLogs(prev => [newImportLog, ...prev]);
    addAuditLog(
      'Impor Data TPT Lama / Kontak',
      `Mengimpor "${payload.fileName}": ${payload.toInsert.length} data masuk, ${payload.skippedCount} dilewati, ${payload.errorCount} error.`
    );
  };

  const mergeDuplicateContacts = (
    keepId: string,
    removeId: string,
    mergedFields: Partial<CloseContact>
  ) => {
    const nowIso = new Date().toISOString();
    const kept = contacts.find(c => c.id === keepId);
    const removed = contacts.find(c => c.id === removeId);

    setContacts(prev =>
      prev
        .filter(c => c.id !== removeId)
        .map(c => (c.id === keepId ? { ...c, ...mergedFields, updatedAt: nowIso } : c))
    );

    addAuditLog(
      'Gabung Data Kontak Ganda',
      `Menggabungkan data duplikat "${removed?.namaLengkap || removeId}" (${removeId}) ke "${kept?.namaLengkap || keepId}" (${keepId}).`
    );
  };

  const resetAllData = () => {
    setPatients(INITIAL_PATIENTS);
    setContacts(INITIAL_CONTACTS);
    setPickups(INITIAL_PICKUPS);
    setFollowups(INITIAL_FOLLOWUPS);
    setHomeVisits(INITIAL_HOME_VISITS);
    setWhatsappMessages(INITIAL_WA_MESSAGES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setImportLogs(INITIAL_IMPORT_LOGS);
    localStorage.clear();
    addAuditLog('Reset Data Demo', 'Data sistem dikembalikan ke pengaturan awal UPTD Puskesmas Pauh');
  };

  return (
    <DataContext.Provider value={{
      activeTab,
      setActiveTab,
      isAuthenticated,
      login,
      logout,
      currentUser,
      setCurrentUser,
      switchRole,
      users,
      patients,
      contacts,
      pickups,
      followups,
      homeVisits,
      whatsappMessages,
      auditLogs,
      importLogs,
      addPatient,
      updatePatient,
      deletePatient,
      toggleSitbRecordedPatient,
      toggleSitbRecordedContact,
      importSitbPatients,
      addContact,
      updateContact,
      deleteContact,
      linkContactToPatient,
      importLegacyContacts,
      mergeDuplicateContacts,
      saveScreening,
      saveTptDecision,
      recordPickup,
      addPickup,
      addFollowup,
      addHomeVisit,
      updateHomeVisit,
      sendWhatsApp,
      getContactsForPatient,
      getPatientSummary,
      resetAllData,
      selectedPatientId,
      setSelectedPatientId,
      selectedContactId,
      setSelectedContactId,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  createSecondaryAuthApp,
  FASKES_CODE,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  sanitizeFirestorePayload,
  normalizeFirestoreDoc
} from '../firebase';
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

export interface ClinicSystemSettings {
  id: string;
  faskesCode: string;
  namaFaskes: string;
  alamat: string;
  noTelp: string;
  email: string;
  waPhoneNumberId: string;
  waBusinessAccountId: string;
  autoReminderHMinus1: boolean;
  autoReminderOverdue: boolean;
}

const DEFAULT_SYSTEM_SETTINGS: ClinicSystemSettings = {
  id: 'pauh_config',
  faskesCode: FASKES_CODE,
  namaFaskes: 'UPTD Puskesmas Pauh',
  alamat: 'Jl. Dr. Moh. Hatta No. 1, Pauh, Kota Padang, Sumatera Barat',
  noTelp: '(0751) 71234',
  email: 'puskesmaspauh@padang.go.id',
  waPhoneNumberId: '109823471829302',
  waBusinessAccountId: '98172381293812',
  autoReminderHMinus1: true,
  autoReminderOverdue: true
};

const ROLE_LABELS: Record<RoleType, string> = {
  super_admin: 'Super Admin / Kepala Puskesmas',
  admin_puskesmas: 'Admin Puskesmas / Tata Usaha',
  petugas_tb: 'Petugas Program TB',
  nakes: 'Tenaga Kesehatan / Dokter Pemeriksa'
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit tidak aktif -> logout otomatis

interface DataContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  authLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  clearAuthError: () => void;
  unverifiedUserEmail: string | null;
  sessionTimeoutNotice: string | null;
  mustChangePassword: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
  changeOwnPassword: (newPassword: string) => Promise<void>;
  createStaffAccount: (payload: {
    name: string;
    email: string;
    password: string;
    role: RoleType;
    nip?: string;
    phone: string;
  }) => Promise<{ ok: boolean; message: string }>;
  updateStaffAccount: (uid: string, updates: { role?: RoleType; isActive?: boolean; name?: string; phone?: string; nip?: string }) => Promise<void>;
  logout: () => Promise<void>;
  currentUser: UserAccount;
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
  systemSettings: ClinicSystemSettings;
  saveSystemSettings: (updates: Partial<ClinicSystemSettings>) => Promise<void>;
  isSeedingData: boolean;

  // Patient Actions
  addPatient: (
    patient: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>,
    initialContacts?: Omit<CloseContact, 'id' | 'patientId' | 'patientName' | 'createdAt' | 'updatedAt'>[]
  ) => IndexPatient;
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
  resetAllData: () => Promise<void>;

  // Selected Items for Drawer/Modals
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const DEFAULT_EMPTY_USER: UserAccount = {
  id: '',
  name: 'Petugas Puskesmas',
  email: '',
  role: 'petugas_tb',
  roleLabel: ROLE_LABELS.petugas_tb,
  avatar: '',
  nip: '',
  phone: '',
  isActive: false,
  mustChangePassword: false,
  faskesCode: FASKES_CODE
};

const DataContext = createContext<DataContextType | undefined>(undefined);

function formatWibTimestamp(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} WIB`;
}

function getNextSequentialId(prefix: string, existingIds: string[], extraOffset = 0): string {
  let maxNum = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const tail = Number(id.slice(prefix.length));
      if (!Number.isNaN(tail) && tail > maxNum) {
        maxNum = tail;
      }
    }
  }
  const next = maxNum + 1 + extraOffset;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err);
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email atau kata sandi salah. Periksa kembali kredensial Anda.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan masuk gagal. Silakan tunggu beberapa menit lalu coba lagi.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Metode masuk Email/Kata Sandi belum diaktifkan di Firebase Console. Silakan aktifkan di Authentication -> Sign-in method atau masuk dengan Google.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Jendela login Google ditutup sebelum selesai.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.';
  }
  return msg || 'Gagal masuk ke sistem.';
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState<string | null>(null);
  const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<UserAccount>(DEFAULT_EMPTY_USER);
  const [users, setUsers] = useState<UserAccount[]>([]);

  const [patients, setPatients] = useState<IndexPatient[]>([]);
  const [contacts, setContacts] = useState<CloseContact[]>([]);
  const [pickups, setPickups] = useState<MedicationPickup[]>([]);
  const [followups, setFollowups] = useState<PatientFollowup[]>([]);
  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<ClinicSystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [isSeedingData, setIsSeedingData] = useState<boolean>(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const unsubscribersRef = useRef<(() => void)[]>([]);
  const seededCheckRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);

  const clearSubscriptions = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // Ignore unsubscribe error
      }
    });
    unsubscribersRef.current = [];
  }, []);

  const writeAuditLog = useCallback(async (action: string, details: string, actor?: UserAccount) => {
    const activeActor = actor || currentUser;
    if (!auth.currentUser || !activeActor.id) return;
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payload = sanitizeFirestorePayload({
      id: logId,
      faskesCode: FASKES_CODE,
      timestamp: formatWibTimestamp(),
      userName: activeActor.name || 'Petugas',
      userRole: activeActor.roleLabel || activeActor.role,
      action,
      details,
      createdByUid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    try {
      await setDoc(doc(db, 'activityLogs', logId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `activityLogs/${logId}`);
    }
  }, [currentUser]);

  const seedDummyDataToFirestore = useCallback(async (uid: string, userName: string, userRoleLabel: string) => {
    setIsSeedingData(true);
    try {
      // Step 1: Commit Index Patients FIRST so exists(/indexPatients/...) rules pass for related collections
      const batchPatients = writeBatch(db);
      for (const patient of INITIAL_PATIENTS) {
        const patientPayload = sanitizeFirestorePayload({
          ...patient,
          faskesCode: FASKES_CODE,
          createdByUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        batchPatients.set(doc(db, 'indexPatients', patient.id), patientPayload);
      }
      await batchPatients.commit();

      // Step 2: Commit Close Contacts, Pickups, Followups, Visits, WA, Logs, and System Settings
      const batchSecondary = writeBatch(db);
      for (const contact of INITIAL_CONTACTS) {
        const contactPayload = sanitizeFirestorePayload({
          ...contact,
          faskesCode: FASKES_CODE,
          createdByUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        batchSecondary.set(doc(db, 'closeContacts', contact.id), contactPayload);
      }
      for (const pickup of INITIAL_PICKUPS) {
        batchSecondary.set(
          doc(db, 'medicationPickups', pickup.id),
          sanitizeFirestorePayload({
            ...pickup,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
      }
      for (const flp of INITIAL_FOLLOWUPS) {
        batchSecondary.set(
          doc(db, 'patientFollowups', flp.id),
          sanitizeFirestorePayload({
            ...flp,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
      }
      for (const visit of INITIAL_HOME_VISITS) {
        batchSecondary.set(
          doc(db, 'homeVisits', visit.id),
          sanitizeFirestorePayload({
            ...visit,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
      }
      for (const msg of INITIAL_WA_MESSAGES) {
        batchSecondary.set(
          doc(db, 'whatsappMessages', msg.id),
          sanitizeFirestorePayload({
            ...msg,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );
      }
      for (const imp of INITIAL_IMPORT_LOGS) {
        batchSecondary.set(
          doc(db, 'importLogs', imp.id),
          sanitizeFirestorePayload({
            ...imp,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );
      }
      for (const log of INITIAL_AUDIT_LOGS) {
        batchSecondary.set(
          doc(db, 'activityLogs', log.id),
          sanitizeFirestorePayload({
            ...log,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );
      }
      batchSecondary.set(
        doc(db, 'systemSettings', 'pauh_config'),
        sanitizeFirestorePayload({
          ...DEFAULT_SYSTEM_SETTINGS,
          updatedByUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
      await batchSecondary.commit();

      const seedLogId = `LOG-SEED-${Date.now()}`;
      await setDoc(
        doc(db, 'activityLogs', seedLogId),
        sanitizeFirestorePayload({
          id: seedLogId,
          faskesCode: FASKES_CODE,
          timestamp: formatWibTimestamp(),
          userName,
          userRole: userRoleLabel,
          action: 'Inisialisasi Data Awal Firestore',
          details: `Memuat data simulasi awal UPTD Puskesmas Pauh (${INITIAL_PATIENTS.length} pasien TB, ${INITIAL_CONTACTS.length} kontak erat/TPT lama).`,
          createdByUid: uid,
          createdAt: serverTimestamp()
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed_dummy');
    } finally {
      setIsSeedingData(false);
    }
  }, []);

  const attachFirestoreListeners = useCallback((userProfile: UserAccount) => {
    clearSubscriptions();

    const makeFaskesQuery = (colName: string) =>
      query(collection(db, colName), where('faskesCode', '==', FASKES_CODE));

    const unsubPatients = onSnapshot(
      makeFaskesQuery('indexPatients'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<IndexPatient>(d.data()));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setPatients(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'indexPatients')
    );

    const unsubContacts = onSnapshot(
      makeFaskesQuery('closeContacts'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<CloseContact>(d.data()));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setContacts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'closeContacts')
    );

    const unsubPickups = onSnapshot(
      makeFaskesQuery('medicationPickups'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<MedicationPickup>(d.data()));
        setPickups(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'medicationPickups')
    );

    const unsubFollowups = onSnapshot(
      makeFaskesQuery('patientFollowups'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<PatientFollowup>(d.data()));
        list.sort((a, b) => (b.tanggalFollowup || '').localeCompare(a.tanggalFollowup || ''));
        setFollowups(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'patientFollowups')
    );

    const unsubVisits = onSnapshot(
      makeFaskesQuery('homeVisits'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<HomeVisit>(d.data()));
        list.sort((a, b) => (b.tanggalKunjungan || '').localeCompare(a.tanggalKunjungan || ''));
        setHomeVisits(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'homeVisits')
    );

    const unsubWa = onSnapshot(
      makeFaskesQuery('whatsappMessages'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<WhatsAppMessage>(d.data()));
        list.sort((a, b) => (b.waktuKirim || '').localeCompare(a.waktuKirim || ''));
        setWhatsappMessages(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'whatsappMessages')
    );

    const unsubImportLogs = onSnapshot(
      makeFaskesQuery('importLogs'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<ImportLog>(d.data()));
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setImportLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'importLogs')
    );

    const unsubActivityLogs = onSnapshot(
      makeFaskesQuery('activityLogs'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeFirestoreDoc<ActivityLog>(d.data()));
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
    );

    const unsubSettings = onSnapshot(
      makeFaskesQuery('systemSettings'),
      (snap) => {
        const configDoc = snap.docs.find((d) => d.id === 'pauh_config');
        if (configDoc) {
          setSystemSettings(normalizeFirestoreDoc<ClinicSystemSettings>(configDoc.data()));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'systemSettings')
    );

    const list: (() => void)[] = [
      unsubPatients,
      unsubContacts,
      unsubPickups,
      unsubFollowups,
      unsubVisits,
      unsubWa,
      unsubImportLogs,
      unsubActivityLogs,
      unsubSettings
    ];

    // PII Isolation: Only Admin Puskesmas / Super Admin can list all staff users
    if (userProfile.role === 'super_admin' || userProfile.role === 'admin_puskesmas') {
      const unsubUsers = onSnapshot(
        makeFaskesQuery('users'),
        (snap) => {
          const staffList = snap.docs.map((d) => {
            const raw = normalizeFirestoreDoc<Record<string, unknown>>(d.data());
            return {
              id: String(raw.uid || d.id),
              name: String(raw.name || ''),
              email: String(raw.email || ''),
              role: (raw.role as RoleType) || 'petugas_tb',
              roleLabel: String(raw.roleLabel || ROLE_LABELS[(raw.role as RoleType) || 'petugas_tb']),
              avatar: String(raw.avatar || ''),
              nip: raw.nip ? String(raw.nip) : undefined,
              phone: String(raw.phone || ''),
              isActive: Boolean(raw.isActive),
              mustChangePassword: Boolean(raw.mustChangePassword),
              faskesCode: String(raw.faskesCode || FASKES_CODE)
            } as UserAccount;
          });
          setUsers(staffList);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );
      list.push(unsubUsers);
    } else {
      setUsers([userProfile]);
    }

    unsubscribersRef.current = list;
  }, [clearSubscriptions]);

  const verifyAndBootstrapUser = useCallback(async (firebaseUser: FirebaseUser) => {
    setAuthError(null);
    setUnverifiedUserEmail(null);

    if (!firebaseUser.emailVerified) {
      setUnverifiedUserEmail(firebaseUser.email || 'Email Anda');
      setIsAuthenticated(false);
      setAuthLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }

    let profile: UserAccount | null = null;

    if (!userSnap.exists()) {
      const emailLower = (firebaseUser.email || '').toLowerCase();
      if (emailLower === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
        const newAdminDoc = sanitizeFirestorePayload({
          uid: firebaseUser.uid,
          faskesCode: FASKES_CODE,
          name: firebaseUser.displayName || 'Super Admin Puskesmas Pauh',
          email: firebaseUser.email || BOOTSTRAP_SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          roleLabel: ROLE_LABELS.super_admin,
          nip: '197804122005011002',
          phone: '081267000101',
          avatar: '',
          isActive: true,
          mustChangePassword: false,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        try {
          await setDoc(userDocRef, newAdminDoc);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        profile = {
          id: firebaseUser.uid,
          name: String(newAdminDoc.name),
          email: String(newAdminDoc.email),
          role: 'super_admin',
          roleLabel: ROLE_LABELS.super_admin,
          avatar: '',
          nip: '197804122005011002',
          phone: '081267000101',
          isActive: true,
          mustChangePassword: false,
          faskesCode: FASKES_CODE
        };
      } else {
        await signOut(auth);
        setIsAuthenticated(false);
        setAuthError(
          `Akun (${firebaseUser.email}) belum terdaftar di koleksi users Puskesmas Pauh. Hubungi Super Admin untuk mendaftarkan dan mengaktifkan akun Anda.`
        );
        setAuthLoading(false);
        return;
      }
    } else {
      const raw = normalizeFirestoreDoc<Record<string, unknown>>(userSnap.data());
      if (raw.isActive !== true) {
        await signOut(auth);
        setIsAuthenticated(false);
        setAuthError('Akun Anda berstatus nonaktif (isActive = false). Hubungi Super Admin UPTD Puskesmas Pauh.');
        setAuthLoading(false);
        return;
      }
      const role = (raw.role as RoleType) || 'petugas_tb';
      profile = {
        id: firebaseUser.uid,
        name: String(raw.name || firebaseUser.displayName || 'Petugas TB'),
        email: String(raw.email || firebaseUser.email || ''),
        role,
        roleLabel: String(raw.roleLabel || ROLE_LABELS[role]),
        avatar: String(raw.avatar || ''),
        nip: raw.nip ? String(raw.nip) : undefined,
        phone: String(raw.phone || ''),
        isActive: true,
        mustChangePassword: Boolean(raw.mustChangePassword),
        faskesCode: String(raw.faskesCode || FASKES_CODE)
      };
    }

    setCurrentUser(profile);
    setMustChangePassword(Boolean(profile.mustChangePassword));
    setIsAuthenticated(true);
    setSessionTimeoutNotice(null);
    setAuthLoading(false);

    attachFirestoreListeners(profile);
    void writeAuditLog('Login Berhasil', `Masuk ke sistem TEMAN TPT sebagai ${profile.roleLabel}`, profile);

    // First-time empty DB bootstrap by Super Admin / Admin Puskesmas
    if (!seededCheckRef.current && (profile.role === 'super_admin' || profile.role === 'admin_puskesmas')) {
      seededCheckRef.current = true;
      try {
        const configSnap = await getDoc(doc(db, 'systemSettings', 'pauh_config'));
        if (!configSnap.exists()) {
          await seedDummyDataToFirestore(firebaseUser.uid, profile.name, profile.roleLabel);
        }
      } catch {
        // Ignore if already seeded or non-blocking
      }
    }
  }, [attachFirestoreListeners, seedDummyDataToFirestore, writeAuditLog]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        clearSubscriptions();
        setIsAuthenticated(false);
        setCurrentUser(DEFAULT_EMPTY_USER);
        setUsers([]);
        setPatients([]);
        setContacts([]);
        setPickups([]);
        setFollowups([]);
        setHomeVisits([]);
        setWhatsappMessages([]);
        setAuditLogs([]);
        setImportLogs([]);
        setMustChangePassword(false);
        setAuthLoading(false);
        return;
      }
      void verifyAndBootstrapUser(fbUser);
    });

    return () => {
      unsubscribe();
      clearSubscriptions();
    };
  }, [clearSubscriptions, verifyAndBootstrapUser]);

  // 30-minute inactivity auto-logout
  const logout = useCallback(async () => {
    if (auth.currentUser && currentUser.id) {
      try {
        await writeAuditLog('Logout Sistem', `Pengguna ${currentUser.name} keluar dari sesi`);
      } catch {
        // Do not block logout if log fails
      }
    }
    clearSubscriptions();
    await signOut(auth);
    setIsAuthenticated(false);
  }, [clearSubscriptions, currentUser, writeAuditLog]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setSessionTimeoutNotice('Sesi berakhir otomatis karena tidak ada aktivitas selama 30 menit demi keamanan data pasien.');
        void logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated, logout]);

  const loginWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    setSessionTimeoutNotice(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const friendly = mapFirebaseAuthError(err);
      setAuthError(friendly);
      throw new Error(friendly);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    setSessionTimeoutNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const friendly = mapFirebaseAuthError(err);
      setAuthError(friendly);
      throw new Error(friendly);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshEmailVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      await verifyAndBootstrapUser(auth.currentUser);
    } else {
      setAuthError('Email masih belum terverifikasi. Silakan klik tautan verifikasi di kotak masuk email Anda terlebih dahulu.');
    }
  };

  const changeOwnPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Tidak ada sesi aktif.');
    await updatePassword(auth.currentUser, newPassword);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mustChangePassword: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
    setMustChangePassword(false);
    void writeAuditLog('Ganti Kata Sandi', 'Pengguna memperbarui kata sandi akunnya.');
  };

  const createStaffAccount = async (payload: {
    name: string;
    email: string;
    password: string;
    role: RoleType;
    nip?: string;
    phone: string;
  }): Promise<{ ok: boolean; message: string }> => {
    if (!auth.currentUser || currentUser.role !== 'super_admin') {
      return { ok: false, message: 'Hanya Super Admin yang berwenang membuat akun petugas baru.' };
    }

    const secondary = createSecondaryAuthApp();
    try {
      const cred = await createUserWithEmailAndPassword(secondary.auth, payload.email.trim(), payload.password);
      await sendEmailVerification(cred.user);
      const newUid = cred.user.uid;

      const userDocPayload = sanitizeFirestorePayload({
        uid: newUid,
        faskesCode: FASKES_CODE,
        name: payload.name.trim(),
        email: payload.email.trim(),
        role: payload.role,
        roleLabel: ROLE_LABELS[payload.role],
        nip: payload.nip?.trim() || '',
        phone: payload.phone.trim(),
        avatar: '',
        isActive: true,
        mustChangePassword: true,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', newUid), userDocPayload);
      await signOut(secondary.auth);
      void writeAuditLog('Tambah Akun Petugas', `Super Admin membuat akun ${payload.name} (${ROLE_LABELS[payload.role]})`);
      return {
        ok: true,
        message: `Akun ${payload.name} berhasil dibuat! Link verifikasi email telah dikirim ke ${payload.email}.`
      };
    } catch (err) {
      return { ok: false, message: mapFirebaseAuthError(err) };
    } finally {
      await secondary.cleanup();
    }
  };

  const updateStaffAccount = async (
    uid: string,
    updates: { role?: RoleType; isActive?: boolean; name?: string; phone?: string; nip?: string }
  ) => {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.role !== undefined) {
      clean.role = updates.role;
      clean.roleLabel = ROLE_LABELS[updates.role];
    }
    if (updates.isActive !== undefined) clean.isActive = updates.isActive;
    if (updates.name !== undefined) clean.name = updates.name;
    if (updates.phone !== undefined) clean.phone = updates.phone;
    if (updates.nip !== undefined) clean.nip = updates.nip;

    try {
      await updateDoc(doc(db, 'users', uid), sanitizeFirestorePayload(clean));
      void writeAuditLog('Pembaruan Akun Petugas', `Memperbarui status/peran akun ${uid}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const saveSystemSettings = async (updates: Partial<ClinicSystemSettings>) => {
    if (!auth.currentUser) return;
    const merged: ClinicSystemSettings = {
      ...systemSettings,
      ...updates,
      id: 'pauh_config',
      faskesCode: FASKES_CODE
    };
    try {
      await setDoc(
        doc(db, 'systemSettings', 'pauh_config'),
        sanitizeFirestorePayload({
          ...merged,
          updatedByUid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
      void writeAuditLog('Perbarui Pengaturan Sistem', 'Menyimpan konfigurasi profil Puskesmas Pauh & pengingat WhatsApp');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'systemSettings/pauh_config');
    }
  };

  // ==================== PATIENT ACTIONS ====================
  const addPatient = (
    patientData: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>,
    initialContactsData: Omit<CloseContact, 'id' | 'patientId' | 'patientName' | 'createdAt' | 'updatedAt'>[] = []
  ): IndexPatient => {
    const newId = getNextSequentialId(
      'TB-PAUH-2026-',
      patients.map((p) => p.id)
    );
    const nowIso = new Date().toISOString();
    const uid = auth.currentUser?.uid || currentUser.id;

    const newPatient: IndexPatient = {
      ...patientData,
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'indexPatients', newId),
          sanitizeFirestorePayload({
            ...patientData,
            id: newId,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );

        if (initialContactsData.length > 0) {
          const batch = writeBatch(db);
          initialContactsData.forEach((c, idx) => {
            const contactId = getNextSequentialId(
              'KE-PAUH-2026-',
              contacts.map((item) => item.id),
              idx
            );
            batch.set(
              doc(db, 'closeContacts', contactId),
              sanitizeFirestorePayload({
                ...c,
                id: contactId,
                faskesCode: FASKES_CODE,
                patientId: newId,
                patientName: newPatient.namaLengkap,
                memenuhiKriteriaTPT: false,
                createdByUid: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              })
            );
          });
          await batch.commit();
        }

        void writeAuditLog(
          'Tambah Pasien TB Baru',
          `Mendaftarkan pasien ${newPatient.namaLengkap} (${newId}) dengan ${initialContactsData.length} kontak erat awal.`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `indexPatients/${newId}`);
      }
    };

    void persist();
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<IndexPatient>) => {
    const allowedKeys = [
      'nomorRegisterSitb', 'sitbRecorded', 'sitbRecordedDate', 'sitbRecordedBy',
      'nik', 'noRekamMedis', 'namaLengkap', 'jenisKelamin', 'tanggalLahir',
      'umur', 'alamat', 'kelurahan', 'noWhatsApp', 'namaPendamping',
      'hubunganPendamping', 'noWhatsAppPendamping', 'tanggalDiagnosis',
      'klasifikasi', 'lokasiAnatomi', 'hasilBakteriologis', 'tanggalMulaiOAT',
      'fasyankes', 'petugasPenanggungJawab', 'regimenOAT', 'fasePengobatan',
      'statusPengobatan', 'perkiraanSelesai', 'komorbiditas', 'catatanKlinis',
      'kepatuhanMinumObat', 'jadwalAmbilObatBerikutnya', 'jadwalAmbilObatTerakhir',
      'sisaObatHari', 'pernahTerlambat', 'jumlahKeterlambatan'
    ];
    const filtered: Record<string, unknown> = { updatedAt: serverTimestamp() };
    for (const k of allowedKeys) {
      if (k in updates && (updates as Record<string, unknown>)[k] !== undefined) {
        filtered[k] = (updates as Record<string, unknown>)[k];
      }
    }

    const persist = async () => {
      try {
        await updateDoc(doc(db, 'indexPatients', id), sanitizeFirestorePayload(filtered));
        const target = patients.find((p) => p.id === id);
        void writeAuditLog('Pembaruan Data Pasien', `Memperbarui data pasien ${target?.namaLengkap || id} (${id})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `indexPatients/${id}`);
      }
    };
    void persist();
  };

  const deletePatient = (id: string) => {
    const target = patients.find((p) => p.id === id);
    const persist = async () => {
      try {
        await deleteDoc(doc(db, 'indexPatients', id));
        void writeAuditLog('Hapus Pasien TB', `Menghapus pasien ${target?.namaLengkap || id} (${id})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `indexPatients/${id}`);
      }
    };
    void persist();
  };

  // ==================== CONTACT ACTIONS ====================
  const addContact = (contactData: Omit<CloseContact, 'id' | 'createdAt' | 'updatedAt'>): CloseContact => {
    const newId = getNextSequentialId(
      'KE-PAUH-2026-',
      contacts.map((c) => c.id)
    );
    const nowIso = new Date().toISOString();
    const uid = auth.currentUser?.uid || currentUser.id;
    const newContact: CloseContact = {
      ...contactData,
      sumberData: contactData.sumberData || 'input_langsung',
      memenuhiKriteriaTPT: Boolean(contactData.memenuhiKriteriaTPT),
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'closeContacts', newId),
          sanitizeFirestorePayload({
            ...newContact,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
        void writeAuditLog(
          'Tambah Kontak Erat',
          `Mendaftarkan kontak ${newContact.namaLengkap} (${newId})${newContact.patientName ? ` untuk pasien ${newContact.patientName}` : ' (belum terhubung pasien indeks)'}`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `closeContacts/${newId}`);
      }
    };
    void persist();
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<CloseContact>) => {
    const allowedKeys = [
      'patientId', 'patientName', 'sumberData', 'kategoriSasaranTPT',
      'legacyTptStatus', 'dataSkriningTidakTersedia', 'sitbRecorded',
      'sitbRecordedDate', 'sitbRecordedBy', 'namaLengkap', 'nik',
      'tanggalLahir', 'umur', 'jenisKelamin', 'hubunganDenganPasien',
      'alamat', 'kelurahan', 'noWhatsApp', 'status', 'sudahDiskrining',
      'tanggalSkrining', 'petugasSkrining', 'gejalaBatuk', 'gejalaDemam',
      'gejalaKeringatMalam', 'gejalaBeratBadanTurun', 'gejalaLainnya',
      'riwayatTB', 'riwayatKontakTB', 'penilaianSkrining',
      'pemeriksaanLanjutanDiperlukan', 'jenisPemeriksaanLanjutan',
      'tanggalPemeriksaanLanjutan', 'hasilPemeriksaanLanjutan',
      'statusDiagnosisTB', 'memenuhiKriteriaTPT', 'alasanKelayakanTPT',
      'keputusanTenagaKesehatan', 'catatanKeputusanNakes', 'nakesPenentu',
      'tanggalMulaiTPT', 'regimenTPT', 'jadwalKontrolBerikutnya',
      'kepatuhanTPT', 'efekSampingTPT', 'tanggalSelesaiTPT', 'statusAkhirTPT'
    ];
    const filtered: Record<string, unknown> = { updatedAt: serverTimestamp() };
    for (const k of allowedKeys) {
      if (k in updates && (updates as Record<string, unknown>)[k] !== undefined) {
        filtered[k] = (updates as Record<string, unknown>)[k];
      }
    }

    const persist = async () => {
      try {
        await updateDoc(doc(db, 'closeContacts', id), sanitizeFirestorePayload(filtered));
        const target = contacts.find((c) => c.id === id);
        void writeAuditLog('Pembaruan Kontak Erat', `Memperbarui kontak ${target?.namaLengkap || id} (${id})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `closeContacts/${id}`);
      }
    };
    void persist();
  };

  const deleteContact = (id: string) => {
    const target = contacts.find((c) => c.id === id);
    const persist = async () => {
      try {
        await deleteDoc(doc(db, 'closeContacts', id));
        void writeAuditLog('Hapus Kontak Erat', `Menghapus data kontak ${target?.namaLengkap || id} (${id})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `closeContacts/${id}`);
      }
    };
    void persist();
  };

  const saveScreening = (
    contactId: string,
    screeningData: {
      gejalaBatuk: boolean;
      gejalaDemam: boolean;
      gejalaKeringatMalam: boolean;
      gejalaBeratBadanTurun: boolean;
      gejalaLainnya?: string;
      riwayatTB: boolean;
      riwayatKontakTB: boolean;
      penilaianSkrining: 'Suspek TB (Bergejala)' | 'Tidak Bergejala (Kandidat Evaluasi TPT)';
      petugasSkrining: string;
    }
  ) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isSymptomatic =
      screeningData.gejalaBatuk ||
      screeningData.gejalaDemam ||
      screeningData.gejalaKeringatMalam ||
      screeningData.gejalaBeratBadanTurun;

    const newStatus: ContactStatus = isSymptomatic
      ? 'Sedang menjalani pemeriksaan'
      : 'Menunggu keputusan petugas';

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

    void writeAuditLog('Skrining TB Selesai', `Menyelesaikan skrining kontak ${contactId}: ${screeningData.penilaianSkrining}`);
  };

  const saveTptDecision = (
    contactId: string,
    decisionData: {
      keputusanTenagaKesehatan: 'Layak Diberikan TPT' | 'Ditunda Karena Komorbid' | 'Tidak Layak (Ada Kontraindikasi)' | 'Menolak TPT';
      catatanKeputusanNakes: string;
      nakesPenentu: string;
      memenuhiKriteriaTPT: boolean;
      alasanKelayakanTPT?: string;
      regimenTPT?: TPTRegimen;
      mulaiSekarang?: boolean;
      tanggalMulaiTPT?: string;
    }
  ) => {
    const todayStr = new Date().toISOString().slice(0, 10);

    let status: ContactStatus = 'Memenuhi kriteria TPT';
    if (decisionData.keputusanTenagaKesehatan === 'Tidak Layak (Ada Kontraindikasi)') {
      status = 'Tidak memenuhi kriteria TPT';
    } else if (decisionData.mulaiSekarang) {
      status = 'Sedang menjalani TPT';
    } else if (decisionData.keputusanTenagaKesehatan === 'Layak Diberikan TPT') {
      status = 'TPT belum dimulai';
    }

    // IMPORTANT: Do NOT include mulaiSekarang in Firestore update (strict hasOnly check)
    const updates: Partial<CloseContact> = {
      keputusanTenagaKesehatan: decisionData.keputusanTenagaKesehatan,
      catatanKeputusanNakes: decisionData.catatanKeputusanNakes,
      nakesPenentu: decisionData.nakesPenentu,
      memenuhiKriteriaTPT: decisionData.memenuhiKriteriaTPT,
      alasanKelayakanTPT: decisionData.alasanKelayakanTPT,
      regimenTPT: decisionData.regimenTPT,
      status,
      tanggalMulaiTPT: decisionData.mulaiSekarang ? (decisionData.tanggalMulaiTPT || todayStr) : undefined,
      statusAkhirTPT: decisionData.mulaiSekarang ? 'Masih Berlangsung' : undefined,
      kepatuhanTPT: decisionData.mulaiSekarang ? 'Patuh' : undefined
    };

    updateContact(contactId, updates);
    void writeAuditLog('Keputusan Medis TPT', `Tenaga Kesehatan menetapkan status TPT kontak ${contactId}: ${decisionData.keputusanTenagaKesehatan}`);
  };

  // ==================== PICKUPS, FOLLOWUPS, VISITS, WA ====================
  const recordPickup = (pickupId: string, notes?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const target = pickups.find((p) => p.id === pickupId);
    const persist = async () => {
      try {
        await updateDoc(
          doc(db, 'medicationPickups', pickupId),
          sanitizeFirestorePayload({
            status: 'Tepat Waktu',
            tanggalRealisasi: todayStr,
            catatan: notes || target?.catatan || '',
            petugas: currentUser.name,
            updatedAt: serverTimestamp()
          })
        );
        void writeAuditLog('Pengambilan Obat Dicatat', `Realisasi ambil obat pasien ${target?.patientName || pickupId} (${pickupId})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `medicationPickups/${pickupId}`);
      }
    };
    void persist();
  };

  const addPickup = (pickupData: Omit<MedicationPickup, 'id'>) => {
    const newId = `PKP-${Date.now().toString().slice(-6)}`;
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'medicationPickups', newId),
          sanitizeFirestorePayload({
            ...pickupData,
            id: newId,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
        void writeAuditLog('Jadwal Ambil Obat', `Menjadwalkan ambil obat ${pickupData.patientName} tgl ${pickupData.tanggalJadwal}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `medicationPickups/${newId}`);
      }
    };
    void persist();
  };

  const addFollowup = (followupData: Omit<PatientFollowup, 'id'>) => {
    const newId = `FLP-${Date.now().toString().slice(-6)}`;
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'patientFollowups', newId),
          sanitizeFirestorePayload({
            ...followupData,
            id: newId,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
        void writeAuditLog('Pencatatan Follow-up Bulanan', `Follow-up pasien ${followupData.patientName} bulan ke-${followupData.bulanPengobatanKe}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `patientFollowups/${newId}`);
      }
    };
    void persist();
  };

  const addHomeVisit = (visitData: Omit<HomeVisit, 'id'>) => {
    const newId = `HV-${Date.now().toString().slice(-6)}`;
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'homeVisits', newId),
          sanitizeFirestorePayload({
            ...visitData,
            id: newId,
            faskesCode: FASKES_CODE,
            createdByUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
        void writeAuditLog('Kunjungan Rumah Baru', `Kunjungan rumah ke ${visitData.targetName} (${visitData.kelurahan})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `homeVisits/${newId}`);
      }
    };
    void persist();
  };

  const updateHomeVisit = (id: string, updates: Partial<HomeVisit>) => {
    const persist = async () => {
      try {
        await updateDoc(
          doc(db, 'homeVisits', id),
          sanitizeFirestorePayload({
            ...updates,
            updatedAt: serverTimestamp()
          })
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `homeVisits/${id}`);
      }
    };
    void persist();
  };

  const sendWhatsApp = (msgData: Omit<WhatsAppMessage, 'id' | 'waktuKirim'>) => {
    const newId = `WA-${Date.now().toString().slice(-6)}`;
    const waktuKirim = formatWibTimestamp();
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        await setDoc(
          doc(db, 'whatsappMessages', newId),
          sanitizeFirestorePayload({
            ...msgData,
            id: newId,
            faskesCode: FASKES_CODE,
            waktuKirim,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );
        void writeAuditLog('Pesan WhatsApp Terkirim', `Kirim template ${msgData.templateType} ke ${msgData.receiverName} (${msgData.noWhatsApp})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `whatsappMessages/${newId}`);
      }
    };
    void persist();
  };

  // ==================== HELPERS ====================
  const getContactsForPatient = (patientId: string) => {
    return contacts.filter((c) => c.patientId === patientId);
  };

  const getPatientSummary = (patientId: string) => {
    const patientContacts = getContactsForPatient(patientId);
    return {
      totalContacts: patientContacts.length,
      screenedCount: patientContacts.filter((c) => c.sudahDiskrining).length,
      unscreenedCount: patientContacts.filter((c) => !c.sudahDiskrining).length,
      tptEligibleCount: patientContacts.filter((c) => c.memenuhiKriteriaTPT).length,
      tptStartedCount: patientContacts.filter((c) => c.status === 'Sedang menjalani TPT' || c.status === 'TPT selesai').length,
      tptCompletedCount: patientContacts.filter((c) => c.status === 'TPT selesai').length
    };
  };

  const toggleSitbRecordedPatient = (id: string) => {
    const p = patients.find((item) => item.id === id);
    if (!p) return;
    const nextVal = !p.sitbRecorded;
    const todayStr = new Date().toISOString().slice(0, 10);
    updatePatient(id, {
      sitbRecorded: nextVal,
      sitbRecordedDate: nextVal ? todayStr : '',
      sitbRecordedBy: nextVal ? currentUser.name : ''
    });
    void writeAuditLog(
      'Penanda Pencatatan SITB Pasien',
      `${p.namaLengkap} (${p.nomorRegisterSitb}) ditandai ${nextVal ? 'SUDAH dicatat di SITB' : 'BELUM dicatat di SITB'}`
    );
  };

  const toggleSitbRecordedContact = (id: string) => {
    const c = contacts.find((item) => item.id === id);
    if (!c) return;
    const nextVal = !c.sitbRecorded;
    const todayStr = new Date().toISOString().slice(0, 10);
    updateContact(id, {
      sitbRecorded: nextVal,
      sitbRecordedDate: nextVal ? todayStr : '',
      sitbRecordedBy: nextVal ? currentUser.name : ''
    });
    void writeAuditLog(
      'Penanda Pencatatan SITB Kontak/TPT',
      `Kontak ${c.namaLengkap} (${id}) ditandai ${nextVal ? 'SUDAH dicatat di SITB' : 'BELUM dicatat di SITB'}`
    );
  };

  const importSitbPatients = (payload: {
    fileName: string;
    totalRows: number;
    toInsert: Omit<IndexPatient, 'id' | 'createdAt' | 'updatedAt'>[];
    toUpdate: { id: string; updates: Partial<IndexPatient> }[];
    skippedCount: number;
    errorCount: number;
  }) => {
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        const batch = writeBatch(db);
        payload.toUpdate.forEach((u) => {
          batch.update(
            doc(db, 'indexPatients', u.id),
            sanitizeFirestorePayload({
              ...u.updates,
              updatedAt: serverTimestamp()
            })
          );
        });
        payload.toInsert.forEach((item, idx) => {
          const newId = getNextSequentialId(
            'TB-PAUH-2026-',
            patients.map((p) => p.id),
            idx
          );
          batch.set(
            doc(db, 'indexPatients', newId),
            sanitizeFirestorePayload({
              ...item,
              id: newId,
              faskesCode: FASKES_CODE,
              createdByUid: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          );
        });

        const logId = `IMP-${Date.now().toString().slice(-6)}`;
        batch.set(
          doc(db, 'importLogs', logId),
          sanitizeFirestorePayload({
            id: logId,
            faskesCode: FASKES_CODE,
            timestamp: formatWibTimestamp(),
            userName: currentUser.name,
            userRole: currentUser.roleLabel,
            fileName: payload.fileName,
            totalRows: payload.totalRows,
            insertedCount: payload.toInsert.length,
            updatedCount: payload.toUpdate.length,
            skippedCount: payload.skippedCount,
            errorCount: payload.errorCount,
            notes: `Impor SITB: ${payload.toInsert.length} baru, ${payload.toUpdate.length} diperbarui, ${payload.skippedCount} dilewati, ${payload.errorCount} error`,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );

        await batch.commit();
        void writeAuditLog(
          'Impor Data SITB',
          `Mengimpor file "${payload.fileName}": ${payload.toInsert.length} pasien baru, ${payload.toUpdate.length} diperbarui, ${payload.skippedCount} dilewati, ${payload.errorCount} error.`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'indexPatients_importSitb');
      }
    };
    void persist();
  };

  const linkContactToPatient = (
    contactId: string,
    patientId: string,
    hubungan?: CloseContact['hubunganDenganPasien']
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    const c = contacts.find((item) => item.id === contactId);
    if (!targetPatient || !c) return;

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

    updateContact(contactId, {
      patientId: targetPatient.id,
      patientName: targetPatient.namaLengkap,
      hubunganDenganPasien: hubungan || c.hubunganDenganPasien,
      status: nextStatus
    });

    void writeAuditLog(
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
    const uid = auth.currentUser?.uid || currentUser.id;
    const persist = async () => {
      try {
        const batch = writeBatch(db);
        payload.toInsert.forEach((item, idx) => {
          const newId = getNextSequentialId(
            'KE-PAUH-2026-',
            contacts.map((c) => c.id),
            idx
          );
          batch.set(
            doc(db, 'closeContacts', newId),
            sanitizeFirestorePayload({
              ...item,
              id: newId,
              faskesCode: FASKES_CODE,
              sumberData: item.sumberData || 'impor_data_lama',
              memenuhiKriteriaTPT: false,
              createdByUid: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          );
        });

        const logId = `IMP-${Date.now().toString().slice(-6)}`;
        batch.set(
          doc(db, 'importLogs', logId),
          sanitizeFirestorePayload({
            id: logId,
            faskesCode: FASKES_CODE,
            timestamp: formatWibTimestamp(),
            userName: currentUser.name,
            userRole: currentUser.roleLabel,
            fileName: payload.fileName,
            totalRows: payload.totalRows,
            insertedCount: payload.toInsert.length,
            updatedCount: 0,
            skippedCount: payload.skippedCount,
            errorCount: payload.errorCount,
            notes: `Impor Data TPT Lama/Kontak: ${payload.toInsert.length} baris masuk, ${payload.skippedCount} dilewati, ${payload.errorCount} error`,
            createdByUid: uid,
            createdAt: serverTimestamp()
          })
        );

        await batch.commit();
        void writeAuditLog(
          'Impor Data TPT Lama / Kontak',
          `Mengimpor "${payload.fileName}": ${payload.toInsert.length} data masuk, ${payload.skippedCount} dilewati, ${payload.errorCount} error.`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'closeContacts_importLegacy');
      }
    };
    void persist();
  };

  const mergeDuplicateContacts = (
    keepId: string,
    removeId: string,
    mergedFields: Partial<CloseContact>
  ) => {
    const kept = contacts.find((c) => c.id === keepId);
    const removed = contacts.find((c) => c.id === removeId);
    const persist = async () => {
      try {
        const batch = writeBatch(db);
        batch.update(
          doc(db, 'closeContacts', keepId),
          sanitizeFirestorePayload({
            ...mergedFields,
            updatedAt: serverTimestamp()
          })
        );
        batch.delete(doc(db, 'closeContacts', removeId));
        await batch.commit();

        void writeAuditLog(
          'Gabung Data Kontak Ganda',
          `Menggabungkan data duplikat "${removed?.namaLengkap || removeId}" (${removeId}) ke "${kept?.namaLengkap || keepId}" (${keepId}).`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `closeContacts_merge_${keepId}_${removeId}`);
      }
    };
    void persist();
  };

  const resetAllData = async () => {
    if (!auth.currentUser) return;
    await seedDummyDataToFirestore(auth.currentUser.uid, currentUser.name, currentUser.roleLabel);
  };

  return (
    <DataContext.Provider
      value={{
        activeTab,
        setActiveTab,
        authLoading,
        isAuthenticated,
        authError,
        clearAuthError: () => setAuthError(null),
        unverifiedUserEmail,
        sessionTimeoutNotice,
        mustChangePassword,
        loginWithEmail,
        loginWithGoogle,
        resendVerificationEmail,
        refreshEmailVerification,
        changeOwnPassword,
        createStaffAccount,
        updateStaffAccount,
        logout,
        currentUser,
        users,
        patients,
        contacts,
        pickups,
        followups,
        homeVisits,
        whatsappMessages,
        auditLogs,
        importLogs,
        systemSettings,
        saveSystemSettings,
        isSeedingData,
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
      }}
    >
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

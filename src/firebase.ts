import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const FASKES_CODE = 'P137107';
export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'tpt.puskesmaspauh@gmail.com';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function createSecondaryAuthApp(): { app: FirebaseApp; auth: Auth; cleanup: () => Promise<void> } {
  const secondaryName = `secondary-admin-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  return {
    app: secondaryApp,
    auth: secondaryAuth,
    cleanup: async () => {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Firestore client is offline.');
    }
  }
}

testConnection();

/**
 * Remove undefined properties and enforce string bounds matching firebase-blueprint.json
 */
export function sanitizeFirestorePayload<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (typeof val === 'string') {
      cleaned[key] = val.length > 980 ? val.slice(0, 980) : val;
    } else if (Array.isArray(val)) {
      cleaned[key] = val.slice(0, 20);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Convert Firestore Timestamp fields back into ISO strings for UI state
 */
export function normalizeFirestoreDoc<T>(data: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val instanceof Timestamp) {
      result[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      result[key] = (val as { toDate: () => Date }).toDate().toISOString();
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  stageReached: number;
  createdAt: string;
  timestamp?: Timestamp;
}

export interface AdminSettings {
  passwordHash: string;
  isConfigured: boolean;
  updatedAt: string;
}

/**
 * Save a student's game score to the Firestore leaderboard collection
 */
export async function saveLeaderboardEntry(nickname: string, score: number, stageReached: number): Promise<string> {
  const path = 'leaderboard';
  try {
    const docRef = await addDoc(collection(db, path), {
      nickname: nickname.trim().slice(0, 30),
      score: Math.max(0, Math.floor(score)),
      stageReached: Math.min(3, Math.max(1, stageReached)),
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetch top 10 leaderboard entries
 */
export async function getTopLeaderboard(maxLimit = 10): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const q = query(
      collection(db, path),
      orderBy('score', 'desc'),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        nickname: data.nickname || '익명',
        score: data.score || 0,
        stageReached: data.stageReached || 1,
        createdAt: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Real-time listener for top 10 leaderboard
 */
export function subscribeToLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    orderBy('score', 'desc'),
    limit(10)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: LeaderboardEntry[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          nickname: data.nickname || '익명',
          score: data.score || 0,
          stageReached: data.stageReached || 1,
          createdAt: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()),
        };
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Leaderboard snapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Clear the leaderboard (for Teacher Administrator)
 */
export async function clearAllLeaderboardEntries(): Promise<number> {
  const path = 'leaderboard';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Get Teacher Admin settings
 */
export async function getTeacherSettings(): Promise<AdminSettings | null> {
  const path = 'settings/teacher';
  try {
    const docRef = doc(db, 'settings', 'teacher');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      passwordHash: data.passwordHash || '',
      isConfigured: !!data.isConfigured,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save or update Teacher Admin password hash
 */
export async function setTeacherSettings(passwordHash: string): Promise<void> {
  const path = 'settings/teacher';
  try {
    const docRef = doc(db, 'settings', 'teacher');
    await setDoc(docRef, {
      passwordHash,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  durationMs: number;
}

/**
 * Mandatory Firebase Full CRUD Verification:
 * Actually tests: CREATE -> READ -> UPDATE -> DELETE on Firestore.
 * Strictly verifies real database connectivity without spoofing.
 */
export async function verifyFirestoreFullCRUD(): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const testDocRef = doc(db, '_connection_tests', testId);

  const details = {
    create: false,
    read: false,
    update: false,
    delete: false,
  };

  try {
    // 1. CREATE test document
    await setDoc(testDocRef, {
      status: 'testing_create',
      testedAt: new Date().toISOString(),
    });
    details.create = true;

    // 2. READ test document
    const readSnap = await getDoc(testDocRef);
    if (!readSnap.exists()) {
      throw new Error('Created test document could not be read back');
    }
    details.read = true;

    // 3. UPDATE test document
    await updateDoc(testDocRef, {
      status: 'testing_update_ok',
    });
    details.update = true;

    // 4. DELETE test document
    await deleteDoc(testDocRef);
    details.delete = true;

    return {
      success: true,
      message: 'Cloud Firestore 연결 및 쓰기·읽기·수정·삭제(CRUD) 검증 성공',
      details,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Firebase CRUD Verification Failed:', errorMsg);

    // Attempt cleanup if failed halfway
    try {
      await deleteDoc(testDocRef);
    } catch {
      // ignore cleanup fail
    }

    return {
      success: false,
      message: `Firestore 연결 검증 실패: ${errorMsg}`,
      details,
      durationMs: Date.now() - startTime,
    };
  }
}

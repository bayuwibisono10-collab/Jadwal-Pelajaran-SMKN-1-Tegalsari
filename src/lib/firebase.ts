import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ScheduleSlot, Teacher, SchoolClass, SchoolConfig, WeekRotationType } from '../types/schedule';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'config', 'general'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
    return false;
  }
}

// ================= SYNC HELPERS =================

export async function saveConfigToFirestore(config: SchoolConfig): Promise<void> {
  try {
    const configRef = doc(db, 'config', 'general');
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save config to Firestore:', err);
  }
}

export async function saveSlotToFirestore(slot: ScheduleSlot): Promise<void> {
  try {
    const slotRef = doc(db, 'schedule', slot.id);
    await setDoc(slotRef, {
      ...slot,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to save slot to Firestore:', err);
  }
}

export async function deleteSlotFromFirestore(slotId: string): Promise<void> {
  try {
    const slotRef = doc(db, 'schedule', slotId);
    await deleteDoc(slotRef);
  } catch (err) {
    console.error('Failed to delete slot from Firestore:', err);
  }
}

export async function saveAllSlotsToFirestore(slots: ScheduleSlot[]): Promise<void> {
  try {
    // Firestore batches limit 500 ops
    const chunkSize = 400;
    for (let i = 0; i < slots.length; i += chunkSize) {
      const chunk = slots.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((slot) => {
        const ref = doc(db, 'schedule', slot.id);
        batch.set(ref, { ...slot, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to batch save slots to Firestore:', err);
  }
}

export async function syncScheduleSlotsToFirestore(slots: ScheduleSlot[]): Promise<void> {
  try {
    const existingSnap = await getDocs(collection(db, 'schedule'));
    const newSlotIds = new Set(slots.map(s => s.id));
    
    // Batch deletes for removed slots
    const toDeleteDocs = existingSnap.docs.filter(d => !newSlotIds.has(d.id));
    for (let i = 0; i < toDeleteDocs.length; i += 400) {
      const chunk = toDeleteDocs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    // Save remaining/new slots
    await saveAllSlotsToFirestore(slots);
  } catch (err) {
    console.error('Failed to sync schedule slots with deletion to Firestore:', err);
  }
}

export async function saveTeachersToFirestore(teachers: Teacher[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    teachers.forEach((t) => {
      const ref = doc(db, 'teachers', t.id);
      batch.set(ref, { ...t, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to save teachers to Firestore:', err);
  }
}

export async function saveClassesToFirestore(classes: SchoolClass[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    classes.forEach((c) => {
      const ref = doc(db, 'classes', c.id);
      batch.set(ref, { ...c, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to save classes to Firestore:', err);
  }
}

// Upload current local database to Firestore (Seed / Publish Sync)
export async function uploadFullDatabaseToFirestore(
  schedule: ScheduleSlot[],
  teachers: Teacher[],
  classes: SchoolClass[],
  config: SchoolConfig
): Promise<boolean> {
  try {
    await saveConfigToFirestore(config);
    await saveTeachersToFirestore(teachers);
    await saveClassesToFirestore(classes);
    await saveAllSlotsToFirestore(schedule);
    return true;
  } catch (err) {
    console.error('Failed to push full database to Firestore:', err);
    return false;
  }
}

// Download full database from Firestore
export async function fetchFullDatabaseFromFirestore(): Promise<{
  config?: SchoolConfig;
  schedule?: ScheduleSlot[];
  teachers?: Teacher[];
  classes?: SchoolClass[];
} | null> {
  try {
    const configSnap = await getDoc(doc(db, 'config', 'general'));
    const teachersSnap = await getDocs(collection(db, 'teachers'));
    const classesSnap = await getDocs(collection(db, 'classes'));
    const scheduleSnap = await getDocs(collection(db, 'schedule'));

    const result: {
      config?: SchoolConfig;
      schedule?: ScheduleSlot[];
      teachers?: Teacher[];
      classes?: SchoolClass[];
    } = {};

    if (configSnap.exists()) {
      result.config = configSnap.data() as SchoolConfig;
    }
    if (!teachersSnap.empty) {
      result.teachers = teachersSnap.docs.map((d) => d.data() as Teacher);
    }
    if (!classesSnap.empty) {
      result.classes = classesSnap.docs.map((d) => d.data() as SchoolClass);
    }
    if (!scheduleSnap.empty) {
      result.schedule = scheduleSnap.docs.map((d) => d.data() as ScheduleSlot);
    }

    return result;
  } catch (err) {
    console.error('Failed to fetch full database from Firestore:', err);
    return null;
  }
}

// Subscribe to real-time updates for automatic sync across all clients and TV mode
export function subscribeToRealtimeDatabase(callbacks: {
  onConfigChange?: (config: SchoolConfig) => void;
  onScheduleChange?: (schedule: ScheduleSlot[]) => void;
  onTeachersChange?: (teachers: Teacher[]) => void;
  onClassesChange?: (classes: SchoolClass[]) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'error') => void;
}) {
  const unsubscribes: Array<() => void> = [];

  try {
    if (callbacks.onStatusChange) callbacks.onStatusChange('connecting');

    // 1. Config listener
    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snap) => {
      if (snap.exists() && callbacks.onConfigChange) {
        callbacks.onConfigChange(snap.data() as SchoolConfig);
      }
      if (callbacks.onStatusChange) callbacks.onStatusChange('connected');
    }, (err) => {
      console.warn('Firestore config snapshot error:', err);
      if (callbacks.onStatusChange) callbacks.onStatusChange('error');
    });
    unsubscribes.push(unsubConfig);

    // 2. Schedule listener
    const unsubSchedule = onSnapshot(collection(db, 'schedule'), (snap) => {
      if (!snap.empty && callbacks.onScheduleChange) {
        const slots = snap.docs.map((d) => d.data() as ScheduleSlot);
        callbacks.onScheduleChange(slots);
      }
    }, (err) => {
      console.warn('Firestore schedule snapshot error:', err);
    });
    unsubscribes.push(unsubSchedule);

    // 3. Teachers listener
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      if (!snap.empty && callbacks.onTeachersChange) {
        const tList = snap.docs.map((d) => d.data() as Teacher);
        callbacks.onTeachersChange(tList);
      }
    }, (err) => {
      console.warn('Firestore teachers snapshot error:', err);
    });
    unsubscribes.push(unsubTeachers);

    // 4. Classes listener
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      if (!snap.empty && callbacks.onClassesChange) {
        const cList = snap.docs.map((d) => d.data() as SchoolClass);
        callbacks.onClassesChange(cList);
      }
    }, (err) => {
      console.warn('Firestore classes snapshot error:', err);
    });
    unsubscribes.push(unsubClasses);

  } catch (err) {
    console.error('Error establishing real-time Firestore subscriptions:', err);
    if (callbacks.onStatusChange) callbacks.onStatusChange('error');
  }

  return () => {
    unsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

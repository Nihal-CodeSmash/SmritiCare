// =============================================
// SMRITI CARE — Dexie.js (IndexedDB) Schema
// =============================================

import Dexie, { type Table } from 'dexie';
import type {
  Patient,
  GameSession,
  GameAttempt,
  DomainScore,
  PatientDifficulty,
  Reminder,
  ReminderLog,
  Alert,
  SyncQueueItem,
  User,
} from '@/types';

export class SmritiCareDB extends Dexie {
  users!: Table<User>;
  patients!: Table<Patient>;
  gameSessions!: Table<GameSession>;
  gameAttempts!: Table<GameAttempt>;
  domainScores!: Table<DomainScore>;
  patientDifficulty!: Table<PatientDifficulty>;
  reminders!: Table<Reminder>;
  reminderLogs!: Table<ReminderLog>;
  alerts!: Table<Alert>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('smriti-care-db');
    this.version(1).stores({
      users: 'id, email, role',
      patients: 'id, caregiver_id, sync_status, updated_at',
      gameSessions: 'id, [patient_id+domain], patient_id, domain, started_at, sync_status',
      gameAttempts: 'id, session_id, patient_id, domain, created_at, sync_status',
      domainScores: 'id, patient_id, domain, score_date, sync_status',
      patientDifficulty: 'id, patient_id, domain, updated_at',
      reminders: 'id, patient_id, type, enabled, sync_status',
      reminderLogs: 'id, reminder_id, patient_id, scheduled_at, sync_status',
      alerts: 'id, patient_id, domain, type, acknowledged, sync_status',
      syncQueue: 'id, table_name, record_id, operation, created_at',
    });
  }
}

export const db = new SmritiCareDB();

// ---- Helper: Add to sync queue ----
export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, unknown>
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table_name: tableName,
    record_id: recordId,
    operation,
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

// ---- Helper: Get domain difficulty for a patient ----
export async function getDomainDifficulty(
  patientId: string,
  domain: string
): Promise<number> {
  const record = await db.patientDifficulty
    .where({ patient_id: patientId, domain })
    .first();
  return record?.level ?? 1;
}

// ---- Helper: Update domain difficulty ----
export async function updateDomainDifficulty(
  patientId: string,
  domain: string,
  level: number
) {
  const existing = await db.patientDifficulty
    .where({ patient_id: patientId, domain })
    .first();

  if (existing) {
    await db.patientDifficulty.update(existing.id, {
      level: level as import('@/types').DifficultyLevel,
      updated_at: new Date().toISOString(),
    });
  } else {
    await db.patientDifficulty.add({
      id: crypto.randomUUID(),
      patient_id: patientId,
      domain: domain as import('@/types').Domain,
      level: level as import('@/types').DifficultyLevel,
      updated_at: new Date().toISOString(),
    });
  }
}

// ---- Helper: Get recent attempts for adaptive engine ----
export async function getRecentAttempts(
  patientId: string,
  domain: string,
  limit: number = 3
): Promise<GameAttempt[]> {
  const all = await db.gameAttempts
    .where({ patient_id: patientId, domain })
    .toArray();
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

// ---- Helper: Calculate rolling accuracy ----
export async function getRollingAccuracy(
  patientId: string,
  domain: string,
  limit: number = 3
): Promise<number | null> {
  const recent = await getRecentAttempts(patientId, domain, limit);
  if (recent.length < limit) return null;
  const correct = recent.filter((a) => a.correct).length;
  return correct / recent.length;
}

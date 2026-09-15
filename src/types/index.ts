// =============================================
// SMRITI CARE — Core Types
// =============================================

export type Language = 'en' | 'hi' | 'as' | 'mni' | 'lus' | 'njz';
export type Region = 'assam' | 'manipur' | 'meghalaya' | 'mizoram' | 'general';
export type UserRole = 'caregiver' | 'patient';
export type SyncStatus = 'synced' | 'pending' | 'conflict';
export type Domain = 'memory' | 'attention' | 'routine' | 'pattern';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertType = 'decline' | 'missed_reminder' | 'inactivity' | 'repeated_difficulty';
export type ReminderType = 'medicine' | 'hydration' | 'daily_activity' | 'appointment';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'interval';

// ---- User / Auth ----
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language: Language;
  created_at: string;
}

// ---- Patient ----
export interface Patient {
  id: string;
  caregiver_id: string;
  display_name: string;
  age?: number;
  preferred_language: Language;
  region: Region;
  baseline_status: 'pending' | 'provisional' | 'established';
  device_id?: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  image_url: string;
}

export interface PatientDetails {
  patient_id: string;
  address: string;
  phone: string;
}

// ---- Game Session ----
export interface GameSession {
  id: string;
  patient_id: string;
  domain: Domain;
  difficulty: DifficultyLevel;
  started_at: string;
  ended_at?: string;
  score: number; // 0–100
  attempts_count: number;
  correct_count: number;
  sync_status: SyncStatus;
}

// ---- Game Attempt (individual question within a session) ----
export interface GameAttempt {
  id: string;
  session_id: string;
  patient_id: string;
  domain: Domain;
  question_id: string;
  difficulty: DifficultyLevel;
  correct: boolean;
  response_time_ms?: number;
  created_at: string;
  sync_status: SyncStatus;
}

// ---- Domain Score ----
export interface DomainScore {
  id: string;
  patient_id: string;
  domain: Domain;
  score: number; // 0–100
  baseline_score?: number;
  session_count: number;
  score_date: string;
  sync_status: SyncStatus;
}

// ---- Patient Difficulty (per domain) ----
export interface PatientDifficulty {
  id: string;
  patient_id: string;
  domain: Domain;
  level: DifficultyLevel;
  updated_at: string;
}

// ---- Reminder ----
export interface Reminder {
  id: string;
  patient_id: string;
  type: ReminderType;
  title: string;
  description?: string;
  scheduled_time: string; // HH:MM
  frequency: ReminderFrequency;
  interval_minutes?: number; // for hydration
  enabled: boolean;
  date?: string; // for appointments (YYYY-MM-DD)
  location?: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

// ---- Reminder Log ----
export interface ReminderLog {
  id: string;
  reminder_id: string;
  patient_id: string;
  scheduled_at: string;
  acknowledged_at?: string;
  status: 'pending' | 'acknowledged' | 'missed';
  sync_status: SyncStatus;
}

// ---- Alert ----
export interface Alert {
  id: string;
  patient_id: string;
  domain?: Domain;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  sync_status: SyncStatus;
}

// ---- Sync Queue ----
export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error?: string;
}

// ---- Game Content ----
export interface GameContent {
  id: string;
  domain: Domain;
  region: Region;
  language: Language;
  difficulty: DifficultyLevel;
  type: 'object' | 'routine' | 'pattern';
  label_en: string;
  label_hi: string;
  emoji?: string; // fallback when no image
  image_path?: string;
  active: boolean;
  [key: string]: string | number | boolean | undefined; // Allow dynamic language keys
}

// ---- App State ----
export interface AppState {
  language: Language;
  region: Region;
  currentPatient?: Patient;
  currentUser?: User;
  isOnline: boolean;
  pendingSyncCount: number;
}

// ---- Dashboard Domain Stats ----
export interface DomainStats {
  domain: Domain;
  currentScore: number;
  baselineScore?: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  recentSessions: DomainScore[];
  hasAlert: boolean;
}

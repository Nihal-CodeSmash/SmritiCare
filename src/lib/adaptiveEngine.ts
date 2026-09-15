// =============================================
// SMRITI CARE — Adaptive Difficulty Engine
// =============================================

import { db, getDomainDifficulty, updateDomainDifficulty, getRecentAttempts, addToSyncQueue } from '@/db';
import type { Domain, DifficultyLevel, GameAttempt, Language } from '@/types';

const MIN_LEVEL = 1;
const MAX_LEVEL = 5;
const ACCURACY_INCREASE_THRESHOLD = 0.80;  // >= 80% → increase
const ACCURACY_DECREASE_THRESHOLD = 0.50;  // <= 50% → decrease
const ROLLING_WINDOW = 3;

const DECLINE_THRESHOLD = 15; // 15 point drop from baseline
const DECLINE_SESSION_COUNT = 3; // Must persist for 3+ sessions

// ---- Encouraging messages ----
const ENCOURAGEMENT_EN = [
  'Great job!',
  'Well done!',
  'Keep it up!',
  'Excellent!',
  'You\'re doing wonderfully!',
];

const ENCOURAGEMENT_HI = [
  'बहुत बढ़िया!',
  'शाबाश!',
  'लगे रहो!',
  'उत्कृष्ट!',
  'आप बहुत अच्छा कर रहे हैं!',
];

export function getEncouragement(lang: Language = 'en'): string {
  const messages = lang === 'hi' ? ENCOURAGEMENT_HI : ENCOURAGEMENT_EN;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ---- Evaluate an attempt and update difficulty ----
export async function evaluateAttempt(
  patientId: string,
  domain: Domain,
  sessionId: string,
  questionId: string,
  correct: boolean,
  responseTimeMs?: number
): Promise<{ newLevel: DifficultyLevel; encouragement: string; accuracy: number | null }> {
  const currentLevel = await getDomainDifficulty(patientId, domain) as DifficultyLevel;

  // Record the attempt
  const attempt: GameAttempt = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    patient_id: patientId,
    domain,
    question_id: questionId,
    difficulty: currentLevel,
    correct,
    response_time_ms: responseTimeMs,
    created_at: new Date().toISOString(),
    sync_status: 'pending',
  };
  await db.gameAttempts.add(attempt);
  await addToSyncQueue('gameAttempts', attempt.id, 'insert', attempt as unknown as Record<string, unknown>);

  // Get recent attempts for rolling window
  const recent = await getRecentAttempts(patientId, domain, ROLLING_WINDOW);
  let newLevel = currentLevel;
  let accuracy: number | null = null;

  if (recent.length >= ROLLING_WINDOW) {
    const correct_count = recent.filter((a) => a.correct).length;
    accuracy = correct_count / recent.length;

    if (accuracy >= ACCURACY_INCREASE_THRESHOLD) {
      newLevel = Math.min(currentLevel + 1, MAX_LEVEL) as DifficultyLevel;
    } else if (accuracy <= ACCURACY_DECREASE_THRESHOLD) {
      newLevel = Math.max(currentLevel - 1, MIN_LEVEL) as DifficultyLevel;
    }
    // else: keep current level
  }

  if (newLevel !== currentLevel) {
    await updateDomainDifficulty(patientId, domain, newLevel);
  }

  return { newLevel, encouragement: getEncouragement(), accuracy };
}

// ---- Calculate domain score from recent sessions ----
export async function calculateDomainScore(
  patientId: string,
  domain: Domain,
  sessionWindow: number = 10
): Promise<number | null> {
  const sessions = await db.gameSessions
    .where({ patient_id: patientId, domain })
    .toArray();

  if (sessions.length === 0) return null;

  const recent = sessions
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, sessionWindow);

  // Weighted average — more recent sessions have higher weight
  let totalWeight = 0;
  let weightedSum = 0;
  recent.forEach((session, i) => {
    const weight = recent.length - i; // most recent = highest weight
    weightedSum += session.score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
}

// ---- Get or establish baseline ----
export async function getBaseline(
  patientId: string,
  domain: Domain
): Promise<number | null> {
  const records = await db.domainScores
    .where({ patient_id: patientId, domain })
    .toArray();

  if (records.length < 5) return null; // Not enough data for baseline

  // Baseline = average of first 5–10 sessions' scores
  const baselineSessions = records
    .sort((a, b) => a.score_date.localeCompare(b.score_date))
    .slice(0, 10);

  const sum = baselineSessions.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / baselineSessions.length);
}

// ---- Detect decline and create alerts ----
export async function detectDecline(
  patientId: string,
  domain: Domain
): Promise<'alert' | 'normal' | 'insufficient_data'> {
  const baseline = await getBaseline(patientId, domain);
  const currentScore = await calculateDomainScore(patientId, domain, 5);

  if (baseline === null || currentScore === null) return 'insufficient_data';

  const drop = baseline - currentScore;

  if (drop >= DECLINE_THRESHOLD) {
    // Check if decline persists across multiple sessions
    const recentScores = await db.domainScores
      .where({ patient_id: patientId, domain })
      .toArray();

    const sorted = recentScores.sort((a, b) => b.score_date.localeCompare(a.score_date));
    const belowBaseline = sorted
      .slice(0, DECLINE_SESSION_COUNT)
      .filter((s) => baseline - s.score >= DECLINE_THRESHOLD);

    if (belowBaseline.length >= DECLINE_SESSION_COUNT) {
      // Create alert if not already one exists
      const existing = await db.alerts
        .where({ patient_id: patientId, domain, type: 'decline', acknowledged: 0 as unknown as boolean })
        .first();

      if (!existing) {
        const alert = {
          id: crypto.randomUUID(),
          patient_id: patientId,
          domain,
          type: 'decline' as const,
          severity: 'medium' as const,
          message:
            "Performance has been lower than the patient's recent baseline. Consider checking in with the patient or a qualified professional.",
          created_at: new Date().toISOString(),
          acknowledged: false,
          sync_status: 'pending' as const,
        };
        await db.alerts.add(alert);
        await addToSyncQueue('alerts', alert.id, 'insert', alert as unknown as Record<string, unknown>);
      }
      return 'alert';
    }
  }

  return 'normal';
}

// ---- Finalize a game session ----
export async function finalizeSession(
  sessionId: string,
  patientId: string,
  domain: Domain
): Promise<number> {
  const attempts = await db.gameAttempts
    .where({ session_id: sessionId })
    .toArray();

  const correctCount = attempts.filter((a) => a.correct).length;
  const score = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

  // Update session
  await db.gameSessions.update(sessionId, {
    ended_at: new Date().toISOString(),
    score,
    attempts_count: attempts.length,
    correct_count: correctCount,
    sync_status: 'pending',
  });

  // Save domain score record
  const domainScore = {
    id: crypto.randomUUID(),
    patient_id: patientId,
    domain,
    score,
    score_date: new Date().toISOString().split('T')[0],
    session_count: 1,
    sync_status: 'pending' as const,
  };
  await db.domainScores.add(domainScore);
  await addToSyncQueue('domainScores', domainScore.id, 'insert', domainScore as unknown as Record<string, unknown>);

  // Run decline detection
  await detectDecline(patientId, domain);

  return score;
}

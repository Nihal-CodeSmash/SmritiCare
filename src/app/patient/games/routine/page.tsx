'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db, getDomainDifficulty } from '@/db';
import { evaluateAttempt, finalizeSession } from '@/lib/adaptiveEngine';
import { ROUTINE_ACTIVITIES, shuffle } from '@/lib/gameContent';
import type { DifficultyLevel } from '@/types';
import styles from '../memory/page.module.css';
import rStyles from './page.module.css';

type Phase = 'intro' | 'playing' | 'result' | 'complete';

interface Activity {
  id: string;
  label_en: string;
  label_hi: string;
  emoji: string;
  order: number;
  time: string;
}

export default function RoutineGame() {
  const router = useRouter();
  const { t, currentPatient, language, speak } = useApp();
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const [phase, setPhase] = useState<Phase>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userOrder, setUserOrder] = useState<Activity[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(3);
  const [score, setScore] = useState(0);
  const [newLevel, setNewLevel] = useState<DifficultyLevel>(1);

  useEffect(() => {
    const init = async () => {
      const patientId = currentPatient?.id ?? 'demo-patient';
      const level = (await getDomainDifficulty(patientId, 'routine')) as DifficultyLevel;
      setDifficulty(level);
      setNewLevel(level);
      await db.gameSessions.add({
        id: sessionIdRef.current,
        patient_id: patientId,
        domain: 'routine',
        difficulty: level,
        started_at: new Date().toISOString(),
        score: 0, attempts_count: 0, correct_count: 0, sync_status: 'pending',
      });
    };
    init();
    speak(t.games.instruction.routine);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCount = (level: DifficultyLevel) => {
    const counts: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 };
    return counts[level] ?? 3;
  };

  const generateRound = (level: DifficultyLevel) => {
    const count = getCount(level);
    const pool = ROUTINE_ACTIVITIES.slice(0, 8);
    const selected = pool.slice(0, count);
    setActivities(selected);
    setUserOrder(shuffle([...selected]));
    setCorrect(null);
  };

  const handleStart = () => {
    generateRound(difficulty);
    setPhase('playing');
    speak(t.games.instruction.routine);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setUserOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === userOrder.length - 1) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setUserOrder(newOrder);
  };

  const handleSubmit = async () => {
    const isCorrect = userOrder.every((act, i) => act.id === activities[i].id);
    setCorrect(isCorrect);
    setPhase('result');

    const patientId = currentPatient?.id ?? 'demo-patient';
    const result = await evaluateAttempt(
      patientId, 'routine', sessionIdRef.current, `round-${round}`, isCorrect
    );
    setNewLevel(result.newLevel);

    speak(isCorrect ? t.games.correct : t.games.incorrect);

    setTimeout(async () => {
      if (round >= totalRounds) {
        const finalScore = await finalizeSession(sessionIdRef.current, patientId, 'routine');
        setScore(finalScore);
        setPhase('complete');
      } else {
        setRound((r) => r + 1);
        setDifficulty(result.newLevel);
        generateRound(result.newLevel);
        setPhase('playing');
      }
    }, 2000);
  };

  const getLabel = (act: Activity) => language === 'hi' ? act.label_hi : act.label_en;

  return (
    <div className={styles.container}>
      <div className={styles.gameHeader}>
        <div className={styles.domainBadge}>📅 {t.games.routine.name}</div>
        <div className={styles.roundInfo}>
          {language === 'hi' ? `राउंड ${round}/${totalRounds}` : `Round ${round}/${totalRounds}`}
        </div>
        <div className={styles.levelBadge}>{t.games.difficulty} {newLevel}</div>
      </div>

      {phase === 'intro' && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <div className={styles.phaseEmoji}>📅</div>
          <h2 className={styles.phaseTitle}>{t.games.routine.name}</h2>
          <p className={styles.phaseDesc}>{t.games.instruction.routine}</p>
          <button className="btn-primary" onClick={handleStart}>🎮 {t.common.start}</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'result') && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <p className={styles.instruction}>{t.games.instruction.routine}</p>
          <div className={rStyles.activityList}>
            {userOrder.map((act, index) => (
              <div key={act.id} className={`${rStyles.activityItem} ${
                phase === 'result'
                  ? activities[index].id === act.id ? rStyles.activityCorrect : rStyles.activityIncorrect
                  : ''
              }`}>
                <span className={rStyles.activityNum}>{index + 1}</span>
                <span className={rStyles.activityEmoji}>{act.emoji}</span>
                <span className={rStyles.activityLabel}>{getLabel(act)}</span>
                <span className={rStyles.activityTime}>{act.time}</span>
                {phase === 'playing' && (
                  <div className={rStyles.activityControls}>
                    <button className={rStyles.controlBtn} onClick={() => moveUp(index)} disabled={index === 0}>▲</button>
                    <button className={rStyles.controlBtn} onClick={() => moveDown(index)} disabled={index === userOrder.length - 1}>▼</button>
                  </div>
                )}
                {phase === 'result' && (
                  <span style={{ fontSize: '1.5rem', marginLeft: 'auto' }}>
                    {activities[index].id === act.id ? '✅' : '❌'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {phase === 'playing' && (
            <button className="btn-primary" onClick={handleSubmit} id="btn-routine-submit">
              ✓ {language === 'hi' ? 'जमा करें' : 'Submit Order'}
            </button>
          )}

          {phase === 'result' && (
            <div className={`${styles.feedbackBanner} ${correct ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
              {correct ? t.games.wellDone : t.games.incorrect}
            </div>
          )}
        </div>
      )}

      {phase === 'complete' && (
        <div className={`${styles.completeBox} animate-fadeInUp`}>
          <div className={styles.completeTrophy}>🏆</div>
          <h2 className={styles.completeTitle}>{t.games.sessionComplete}</h2>
          <div className={styles.scoreDisplay}>
            <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad3)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${(score / 100) * 327} 327`} transform="rotate(-90 60 60)" />
              <defs><linearGradient id="scoreGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#388e3c" /><stop offset="100%" stopColor="#a5d6a7" />
              </linearGradient></defs>
            </svg>
            <span className={styles.scoreNumber}>{score}</span>
          </div>
          <p className={styles.scoreLabel}>{t.games.yourScore}</p>
          <div className={styles.completeActions}>
            <button className="btn-primary" onClick={() => {
              setRound(1); setPhase('intro'); sessionIdRef.current = crypto.randomUUID();
            }}>🎮 {t.games.nextGame}</button>
            <button className="btn-secondary" onClick={() => router.push('/patient/games')}>
              {t.games.backHome}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

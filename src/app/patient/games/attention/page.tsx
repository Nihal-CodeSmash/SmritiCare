'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db, getDomainDifficulty } from '@/db';
import { evaluateAttempt, finalizeSession } from '@/lib/adaptiveEngine';
import { getObjectsByDifficulty, getDistractors, getDistractorCountForDifficulty, shuffle } from '@/lib/gameContent';
import type { GameContent, DifficultyLevel } from '@/types';
import styles from '../memory/page.module.css';

type Phase = 'intro' | 'playing' | 'feedback' | 'complete';

export default function AttentionGame() {
  const router = useRouter();
  const { t, currentPatient, language, speak } = useApp();
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const [phase, setPhase] = useState<Phase>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [target, setTarget] = useState<GameContent | null>(null);
  const [options, setOptions] = useState<GameContent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [newLevel, setNewLevel] = useState<DifficultyLevel>(1);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      const patientId = currentPatient?.id ?? 'demo-patient';
      const level = (await getDomainDifficulty(patientId, 'attention')) as DifficultyLevel;
      setDifficulty(level);
      setNewLevel(level);
      await db.gameSessions.add({
        id: sessionIdRef.current,
        patient_id: patientId,
        domain: 'attention',
        difficulty: level,
        started_at: new Date().toISOString(),
        score: 0,
        attempts_count: 0,
        correct_count: 0,
        sync_status: 'pending',
      });
    };
    init();
    speak(t.games.attention.description);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateQuestion = useCallback((level: DifficultyLevel) => {
    const targets = getObjectsByDifficulty(level, 'pattern', 1);
    if (targets.length === 0) return;
    const t_obj = targets[0];
    const distractorCount = getDistractorCountForDifficulty(level) + 1;
    const distractors = getDistractors([t_obj], distractorCount, 'pattern');
    const allOptions = shuffle([t_obj, ...distractors]);
    setTarget(t_obj);
    setOptions(allOptions);
    setSelected(null);
    setIsCorrect(null);
    startTimeRef.current = Date.now();
  }, []);

  const handleStart = () => {
    generateQuestion(difficulty);
    setPhase('playing');
    if (target) {
      const label = language === 'hi' ? target.label_hi : target.label_en;
      speak(`${t.games.tapTarget} ${label}`);
    }
  };

  const handleSelect = async (obj: GameContent) => {
    if (selected) return;
    const responseTime = Date.now() - startTimeRef.current;
    const correct = obj.id === target?.id;
    setSelected(obj.id);
    setIsCorrect(correct);

    const patientId = currentPatient?.id ?? 'demo-patient';
    const result = await evaluateAttempt(
      patientId, 'attention', sessionIdRef.current, obj.id, correct, responseTime
    );
    setNewLevel(result.newLevel);

    speak(correct ? t.games.correct : t.games.incorrect);

    setTimeout(async () => {
      if (round >= totalRounds) {
        const finalScore = await finalizeSession(sessionIdRef.current, patientId, 'attention');
        setScore(finalScore);
        setPhase('complete');
      } else {
        setRound((r) => r + 1);
        setDifficulty(result.newLevel);
        generateQuestion(result.newLevel);
      }
    }, 1200);
  };

  const getLabel = (obj: GameContent) => language === 'hi' ? obj.label_hi : obj.label_en;

  return (
    <div className={styles.container}>
      <div className={styles.gameHeader}>
        <div className={styles.domainBadge}>👀 {t.games.attention.name}</div>
        <div className={styles.roundInfo}>
          {language === 'hi' ? `राउंड ${round}/${totalRounds}` : `Round ${round}/${totalRounds}`}
        </div>
        <div className={styles.levelBadge}>{t.games.difficulty} {newLevel}</div>
      </div>

      {phase === 'intro' && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <div className={styles.phaseEmoji}>👀</div>
          <h2 className={styles.phaseTitle}>{t.games.attention.name}</h2>
          <p className={styles.phaseDesc}>{t.games.instruction.attentionInstruction}</p>
          <button id="btn-attention-start" className="btn-primary" onClick={handleStart}>
            🎮 {t.common.start}
          </button>
        </div>
      )}

      {phase === 'playing' && target && (
        <div className={`${styles.phaseBox} animate-fadeIn`}>
          <p className={styles.instruction}>
            {t.games.instruction.attention}{' '}
            <strong style={{ color: '#ffb74d' }}>{getLabel(target)}</strong>
          </p>
          <p className={styles.recallHint}>{t.games.instruction.attentionInstruction}</p>

          {/* Target hint */}
          <div style={{
            padding: '1rem 2rem',
            background: 'rgba(245,124,0,0.15)',
            border: '2px solid rgba(245,124,0,0.4)',
            borderRadius: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '2rem',
          }}>
            <span>{target.emoji}</span>
            <span style={{ fontSize: '1.375rem', fontWeight: 700 }}>{getLabel(target)}</span>
          </div>

          <div className={styles.objectGrid}>
            {options.map((obj) => {
              const isSelected = selected === obj.id;
              const isTarget = obj.id === target.id;
              let cardClass = styles.objectCard;
              if (isSelected) {
                cardClass += isCorrect ? ` ${styles.objectCorrect}` : ` ${styles.objectIncorrect}`;
              } else if (selected && isTarget) {
                cardClass += ` ${styles.objectCorrect}`;
              }
              return (
                <button
                  key={obj.id}
                  id={`btn-attn-${obj.id}`}
                  className={cardClass}
                  onClick={() => handleSelect(obj)}
                  disabled={!!selected}
                >
                  <span className={styles.objectEmoji}>{obj.emoji}</span>
                  <span className={styles.objectLabel}>{getLabel(obj)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className={`${styles.completeBox} animate-fadeInUp`}>
          <div className={styles.completeTrophy}>🏆</div>
          <h2 className={styles.completeTitle}>{t.games.sessionComplete}</h2>
          <div className={styles.scoreDisplay}>
            <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad2)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${(score / 100) * 327} 327`} transform="rotate(-90 60 60)" />
              <defs><linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0288d1" /><stop offset="100%" stopColor="#81d4fa" />
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

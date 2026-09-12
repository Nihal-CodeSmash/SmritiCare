'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db, getDomainDifficulty } from '@/db';
import { evaluateAttempt, finalizeSession } from '@/lib/adaptiveEngine';
import { PATTERN_SETS } from '@/lib/gameContent';
import type { DifficultyLevel } from '@/types';
import styles from '../memory/page.module.css';

type Phase = 'intro' | 'playing' | 'complete';

interface PatternSet {
  id: string;
  difficulty: number;
  sequence: string[];
  answer: string;
  options: string[];
}

export default function PatternGame() {
  const router = useRouter();
  const { t, currentPatient, language, speak } = useApp();
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const [phase, setPhase] = useState<Phase>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [currentPattern, setCurrentPattern] = useState<PatternSet | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(4);
  const [score, setScore] = useState(0);
  const [newLevel, setNewLevel] = useState<DifficultyLevel>(1);

  useEffect(() => {
    const init = async () => {
      const patientId = currentPatient?.id ?? 'demo-patient';
      const level = (await getDomainDifficulty(patientId, 'pattern')) as DifficultyLevel;
      setDifficulty(level);
      setNewLevel(level);
      await db.gameSessions.add({
        id: sessionIdRef.current,
        patient_id: patientId,
        domain: 'pattern',
        difficulty: level,
        started_at: new Date().toISOString(),
        score: 0, attempts_count: 0, correct_count: 0, sync_status: 'pending',
      });
    };
    init();
    speak(t.games.instruction.pattern);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickPattern = (level: DifficultyLevel): PatternSet => {
    const available = PATTERN_SETS.filter((p) => p.difficulty <= level);
    if (available.length === 0) return PATTERN_SETS[0];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleStart = () => {
    const pattern = pickPattern(difficulty);
    setCurrentPattern(pattern);
    setSelected(null);
    setIsCorrect(null);
    setPhase('playing');
    speak(t.games.instruction.pattern);
  };

  const handleSelect = async (option: string) => {
    if (selected) return;
    const correct = option === currentPattern?.answer;
    setSelected(option);
    setIsCorrect(correct);

    const patientId = currentPatient?.id ?? 'demo-patient';
    const result = await evaluateAttempt(
      patientId, 'pattern', sessionIdRef.current, currentPattern?.id ?? '', correct
    );
    setNewLevel(result.newLevel);
    speak(correct ? t.games.correct : t.games.incorrect);

    setTimeout(async () => {
      if (round >= totalRounds) {
        const finalScore = await finalizeSession(sessionIdRef.current, patientId, 'pattern');
        setScore(finalScore);
        setPhase('complete');
      } else {
        setRound((r) => r + 1);
        setDifficulty(result.newLevel);
        const pattern = pickPattern(result.newLevel);
        setCurrentPattern(pattern);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.gameHeader}>
        <div className={styles.domainBadge}>🔷 {t.games.pattern.name}</div>
        <div className={styles.roundInfo}>
          {language === 'hi' ? `राउंड ${round}/${totalRounds}` : `Round ${round}/${totalRounds}`}
        </div>
        <div className={styles.levelBadge}>{t.games.difficulty} {newLevel}</div>
      </div>

      {phase === 'intro' && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <div className={styles.phaseEmoji}>🔷</div>
          <h2 className={styles.phaseTitle}>{t.games.pattern.name}</h2>
          <p className={styles.phaseDesc}>{t.games.instruction.pattern}</p>
          <button className="btn-primary" onClick={handleStart}>🎮 {t.common.start}</button>
        </div>
      )}

      {phase === 'playing' && currentPattern && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <p className={styles.instruction}>{t.games.instruction.pattern}</p>

          {/* Pattern sequence */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1.5rem',
            width: '100%',
          }}>
            {currentPattern.sequence.map((item, i) => (
              <span key={i} style={{ fontSize: '3rem' }}>{item}</span>
            ))}
            <span style={{
              fontSize: '3rem',
              width: '72px',
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: '1rem',
            }}>?</span>
          </div>

          {/* Options */}
          <p className={styles.recallHint}>
            {language === 'hi' ? 'सही विकल्प चुनें' : 'Choose the correct next item'}
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {currentPattern.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isAnswer = opt === currentPattern.answer;
              let bg = 'rgba(255,255,255,0.08)';
              let border = 'rgba(255,255,255,0.15)';
              if (isSelected) {
                bg = isCorrect ? 'rgba(46,125,50,0.25)' : 'rgba(198,40,40,0.2)';
                border = isCorrect ? '#4caf50' : '#ef5350';
              } else if (selected && isAnswer) {
                bg = 'rgba(46,125,50,0.2)';
                border = '#4caf50';
              }
              return (
                <button
                  key={i}
                  id={`btn-pattern-${i}`}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                  style={{
                    width: '100px',
                    height: '100px',
                    fontSize: '3rem',
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: '1.25rem',
                    cursor: selected ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {isCorrect !== null && (
            <div className={`${styles.feedbackBanner} ${isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
              {isCorrect ? t.games.greatJob : t.games.incorrect}
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
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad4)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${(score / 100) * 327} 327`} transform="rotate(-90 60 60)" />
              <defs><linearGradient id="scoreGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e65100" /><stop offset="100%" stopColor="#ffcc80" />
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

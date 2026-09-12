'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db, getDomainDifficulty } from '@/db';
import { evaluateAttempt, finalizeSession, getEncouragement } from '@/lib/adaptiveEngine';
import {
  getObjectsByDifficulty,
  getDistractors,
  getObjectCountForDifficulty,
  getDistractorCountForDifficulty,
  getShowDurationForDifficulty,
  shuffle,
} from '@/lib/gameContent';
import type { GameContent, DifficultyLevel } from '@/types';
import styles from './page.module.css';

type Phase = 'intro' | 'show' | 'recall' | 'feedback' | 'complete';

export default function MemoryGame() {
  const router = useRouter();
  const { t, currentPatient, language, speak } = useApp();
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const [phase, setPhase] = useState<Phase>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [shownObjects, setShownObjects] = useState<GameContent[]>([]);
  const [allOptions, setAllOptions] = useState<GameContent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(3);
  const [countdown, setCountdown] = useState(0);
  const [encouragement, setEncouragement] = useState('');
  const [newLevel, setNewLevel] = useState<DifficultyLevel>(1);

  // Load difficulty on mount, create session
  useEffect(() => {
    const init = async () => {
      const patientId = currentPatient?.id ?? 'demo-patient';
      const level = (await getDomainDifficulty(patientId, 'memory')) as DifficultyLevel;
      setDifficulty(level);
      setNewLevel(level);

      // Create the session record
      await db.gameSessions.add({
        id: sessionIdRef.current,
        patient_id: patientId,
        domain: 'memory',
        difficulty: level,
        started_at: new Date().toISOString(),
        score: 0,
        attempts_count: 0,
        correct_count: 0,
        sync_status: 'pending',
      });
    };
    init();
    speak(t.games.instruction.memory);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateRound = useCallback((level: DifficultyLevel) => {
    const count = getObjectCountForDifficulty(level);
    const distractorCount = getDistractorCountForDifficulty(level);
    const shown = getObjectsByDifficulty(level, 'memory', count);
    const distractors = getDistractors(shown, distractorCount, 'memory');
    const options = shuffle([...shown, ...distractors]);
    setShownObjects(shown);
    setAllOptions(options);
    setSelectedIds(new Set());
    setRevealedIds(new Set());
    setFeedback(null);
  }, []);

  const startRound = useCallback((level: DifficultyLevel) => {
    generateRound(level);
    setPhase('show');
    const showDuration = getShowDurationForDifficulty(level);

    let elapsed = 0;
    setCountdown(Math.ceil(showDuration / 1000));
    speak(t.games.instruction.memory);

    const interval = setInterval(() => {
      elapsed += 1000;
      setCountdown(Math.ceil((showDuration - elapsed) / 1000));
      if (elapsed >= showDuration) {
        clearInterval(interval);
        setPhase('recall');
        speak(t.games.instruction.memoryRecall);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generateRound, speak, t]);

  const handleStart = () => {
    setPhase('show');
    startRound(difficulty);
  };

  const handleSelect = async (obj: GameContent) => {
    if (phase !== 'recall') return;
    const isShown = shownObjects.some((o) => o.id === obj.id);
    const newSelected = new Set(selectedIds);
    newSelected.add(obj.id);
    setSelectedIds(newSelected);
    setRevealedIds((prev) => new Set([...prev, obj.id]));

    const patientId = currentPatient?.id ?? 'demo-patient';
    const result = await evaluateAttempt(
      patientId,
      'memory',
      sessionIdRef.current,
      obj.id,
      isShown
    );

    const enc = getEncouragement(language);
    setEncouragement(enc);
    setFeedback(isShown ? 'correct' : 'incorrect');
    if (isShown) {
      setRoundScore((prev) => prev + 1);
      speak(`${t.games.correct} ${enc}`);
    } else {
      speak(t.games.incorrect);
    }

    setNewLevel(result.newLevel);

    const correctSelections = Array.from(newSelected).filter(id => shownObjects.some(s => s.id === id)).length;
    const isRoundComplete = correctSelections === shownObjects.length;

    if (isRoundComplete) {
      // After showing feedback, move to next round or complete
      setTimeout(async () => {
        setFeedback(null);
        if (round >= totalRounds) {
          // Finalize session
          const finalScore = await finalizeSession(sessionIdRef.current, patientId, 'memory');
          setScore(finalScore);
          setPhase('complete');
          speak(`${t.games.sessionComplete} ${t.games.yourScore}: ${finalScore}`);
        } else {
          setRound((r) => r + 1);
          setDifficulty(result.newLevel);
          startRound(result.newLevel);
        }
      }, 1500);
    } else {
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const getLabel = (obj: GameContent) =>
    language === 'hi' ? obj.label_hi : obj.label_en;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.gameHeader}>
        <div className={styles.domainBadge}>🧠 {t.games.memory.name}</div>
        <div className={styles.roundInfo}>
          {language === 'hi' ? `राउंड ${round}/${totalRounds}` : `Round ${round}/${totalRounds}`}
        </div>
        <div className={styles.levelBadge}>
          {t.games.difficulty} {newLevel}
          {newLevel > difficulty && ' ↑'}
          {newLevel < difficulty && ' ↓'}
        </div>
      </div>

      {/* INTRO Phase */}
      {phase === 'intro' && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <div className={styles.phaseEmoji}>🧠</div>
          <h2 className={styles.phaseTitle}>{t.games.memory.name}</h2>
          <p className={styles.phaseDesc}>{t.games.instruction.memory}</p>
          <div className={styles.difficultyInfo}>
            <span>
              {language === 'hi' ? `आज का स्तर: ${difficulty}` : `Today's level: ${difficulty}`}
            </span>
            <span>
              {language === 'hi'
                ? `${getObjectCountForDifficulty(difficulty)} वस्तुएं देखें`
                : `Remember ${getObjectCountForDifficulty(difficulty)} objects`}
            </span>
          </div>
          <button id="btn-memory-start" className="btn-primary" onClick={handleStart}>
            🎮 {t.common.start}
          </button>
        </div>
      )}

      {/* SHOW Phase */}
      {phase === 'show' && (
        <div className={`${styles.phaseBox} animate-fadeIn`}>
          <p className={styles.instruction}>{t.games.instruction.memory}</p>
          <div className={styles.timerWrap}>
            <div className={styles.timerLabel}>
              {language === 'hi' ? `${countdown} सेकेंड` : `${countdown} seconds`}
            </div>
            <div className="timer-bar" style={{ width: '100%' }}>
              <div
                className="timer-fill"
                style={{
                  width: `${(countdown / getShowDurationForDifficulty(difficulty) * 1000) * 100}%`,
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>
          <div className={styles.objectGrid}>
            {shownObjects.map((obj) => (
              <div key={obj.id} className={`${styles.objectCard} ${styles.objectShow}`}>
                <span className={styles.objectEmoji}>{obj.emoji}</span>
                <span className={styles.objectLabel}>{getLabel(obj)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECALL Phase */}
      {phase === 'recall' && (
        <div className={`${styles.phaseBox} animate-fadeInUp`}>
          <p className={styles.instruction}>{t.games.instruction.memoryRecall}</p>
          <p className={styles.recallHint}>
            {language === 'hi'
              ? `${shownObjects.length} में से चुनें`
              : `Select the ${shownObjects.length} objects you saw`}
          </p>
          <div className={styles.objectGrid}>
            {allOptions.map((obj) => {
              const isSelected = selectedIds.has(obj.id);
              const isRevealed = revealedIds.has(obj.id);
              const isShown = shownObjects.some((s) => s.id === obj.id);
              let cardClass = styles.objectCard;
              if (isRevealed) {
                cardClass += isShown ? ` ${styles.objectCorrect}` : ` ${styles.objectIncorrect}`;
              } else if (isSelected) {
                cardClass += ` ${styles.objectSelected}`;
              }
              return (
                <button
                  key={obj.id}
                  id={`btn-obj-${obj.id}`}
                  className={cardClass}
                  onClick={() => !isSelected && handleSelect(obj)}
                  disabled={isSelected}
                  aria-label={getLabel(obj)}
                >
                  <span className={styles.objectEmoji}>{obj.emoji}</span>
                  <span className={styles.objectLabel}>{getLabel(obj)}</span>
                  {isRevealed && (
                    <span className={styles.objectResult}>{isShown ? '✓' : '✗'}</span>
                  )}
                </button>
              );
            })}
          </div>
          {feedback && (
            <div className={`${styles.feedbackBanner} ${feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
              {feedback === 'correct' ? `${t.games.correct} ${encouragement}` : t.games.incorrect}
            </div>
          )}
        </div>
      )}

      {/* COMPLETE Phase */}
      {phase === 'complete' && (
        <div className={`${styles.completeBox} animate-fadeInUp`}>
          <div className={styles.completeTrophy}>🏆</div>
          <h2 className={styles.completeTitle}>{t.games.sessionComplete}</h2>
          <div className={styles.scoreDisplay}>
            <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f57c00" />
                  <stop offset="100%" stopColor="#ffb74d" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.scoreNumber}>{score}</span>
          </div>
          <p className={styles.scoreLabel}>{t.games.yourScore}</p>

          {newLevel !== difficulty && (
            <div className={styles.levelChange}>
              {newLevel > difficulty
                ? (language === 'hi' ? `🎉 स्तर बढ़ा: ${newLevel}` : `🎉 Level up! Now Level ${newLevel}`)
                : (language === 'hi' ? `💪 स्तर: ${newLevel}` : `💪 Level adjusted to ${newLevel}`)}
            </div>
          )}

          <div className={styles.completeActions}>
            <button
              id="btn-play-again"
              className="btn-primary"
              onClick={() => {
                setRound(1);
                setRoundScore(0);
                setPhase('intro');
                sessionIdRef.current = crypto.randomUUID();
              }}
            >
              🎮 {t.games.nextGame}
            </button>
            <button
              id="btn-game-home"
              className="btn-secondary"
              onClick={() => router.push('/patient/games')}
            >
              {t.games.backHome}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

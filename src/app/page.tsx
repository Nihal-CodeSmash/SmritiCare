'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Language } from '@/types';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const { setLanguage, language, speak } = useApp();
  const [selected, setSelected] = useState<Language>(language);
  const [animating, setAnimating] = useState(false);

  const languages: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇮🇳' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setSelected(lang);
    setLanguage(lang);
  };

  const handleContinue = (mode: 'patient' | 'caregiver') => {
    setAnimating(true);
    setTimeout(() => {
      if (mode === 'patient') router.push('/patient');
      else router.push('/caregiver');
    }, 400);
  };

  const greetingText = selected === 'hi'
    ? 'स्वागत है! अपनी भाषा चुनें'
    : 'Welcome! Please select your language';

  return (
    <main className={`${styles.main} ${animating ? styles.fadeOut : ''}`}>
      {/* Background decoration */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
      </div>

      <div className={styles.content}>
        {/* Logo / App Name */}
        <div className={`${styles.header} animate-fadeInUp`}>
          <div className={styles.logoWrap}>
            <span className={styles.logoIcon}>🧠</span>
          </div>
          <h1 className={styles.appName}>SMRITI CARE</h1>
          <p className={styles.tagline}>
            {selected === 'hi' ? 'आपका स्मृति साथी' : 'Your Memory Companion'}
          </p>
          <p className={styles.ministry}>
            {selected === 'hi'
              ? 'Ministry of Development of North Eastern Region'
              : 'Ministry of Development of North Eastern Region'}
          </p>
        </div>

        {/* Language Selection */}
        <div className={`${styles.section} animate-fadeInUp`} style={{ animationDelay: '0.1s' }}>
          <p className={styles.sectionLabel}>{greetingText}</p>
          <div className={styles.langGrid}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                id={`lang-${lang.code}`}
                className={`${styles.langBtn} ${selected === lang.code ? styles.langBtnSelected : ''}`}
                onClick={() => handleLanguageSelect(lang.code)}
                aria-pressed={selected === lang.code}
              >
                <span className={styles.langFlag}>{lang.flag}</span>
                <span className={styles.langNative}>{lang.nativeLabel}</span>
                <span className={styles.langName}>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className={`${styles.section} stagger`} style={{ animationDelay: '0.2s' }}>
          <p className={styles.sectionLabel}>
            {selected === 'hi' ? 'मोड चुनें' : 'Choose your mode'}
          </p>

          {/* Patient Mode */}
          <button
            id="btn-patient-mode"
            className={styles.modeBtn}
            onClick={() => handleContinue('patient')}
          >
            <div className={styles.modeBtnIcon}>👤</div>
            <div className={styles.modeBtnContent}>
              <span className={styles.modeBtnTitle}>
                {selected === 'hi' ? 'रोगी मोड' : 'Patient Mode'}
              </span>
              <span className={styles.modeBtnDesc}>
                {selected === 'hi'
                  ? 'खेलें, याद करें, रिमाइंडर देखें'
                  : 'Play games, practice memory, view reminders'}
              </span>
            </div>
            <span className={styles.modeBtnArrow}>→</span>
          </button>

          {/* Caregiver Mode */}
          <button
            id="btn-caregiver-mode"
            className={`${styles.modeBtn} ${styles.modeBtnCaregiver}`}
            onClick={() => handleContinue('caregiver')}
          >
            <div className={styles.modeBtnIcon}>🩺</div>
            <div className={styles.modeBtnContent}>
              <span className={styles.modeBtnTitle}>
                {selected === 'hi' ? 'देखभालकर्ता मोड' : 'Caregiver Mode'}
              </span>
              <span className={styles.modeBtnDesc}>
                {selected === 'hi'
                  ? 'डैशबोर्ड, प्रगति, रिमाइंडर प्रबंधित करें'
                  : 'Dashboard, progress, manage reminders'}
              </span>
            </div>
            <span className={styles.modeBtnArrow}>→</span>
          </button>
        </div>

        {/* Voice Button */}
        <button
          id="btn-hear-instructions"
          className={styles.voiceBtn}
          onClick={() => speak(selected === 'hi'
            ? 'स्वागत है स्मृति केयर में। रोगी मोड या देखभालकर्ता मोड चुनें।'
            : 'Welcome to Smriti Care. Please choose Patient Mode or Caregiver Mode to continue.'
          )}
          aria-label="Hear instructions"
        >
          🔊 {selected === 'hi' ? 'निर्देश सुनें' : 'Hear Instructions'}
        </button>

        <p className={styles.footer}>
          SIH 2026 · Problem ID: SIH26003 · MDoNER
        </p>
      </div>
    </main>
  );
}

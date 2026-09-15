'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Language } from '@/types';
import { Brain, UserRound, Stethoscope, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const { t, setLanguage, language, speak, stopSpeaking, isSpeaking } = useApp();
  const [selected, setSelected] = useState<Language>(language);
  const [animating, setAnimating] = useState(false);

  const languages: { code: Language; label: string; nativeLabel: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
    { code: 'mni', label: 'Meitei', nativeLabel: 'মৈতৈলোন্' },
    { code: 'lus', label: 'Mizo', nativeLabel: 'Mizo ṭawng' },
    { code: 'njz', label: 'Naga', nativeLabel: 'Nagamese' },
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

  const greetingText = t.landing.greetingText;

  const handleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(t.landing.voiceIntro);
    }
  };

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
            <Image src="/images/smriticare-logo.png" alt="SmritiCare Logo" width={80} height={80} className={styles.logoImage} priority />
          </div>
          <h1 className={styles.appName}>SMRITI CARE</h1>
          <p className={styles.tagline}>
            {t.app.tagline}
          </p>
          <p className={styles.ministry}>
            Ministry of Development of North Eastern Region
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
                <span className={styles.langNative}>{lang.nativeLabel}</span>
                <span className={styles.langName}>{lang.label}</span>
                {selected === lang.code && <span className={styles.langCheck} aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className={`${styles.section} stagger`} style={{ animationDelay: '0.2s' }}>
          <p className={styles.sectionLabel}>
            {t.landing.chooseMode}
          </p>

          {/* Patient Mode */}
          <button
            id="btn-patient-mode"
            className={styles.modeBtn}
            onClick={() => handleContinue('patient')}
          >
            <div className={styles.modeBtnIconWrap}>
              <UserRound className={styles.modeBtnIcon} strokeWidth={1.5} />
            </div>
            <div className={styles.modeBtnContent}>
              <span className={styles.modeBtnTitle}>
                {t.landing.patientMode}
              </span>
              <span className={styles.modeBtnDesc}>
                {t.landing.patientDesc}
              </span>
            </div>
            <span className={styles.modeBtnArrow} aria-hidden="true">→</span>
          </button>

          {/* Caregiver Mode */}
          <button
            id="btn-caregiver-mode"
            className={`${styles.modeBtn} ${styles.modeBtnCaregiver}`}
            onClick={() => handleContinue('caregiver')}
          >
            <div className={styles.modeBtnIconWrap}>
              <Stethoscope className={styles.modeBtnIcon} strokeWidth={1.5} />
            </div>
            <div className={styles.modeBtnContent}>
              <span className={styles.modeBtnTitle}>
                {t.landing.caregiverMode}
              </span>
              <span className={styles.modeBtnDesc}>
                {t.landing.caregiverDesc}
              </span>
            </div>
            <span className={styles.modeBtnArrow} aria-hidden="true">→</span>
          </button>
        </div>

        {/* Voice Button */}
        <button
          id="btn-hear-instructions"
          className={`${styles.voiceBtn} ${isSpeaking ? styles.voiceBtnActive : ''}`}
          onClick={handleVoice}
          aria-label={isSpeaking ? 'Stop speaking' : 'Hear instructions'}
        >
          {isSpeaking
            ? <><VolumeX size={18} /> {t.landing.stop}</>
            : <><Volume2 size={18} /> {t.landing.hearInstructions}</>
          }
        </button>

        <p className={styles.footer}>
          SIH 2026 · Problem ID: SIH26003 · MDoNER
        </p>
      </div>
    </main>
  );
}


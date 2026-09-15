'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Brain, House, Volume2, VolumeX } from 'lucide-react';
import styles from './layout.module.css';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { t, isOnline, currentPatient, speak, stopSpeaking, isSpeaking } = useApp();
  const pathname = usePathname();

  const isHome = pathname === '/patient';

  return (
    <div className="patient-mode">
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.appNameSmall}><Brain size={18} /> SMRITI CARE</span>
          {currentPatient && (
            <span className={styles.patientName}>{currentPatient.display_name}</span>
          )}
        </div>
        <div className={styles.topBarRight}>
          <span className={isOnline ? 'status-bar status-online' : 'status-bar status-offline'}>
            <span>{isOnline ? '●' : '○'}</span>
            <span className={styles.statusLabel}>{isOnline ? t.common.online : t.common.offline}</span>
          </span>
          {!isHome && (
            <Link href="/patient" className={styles.homeLink} id="btn-patient-home">
              <House size={18} /> <span className={styles.homeLinkLabel}>{t.common.home}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Bottom Voice Helper */}
      <div className={styles.bottomBar}>
        <div className={styles.voiceControls}>
          <button
            className={`${styles.repeatBtn} ${isSpeaking ? styles.repeatBtnActive : ''}`}
            id="btn-repeat-instruction"
            onClick={() => speak(t.home.hearInstructions)}
            aria-label="Repeat instructions"
            disabled={isSpeaking}
          >
            <Volume2 size={18} />
            <span className={styles.voiceBtnLabel}>{t.common.repeat}</span>
          </button>
          {isSpeaking && (
            <button
              className={styles.stopBtn}
              id="btn-stop-speaking"
              onClick={stopSpeaking}
              aria-label="Stop speaking"
            >
              <VolumeX size={18} />
              <span className={styles.voiceBtnLabel}>{t.common.stop}</span>
            </button>
          )}
        </div>
        <Link href="/" className={styles.switchModeLink} id="btn-switch-mode">
          ← {t.settings.selectLanguage}
        </Link>
      </div>
    </div>
  );
}

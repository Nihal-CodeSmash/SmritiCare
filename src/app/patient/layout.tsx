'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import styles from './layout.module.css';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { t, isOnline, currentPatient, speak } = useApp();
  const pathname = usePathname();

  const isHome = pathname === '/patient';

  return (
    <div className="patient-mode">
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.appNameSmall}>🧠 SMRITI CARE</span>
          {currentPatient && (
            <span className={styles.patientName}>{currentPatient.display_name}</span>
          )}
        </div>
        <div className={styles.topBarRight}>
          <span className={isOnline ? 'status-bar status-online' : 'status-bar status-offline'}>
            <span>{isOnline ? '●' : '○'}</span>
            {isOnline ? t.common.online : t.common.offline}
          </span>
          {!isHome && (
            <Link href="/patient" className={styles.homeLink} id="btn-patient-home">
              🏠 {t.common.home}
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
        <button
          className={styles.repeatBtn}
          id="btn-repeat-instruction"
          onClick={() => speak(t.home.hearInstructions)}
          aria-label="Repeat instructions"
        >
          🔊 {t.common.repeat}
        </button>
        <Link href="/" className={styles.switchModeLink} id="btn-switch-mode">
          ← {t.settings.selectLanguage}
        </Link>
      </div>
    </div>
  );
}

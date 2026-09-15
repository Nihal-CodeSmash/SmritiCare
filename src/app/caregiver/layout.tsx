'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { BarChart3, Bell, Brain, LogOut, Users } from 'lucide-react';
import styles from './layout.module.css';

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, t, isOnline, setCurrentUser, setCurrentPatient } = useApp();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (pathname !== '/caregiver' && (!currentUser || currentUser.role !== 'caregiver')) {
      router.push('/caregiver');
    }
  }, [currentUser, pathname, router]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPatient(null);
    router.push('/caregiver');
  };

  // If on login page, don't show the dashboard shell
  if (pathname === '/caregiver') {
    return <div className="caregiver-mode">{children}</div>;
  }

  // If checking auth
  if (!currentUser) {
    return null;
  }

  return (
    <div className="caregiver-mode">
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.logo}><Brain size={28} /></span>
            <div className={styles.brandText}>
              <span className={styles.brandName}>SMRITI CARE</span>
              <span className={styles.brandSub}>{t.caregiver.dashboard}</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <Link
              href="/caregiver/dashboard"
              className={`${styles.navItem} ${pathname === '/caregiver/dashboard' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}><BarChart3 size={20} /></span>
              {t.caregiver.overview}
            </Link>
            <Link
              href="/caregiver/patients"
              className={`${styles.navItem} ${pathname === '/caregiver/patients' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}><Users size={20} /></span>
              {t.caregiver.patient}
            </Link>
            <Link
              href="/caregiver/reminders"
              className={`${styles.navItem} ${pathname === '/caregiver/reminders' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}><Bell size={20} /></span>
              {t.caregiver.reminders}
            </Link>
          </nav>

          <div className={styles.bottomNav}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{currentUser.name.charAt(0).toUpperCase()}</div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>Caregiver</span>
              </div>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <span className={styles.navIcon}><LogOut size={20} /></span>
              {t.caregiver.logout}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.mainWrapper}>
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>
              {pathname === '/caregiver/dashboard' && t.caregiver.overview}
              {pathname === '/caregiver/patients' && t.caregiver.patient}
              {pathname === '/caregiver/reminders' && t.caregiver.reminders}
            </h1>
            
            <div className={styles.headerRight}>
              <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
                <span className={styles.statusDot}></span>
                {isOnline ? t.common.online : t.common.offline}
              </div>
            </div>
          </header>

          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

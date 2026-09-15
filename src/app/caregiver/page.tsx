'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import type { Patient } from '@/types';
import styles from './page.module.css';
import { Mail, Lock, Lightbulb } from 'lucide-react';
import Image from 'next/image';

export default function CaregiverLogin() {
  const router = useRouter();
  const { t, setCurrentUser, setCurrentPatient, language } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Demo login for SIH prototype
    if (email.trim() && password.trim()) {
      // Simulate a caregiver user
      const demoUser = {
        id: 'caregiver-demo',
        name: email.split('@')[0] || 'Caregiver',
        email: email,
        role: 'caregiver' as const,
        language: 'en' as const,
        created_at: new Date().toISOString(),
      };
      setCurrentUser(demoUser);

      // Check for an existing demo patient, else create one
      const existingPatient = await db.patients
        .where('caregiver_id')
        .equals(demoUser.id)
        .first();

      if (!existingPatient) {
        const demoPatient: Patient = {
          id: 'demo-patient',
          caregiver_id: demoUser.id,
          display_name: 'Ramesh Kumar',
          age: 72,
          preferred_language: 'hi',
          region: 'assam',
          baseline_status: 'provisional',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        await db.patients.add(demoPatient);

        // Seed demo domain scores for dashboard
        await seedDemoData(demoPatient.id);
        setCurrentPatient(demoPatient);
      } else {
        setCurrentPatient(existingPatient);
      }

      setTimeout(() => router.push('/caregiver/dashboard'), 300);
    } else {
      setError(t.caregiver.loginError);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgOrb} />
      </div>

      <div className={`${styles.card} animate-fadeInUp`}>
        <div className={styles.logoWrap}>
          <Image src="/images/smriticare-logo.png" alt="SmritiCare Logo" width={64} height={64} className={styles.logo} priority />
        </div>
        <h1 className={styles.title}>SMRITI CARE</h1>
        <p className={styles.subtitle}>{t.caregiver.dashboard}</p>

        <form onSubmit={handleLogin} className={styles.form} id="form-caregiver-login">
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              <Mail size={18} /> {t.caregiver.email}
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@hospital.in"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              <Lock size={18} /> {t.caregiver.password}
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">{error}</div>
          )}

          <button
            id="btn-caregiver-login"
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">⏳ {t.common.loading}</span>
            ) : (
              `→ ${t.caregiver.signIn}`
            )}
          </button>
        </form>

        <div className={styles.demo}>
          <p>
            <Lightbulb size={15} /> {t.caregiver.demo}
          </p>
        </div>

        <div className={styles.backLink}>
          <Link href="/">← {t.caregiver.backToHome}</Link>
        </div>
      </div>
    </div>
  );
}

// ---- Seed demo data for dashboard visualization ----
async function seedDemoData(patientId: string) {
  const domains = ['memory', 'attention', 'routine', 'pattern'] as const;
  const now = new Date();

  for (const domain of domains) {
    // Create 10 past domain scores to simulate baseline + trend
    for (let i = 9; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Memory starts high, drops — simulates decline for demo
      const baseScore = domain === 'memory' ? 82 : domain === 'attention' ? 75 : domain === 'routine' ? 68 : 79;
      const noise = Math.floor(Math.random() * 10) - 5;
      // Simulate decline in last 3 sessions for memory
      const decline = (domain === 'memory' && i < 3) ? -20 : 0;
      const score = Math.max(10, Math.min(100, baseScore + noise + decline));

      await db.domainScores.add({
        id: crypto.randomUUID(),
        patient_id: patientId,
        domain,
        score,
        baseline_score: baseScore,
        score_date: date.toISOString().split('T')[0],
        session_count: 1,
        sync_status: 'pending',
      });
    }
  }

  // Create a sample decline alert for memory
  await db.alerts.add({
    id: crypto.randomUUID(),
    patient_id: patientId,
    domain: 'memory',
    type: 'decline',
    severity: 'medium',
    message: "Memory performance has been lower than the patient's recent baseline for the last 3 sessions. Consider checking in with the patient or a qualified professional.",
    created_at: new Date().toISOString(),
    acknowledged: false,
    sync_status: 'pending',
  });

  // Add sample reminders
  const reminders = [
    { type: 'medicine' as const, title: 'Morning Medicine', scheduled_time: '08:30' },
    { type: 'hydration' as const, title: 'Drink Water', scheduled_time: '10:00' },
    { type: 'medicine' as const, title: 'Evening Medicine', scheduled_time: '19:00' },
    { type: 'appointment' as const, title: "Doctor's Appointment", scheduled_time: '11:00' },
  ];

  for (const r of reminders) {
    await db.reminders.add({
      id: crypto.randomUUID(),
      patient_id: patientId,
      type: r.type,
      title: r.title,
      scheduled_time: r.scheduled_time,
      frequency: 'daily',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
  }
}

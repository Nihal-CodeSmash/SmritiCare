'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import type { Reminder } from '@/types';
import styles from './page.module.css';

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const REMINDER_ICONS: Record<string, string> = {
  medicine: '💊',
  hydration: '💧',
  daily_activity: '🏃',
  appointment: '🏥',
};

const REMINDER_COLORS: Record<string, string> = {
  medicine: 'rgba(156,39,176,0.2)',
  hydration: 'rgba(2,136,209,0.2)',
  daily_activity: 'rgba(56,142,60,0.2)',
  appointment: 'rgba(198,40,40,0.2)',
};

const REMINDER_BORDER: Record<string, string> = {
  medicine: 'rgba(156,39,176,0.45)',
  hydration: 'rgba(2,136,209,0.45)',
  daily_activity: 'rgba(56,142,60,0.45)',
  appointment: 'rgba(198,40,40,0.45)',
};

export default function RemindersPage() {
  const { t, currentPatient, speak, language } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    speak(t.reminders.title);
    loadReminders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReminders = async () => {
    const patientId = currentPatient?.id ?? 'demo-patient';
    const all = await db.reminders
      .where('patient_id')
      .equals(patientId)
      .toArray();

    // Add demo reminders if none exist
    if (all.length === 0) {
      const demoReminders: Reminder[] = [
        {
          id: 'r1', patient_id: patientId, type: 'medicine',
          title: language === 'hi' ? 'सुबह की दवाई' : 'Morning Medicine',
          description: language === 'hi' ? 'नाश्ते के बाद लें' : 'Take after breakfast',
          scheduled_time: '08:30', frequency: 'daily', enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending',
        },
        {
          id: 'r2', patient_id: patientId, type: 'hydration',
          title: language === 'hi' ? 'पानी पिएं' : 'Drink Water',
          description: language === 'hi' ? 'एक गिलास पानी पिएं' : 'Drink a glass of water',
          scheduled_time: '10:00', frequency: 'interval', interval_minutes: 120, enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending',
        },
        {
          id: 'r3', patient_id: patientId, type: 'medicine',
          title: language === 'hi' ? 'शाम की दवाई' : 'Evening Medicine',
          description: language === 'hi' ? 'खाने के बाद लें' : 'Take after dinner',
          scheduled_time: '19:00', frequency: 'daily', enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending',
        },
        {
          id: 'r4', patient_id: patientId, type: 'daily_activity',
          title: language === 'hi' ? 'सुबह की सैर' : 'Morning Walk',
          description: language === 'hi' ? '30 मिनट की सैर करें' : '30-minute walk',
          scheduled_time: '06:30', frequency: 'daily', enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending',
        },
        {
          id: 'r5', patient_id: patientId, type: 'appointment',
          title: language === 'hi' ? 'डॉक्टर की नियुक्ति' : "Doctor's Appointment",
          description: language === 'hi' ? 'डॉ. शर्मा, City Hospital' : 'Dr. Sharma, City Hospital',
          scheduled_time: '11:00', frequency: 'once', date: new Date().toISOString().split('T')[0], enabled: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending',
        },
      ];
      await db.reminders.bulkAdd(demoReminders);
      setReminders(demoReminders);
    } else {
      setReminders(all.filter((r) => r.enabled));
    }
    setLoading(false);
  };

  const handleAcknowledge = async (reminder: Reminder) => {
    setAcknowledged((prev) => new Set([...prev, reminder.id]));

    await db.reminderLogs.add({
      id: crypto.randomUUID(),
      reminder_id: reminder.id,
      patient_id: currentPatient?.id ?? 'demo-patient',
      scheduled_at: new Date().toISOString(),
      acknowledged_at: new Date().toISOString(),
      status: 'acknowledged',
      sync_status: 'pending',
    });

    const label = language === 'hi' ? 'हो गया' : 'Done';
    speak(label);
  };

  const getReminderTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medicine: t.reminders.medicine,
      hydration: t.reminders.hydration,
      daily_activity: t.reminders.activity,
      appointment: t.reminders.appointment,
    };
    return map[type] ?? type;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.6)' }}>{t.common.loading}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.header} animate-fadeInUp`}>
        <h2 className={styles.title}>⏰ {t.reminders.title}</h2>
        <p className={styles.subtitle}>
          {language === 'hi'
            ? 'आज के आपके रिमाइंडर'
            : "Today's reminders for you"}
        </p>
      </div>

      {reminders.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize: '3rem' }}>✅</span>
          <p>{t.reminders.noReminders}</p>
        </div>
      ) : (
        <div className={`${styles.list} stagger`}>
          {reminders.map((reminder) => {
            const isDone = acknowledged.has(reminder.id);
            return (
              <div
                key={reminder.id}
                className={`${styles.reminderCard} ${isDone ? styles.reminderDone : ''}`}
                style={{
                  '--card-bg': isDone ? 'rgba(56,142,60,0.12)' : REMINDER_COLORS[reminder.type],
                  '--card-border': isDone ? 'rgba(76,175,80,0.4)' : REMINDER_BORDER[reminder.type],
                } as React.CSSProperties}
              >
                <div className={styles.reminderLeft}>
                  <span className={styles.reminderIcon}>{REMINDER_ICONS[reminder.type]}</span>
                  <div className={styles.reminderContent}>
                    <span className={styles.reminderType}>
                      {getReminderTypeLabel(reminder.type)}
                    </span>
                    <span className={styles.reminderTitle}>{reminder.title}</span>
                    {reminder.description && (
                      <span className={styles.reminderDesc}>{reminder.description}</span>
                    )}
                    <span className={styles.reminderTime}>
                      🕐 {formatTime(reminder.scheduled_time)}
                      {reminder.date && ` · ${reminder.date}`}
                    </span>
                  </div>
                </div>
                <button
                  id={`btn-ack-${reminder.id}`}
                  className={`${styles.ackBtn} ${isDone ? styles.ackBtnDone : ''}`}
                  onClick={() => !isDone && handleAcknowledge(reminder)}
                  disabled={isDone}
                  aria-label={isDone ? t.reminders.done : t.reminders.acknowledge}
                >
                  {isDone ? `✓ ${t.reminders.done}` : t.reminders.acknowledge}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {acknowledged.size > 0 && (
        <div className={`${styles.progressBox} animate-fadeIn`}>
          <span>✅</span>
          <span>
            {language === 'hi'
              ? `${acknowledged.size} रिमाइंडर पूरे हुए`
              : `${acknowledged.size} reminder${acknowledged.size > 1 ? 's' : ''} completed`}
          </span>
        </div>
      )}
    </div>
  );
}

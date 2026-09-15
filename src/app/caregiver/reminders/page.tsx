'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bell, Check, Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import type { Reminder, ReminderType } from '@/types';
import styles from './page.module.css';

const emptyForm = { title: '', description: '', scheduled_time: '08:00', type: 'medicine' as ReminderType, frequency: 'daily' as const };

export default function CaregiverRemindersPage() {
  const { currentPatient } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { loadReminders(); }, [currentPatient]);

  async function loadReminders() {
    if (!currentPatient) return;
    setReminders(await db.reminders.where('patient_id').equals(currentPatient.id).toArray());
  }

  async function saveReminder(event: FormEvent) {
    event.preventDefault();
    if (!currentPatient || !form.title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      await db.reminders.update(editingId, { ...form, title: form.title.trim(), updated_at: now, enabled: true, sync_status: 'pending' });
    } else {
      await db.reminders.add({ id: crypto.randomUUID(), patient_id: currentPatient.id, ...form, title: form.title.trim(), enabled: true, created_at: now, updated_at: now, sync_status: 'pending' });
    }
    setForm(emptyForm);
    setEditingId(null);
    loadReminders();
  }

  async function removeReminder(id: string) {
    await db.reminders.delete(id);
    setReminders((items) => items.filter((item) => item.id !== id));
  }

  function editReminder(reminder: Reminder) {
    setEditingId(reminder.id);
    setForm({ title: reminder.title, description: reminder.description || '', scheduled_time: reminder.scheduled_time, type: reminder.type, frequency: reminder.frequency === 'daily' ? 'daily' : 'daily' });
  }

  return <div className={styles.page}>
    <div className={styles.intro}><div><span className={styles.kicker}><Bell size={16} /> Alarm schedule</span><h2>Reminders for {currentPatient?.display_name || 'your patient'}</h2><p>Set a time, and the patient can turn the alarm off by pressing Done.</p></div><span className={styles.count}>{reminders.length}<small> active</small></span></div>
    <div className={styles.grid}>
      <form className={styles.formCard} onSubmit={saveReminder}>
        <h3><Plus size={20} /> {editingId ? 'Edit reminder' : 'Add reminder'}</h3>
        <label>What should happen<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Morning medicine" required /></label>
        <label>Extra instruction<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Take after breakfast" rows={3} /></label>
        <div className={styles.formRow}><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ReminderType })}><option value="medicine">Medicine</option><option value="hydration">Drink water</option><option value="daily_activity">Daily activity</option><option value="appointment">Appointment</option></select></label><label>Time<input type="time" value={form.scheduled_time} onChange={(event) => setForm({ ...form, scheduled_time: event.target.value })} required /></label></div>
        <button className={styles.primaryButton} type="submit"><Check size={19} /> {editingId ? 'Save changes' : 'Add alarm'}</button>
        {editingId && <button className={styles.cancelButton} type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel edit</button>}
      </form>
      <div className={styles.listCard}><h3><Clock3 size={20} /> Scheduled alarms</h3>{reminders.length === 0 ? <div className={styles.empty}>No alarms yet. Add the first one for the patient.</div> : <div className={styles.list}>{reminders.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)).map((reminder) => <div className={styles.reminder} key={reminder.id}><div className={styles.time}>{reminder.scheduled_time}</div><div className={styles.reminderText}><strong>{reminder.title}</strong><span>{reminder.description || 'Daily reminder'}</span></div><button className={styles.iconButton} onClick={() => editReminder(reminder)} aria-label={`Edit ${reminder.title}`}><Pencil size={18} /></button><button className={styles.iconButton} onClick={() => removeReminder(reminder.id)} aria-label={`Delete ${reminder.title}`}><Trash2 size={18} /></button></div>)}</div>}</div>
    </div>
  </div>;
}

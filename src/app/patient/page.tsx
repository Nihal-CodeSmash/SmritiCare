'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import type { Reminder } from '@/types';
import { Bell, Check, CircleHelp, Gamepad2, HeartHandshake, ImagePlus, Lightbulb, MapPin, Phone, Volume2 } from 'lucide-react';
import styles from './page.module.css';

function getGreetingKey(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default function PatientHome() {
  const { t, currentPatient, speak, language, familyMembers, patientDetails } = useApp();
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [isReminderDone, setIsReminderDone] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    const key = getGreetingKey();
    const greetingText = t.greeting[key];
    const name = currentPatient?.display_name || '';
    setTimeout(() => setGreeting(`${greetingText}${name ? `, ${name}` : ''}!`), 0);

    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [t, currentPatient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(`${greeting} ${t.home.hearInstructions}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [greeting]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadNextReminder = async () => {
      const patientId = currentPatient?.id ?? 'demo-patient';
      const reminders = await db.reminders.where('patient_id').equals(patientId).toArray();
      const active = reminders.filter((reminder) => reminder.enabled).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
      setNextReminder(active[0] ?? null);
    };
    loadNextReminder();
  }, [currentPatient]);

  const acknowledgeReminder = async () => {
    if (!nextReminder || isReminderDone) return;
    await db.reminderLogs.add({
      id: crypto.randomUUID(), reminder_id: nextReminder.id, patient_id: nextReminder.patient_id,
      scheduled_at: new Date().toISOString(), acknowledged_at: new Date().toISOString(),
      status: 'acknowledged', sync_status: 'pending',
    });
    setIsReminderDone(true);
    speak(t.patientHome.reminderDone);
  };

  const currentFamilyMember = familyMembers[quizIndex];
  const answerQuiz = (answer: string) => {
    setQuizAnswer(answer.trim().toLowerCase() === currentFamilyMember?.name.trim().toLowerCase() ? 'correct' : 'incorrect');
  };

  const menuItems = [
    {
      id: 'btn-play-game',
      href: '/patient/games',
      icon: <Gamepad2 aria-hidden="true" />,
      label: t.home.playGame,
      desc: t.games.title,
      color: '#E8714A',
      gradient: 'linear-gradient(135deg, rgba(232,113,74,0.18), rgba(196,90,53,0.08))',
      borderColor: 'rgba(232,113,74,0.38)',
    },
    {
      id: 'btn-reminders',
      href: '/patient/reminders',
      icon: <Bell aria-hidden="true" />,
      label: t.home.reminders,
      desc: t.reminders.title,
      color: '#5EAAA8',
      gradient: 'linear-gradient(135deg, rgba(94,170,168,0.18), rgba(61,138,136,0.08))',
      borderColor: 'rgba(94,170,168,0.38)',
    },
    {
      id: 'btn-hear-instructions',
      href: '#',
      icon: <Volume2 aria-hidden="true" />,
      label: t.landing.hearInstructions,
      desc: '',
      color: '#90CBA8',
      gradient: 'linear-gradient(135deg, rgba(61,139,94,0.18), rgba(45,122,80,0.08))',
      borderColor: 'rgba(61,139,94,0.38)',
      onClick: () => speak(t.landing.hearInstructions),
    },
    {
      id: 'btn-help',
      href: '#',
      icon: <CircleHelp aria-hidden="true" />,
      label: t.home.help,
      desc: '',
      color: '#F4A07B',
      gradient: 'linear-gradient(135deg, rgba(232,113,74,0.12), rgba(196,90,53,0.06))',
      borderColor: 'rgba(232,113,74,0.28)',
      onClick: () => speak(t.patientHome.voiceInstructions),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Greeting */}
      <div className={`${styles.greetingBox} animate-fadeInUp`}>
        <div className={styles.clock}>{time}</div>
        <h1 className={styles.greeting}>{greeting}</h1>
        <p className={styles.greetingSub}>
          {t.patientHome.readyForGreatDay}
        </p>
      </div>

      {/* Menu Grid */}
      <div className={`${styles.menuGrid} stagger`}>
        {menuItems.map((item) => (
          item.onClick ? (
            <button
              key={item.id}
              id={item.id}
              className={styles.menuCard}
              onClick={item.onClick}
              style={{ '--card-gradient': item.gradient, '--card-border': item.borderColor } as React.CSSProperties}
              aria-label={item.label}
            >
              <span className={styles.menuIcon} style={{ color: item.color }}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
              {item.desc && <span className={styles.menuDesc}>{item.desc}</span>}
            </button>
          ) : (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              className={styles.menuCard}
              style={{ '--card-gradient': item.gradient, '--card-border': item.borderColor } as React.CSSProperties}
              aria-label={item.label}
            >
              <span className={styles.menuIcon} style={{ color: item.color }}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
              {item.desc && <span className={styles.menuDesc}>{item.desc}</span>}
            </Link>
          )
        ))}
      </div>

      <section className={`${styles.interactiveGrid} animate-fadeIn`}>
        <div className={styles.reminderPanel}>
          <div className={styles.panelHeading}>
            <div><span className={styles.eyebrow}><Bell size={15} /> {t.patientHome.nextAlarm}</span><h2>{nextReminder?.title || t.reminders.noReminders}</h2></div>
            {nextReminder && <strong>{nextReminder.scheduled_time}</strong>}
          </div>
          <p>{nextReminder?.description || t.patientHome.dayOrganized}</p>
          {nextReminder && <button className={styles.doneButton} onClick={acknowledgeReminder} disabled={isReminderDone}><Check size={20} /> {isReminderDone ? t.reminders.done : t.reminders.acknowledge}</button>}
        </div>

        <div className={styles.familyPanel}>
          <div className={styles.panelHeading}><div><span className={styles.eyebrow}><HeartHandshake size={15} /> {t.patientHome.familyMemory}</span><h2>{t.patientHome.whoIsThis}</h2></div><ImagePlus size={24} /></div>
          {currentFamilyMember ? <>
            <div className={styles.familyPhoto}>{currentFamilyMember.image_url ? <img src={currentFamilyMember.image_url} alt="" /> : <ImagePlus size={34} />}</div>
            <div className={styles.quizChoices}>{familyMembers.map((member) => <button key={member.id} onClick={() => answerQuiz(member.name)} className={quizAnswer === 'correct' && member.id === currentFamilyMember.id ? styles.correctChoice : ''}>{member.name}</button>)}</div>
            {quizAnswer && <p className={quizAnswer === 'correct' ? styles.correctText : styles.incorrectText}>{quizAnswer === 'correct' ? t.patientHome.thatIsRight : t.patientHome.tryAgain}</p>}
            <button className={styles.nextFamilyButton} onClick={() => { setQuizIndex((quizIndex + 1) % familyMembers.length); setQuizAnswer(null); }}>{t.patientHome.nextFamilyPhoto}</button>
          </> : <p className={styles.emptyFamily}><ImagePlus size={26} /> {t.patientHome.caregiverCanAdd}</p>}
        </div>
      </section>

      <section className={styles.contactPanel}>
        <div><span className={styles.eyebrow}><MapPin size={15} /> {t.patientHome.safeContacts}</span><p>{patientDetails.address || t.patientHome.addressNotAdded}</p></div>
        <a href={patientDetails.phone ? `tel:${patientDetails.phone}` : '#'}><Phone size={18} /> {patientDetails.phone || t.patientHome.addPhone}</a>
      </section>

      {currentPatient && (
        <div className={`${styles.tip} animate-fadeIn`} style={{ animationDelay: '0.4s' }}>
          <Lightbulb className={styles.tipIcon} aria-hidden="true" />
          <span>
            {t.patientHome.todayTip}
          </span>
        </div>
      )}
    </div>
  );
}


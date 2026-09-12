'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import styles from './page.module.css';

function getGreetingKey(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default function PatientHome() {
  const { t, currentPatient, speak, language } = useApp();
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const key = getGreetingKey();
    const greetingText = t.greeting[key];
    const name = currentPatient?.display_name || '';
    setGreeting(`${greetingText}${name ? `, ${name}` : ''}!`);

    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [t, currentPatient]);

  useEffect(() => {
    // Auto-speak greeting after 1 second
    const timer = setTimeout(() => {
      speak(`${greeting} ${t.home.hearInstructions}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [greeting]); // eslint-disable-line react-hooks/exhaustive-deps

  const menuItems = [
    {
      id: 'btn-play-game',
      href: '/patient/games',
      icon: '🎮',
      label: t.home.playGame,
      desc: t.games.title,
      color: '#f57c00',
      gradient: 'linear-gradient(135deg, rgba(245,124,0,0.2), rgba(255,183,77,0.1))',
      borderColor: 'rgba(245,124,0,0.4)',
    },
    {
      id: 'btn-reminders',
      href: '/patient/reminders',
      icon: '⏰',
      label: t.home.reminders,
      desc: t.reminders.title,
      color: '#42a5f5',
      gradient: 'linear-gradient(135deg, rgba(66,165,245,0.2), rgba(30,136,229,0.1))',
      borderColor: 'rgba(66,165,245,0.4)',
    },
    {
      id: 'btn-hear-instructions',
      href: '#',
      icon: '🔊',
      label: t.home.hearInstructions,
      desc: '',
      color: '#a5d6a7',
      gradient: 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(56,142,60,0.1))',
      borderColor: 'rgba(76,175,80,0.4)',
      onClick: () => speak(t.home.hearInstructions),
    },
    {
      id: 'btn-help',
      href: '#',
      icon: '❓',
      label: t.home.help,
      desc: '',
      color: '#ce93d8',
      gradient: 'linear-gradient(135deg, rgba(156,39,176,0.2), rgba(123,31,162,0.1))',
      borderColor: 'rgba(156,39,176,0.4)',
      onClick: () => speak(
        language === 'hi'
          ? 'खेल खेलने के लिए "आज का खेल खेलें" पर टैप करें। रिमाइंडर देखने के लिए "याददिलाने वाले" पर टैप करें।'
          : 'Tap "Play Today\'s Game" to start a cognitive exercise. Tap "Reminders" to see your medicine and activity reminders.'
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Greeting */}
      <div className={`${styles.greetingBox} animate-fadeInUp`}>
        <div className={styles.clock}>{time}</div>
        <h1 className={styles.greeting}>{greeting}</h1>
        <p className={styles.greetingSub}>
          {language === 'hi' ? 'आज भी अच्छा करें! 🌟' : 'Ready for a great day! 🌟'}
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

      {/* Recent activity hint */}
      {currentPatient && (
        <div className={`${styles.tip} animate-fadeIn`} style={{ animationDelay: '0.4s' }}>
          <span className={styles.tipIcon}>💡</span>
          <span>
            {language === 'hi'
              ? 'आज का सुझाव: नियमित अभ्यास से याददाश्त मजबूत होती है!'
              : "Today's tip: Regular practice helps keep your memory sharp!"}
          </span>
        </div>
      )}
    </div>
  );
}

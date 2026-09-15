'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import { useEffect, useState } from 'react';
import type { Domain, DifficultyLevel } from '@/types';
import { Brain, Eye, Calendar, Shapes } from 'lucide-react';
import styles from './page.module.css';

const DOMAIN_ICONS: Record<Domain, React.ReactNode> = {
  memory: <Brain strokeWidth={1.5} />,
  attention: <Eye strokeWidth={1.5} />,
  routine: <Calendar strokeWidth={1.5} />,
  pattern: <Shapes strokeWidth={1.5} />,
};

const DOMAINS: {
  key: Domain;
  color: string;
  gradient: string;
  borderColor: string;
  href: string;
}[] = [
  {
    key: 'memory',
    color: '#5EAAA8',
    gradient: 'linear-gradient(135deg, rgba(94,170,168,0.22), rgba(61,138,136,0.09))',
    borderColor: 'rgba(94,170,168,0.4)',
    href: '/patient/games/memory',
  },
  {
    key: 'attention',
    color: '#E8714A',
    gradient: 'linear-gradient(135deg, rgba(232,113,74,0.22), rgba(196,90,53,0.09))',
    borderColor: 'rgba(232,113,74,0.4)',
    href: '/patient/games/attention',
  },
  {
    key: 'routine',
    color: '#90CBA8',
    gradient: 'linear-gradient(135deg, rgba(61,139,94,0.22), rgba(45,122,80,0.09))',
    borderColor: 'rgba(61,139,94,0.4)',
    href: '/patient/games/routine',
  },
  {
    key: 'pattern',
    color: '#F5CC75',
    gradient: 'linear-gradient(135deg, rgba(212,136,14,0.22), rgba(180,110,8,0.09))',
    borderColor: 'rgba(212,136,14,0.4)',
    href: '/patient/games/pattern',
  },
];


export default function GamesPage() {
  const { t, currentPatient, speak, language } = useApp();
  const [difficulties, setDifficulties] = useState<Record<Domain, DifficultyLevel>>({
    memory: 1, attention: 1, routine: 1, pattern: 1,
  });

  useEffect(() => {
    speak(t.games.title);

    if (!currentPatient) return;
    const load = async () => {
      const records = await db.patientDifficulty
        .where('patient_id')
        .equals(currentPatient.id)
        .toArray();
      const map: Record<string, number> = {};
      records.forEach((r) => { map[r.domain] = r.level; });
      setDifficulties((prev) => ({ ...prev, ...map }));
    };
    load();
  }, [currentPatient]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDomainLabel = (domain: Domain) => {
    const map: Record<Domain, string> = {
      memory: t.games.memory.name,
      attention: t.games.attention.name,
      routine: t.games.routine.name,
      pattern: t.games.pattern.name,
    };
    return map[domain];
  };

  const getDomainDesc = (domain: Domain) => {
    const map: Record<Domain, string> = {
      memory: t.games.memory.description,
      attention: t.games.attention.description,
      routine: t.games.routine.description,
      pattern: t.games.pattern.description,
    };
    return map[domain];
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.header} animate-fadeInUp`}>
        <h2 className={styles.title}>{t.games.title}</h2>
        <p className={styles.subtitle}>
          {language === 'hi'
            ? 'अभ्यास जारी रखें — हर खेल आपकी याददाश्त मजबूत करता है'
            : 'Keep practicing — every game sharpens your mind'}
        </p>
      </div>

      <div className={`${styles.grid} stagger`}>
        {DOMAINS.map((domain) => (
          <Link
            key={domain.key}
            href={domain.href}
            id={`btn-game-${domain.key}`}
            className={styles.domainCard}
            style={{
              '--card-gradient': domain.gradient,
              '--card-border': domain.borderColor,
            } as React.CSSProperties}
            onClick={() => speak(`${t.common.start} ${getDomainLabel(domain.key)}`)}
          >
          <div className={styles.domainIcon} style={{ color: domain.color }}>{DOMAIN_ICONS[domain.key]}</div>
            <div className={styles.domainInfo}>
              <span className={styles.domainName}>{getDomainLabel(domain.key)}</span>
              <span className={styles.domainDesc}>{getDomainDesc(domain.key)}</span>
            </div>
            <div className={styles.domainMeta}>
              <span className={styles.levelBadge} style={{ color: domain.color }}>
                {t.games.difficulty} {difficulties[domain.key]}
              </span>
              <span className={styles.arrowIcon} style={{ color: domain.color }}>→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={`${styles.infoBox} animate-fadeIn`} style={{ animationDelay: '0.5s' }}>
        <span>🌟</span>
        <span>
          {language === 'hi'
            ? 'कठिनाई स्तर आपके प्रदर्शन के अनुसार स्वचालित रूप से बदलता है'
            : 'Difficulty adapts automatically based on your recent performance'}
        </span>
      </div>
    </div>
  );
}

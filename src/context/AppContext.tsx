'use client';

// =============================================
// SMRITI CARE — App Context (Language, Patient, Online status)
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Language, Region, Patient, User } from '@/types';
import { getTranslations } from '@/i18n';

interface AppContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  region: Region;
  setRegion: (r: Region) => void;
  t: ReturnType<typeof getTranslations>;
  currentPatient: Patient | null;
  setCurrentPatient: (p: Patient | null) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  setPendingSyncCount: (n: number) => void;
  speak: (text: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [region, setRegion] = useState<Region>('general');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const t = getTranslations(language);

  // Persist language preference
  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti-language', l);
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem('smriti-language') as Language | null;
    if (savedLang) setLanguageState(savedLang);

    const savedPatient = localStorage.getItem('smriti-patient');
    if (savedPatient) {
      try { setCurrentPatient(JSON.parse(savedPatient)); } catch { /* ignore */ }
    }

    const savedUser = localStorage.getItem('smriti-user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch { /* ignore */ }
    }

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist patient & user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentPatient) {
      localStorage.setItem('smriti-patient', JSON.stringify(currentPatient));
    } else {
      localStorage.removeItem('smriti-patient');
    }
  }, [currentPatient]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUser) {
      localStorage.setItem('smriti-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smriti-user');
    }
  }, [currentUser]);

  // TTS speak helper
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        region,
        setRegion,
        t,
        currentPatient,
        setCurrentPatient,
        currentUser,
        setCurrentUser,
        isOnline,
        pendingSyncCount,
        setPendingSyncCount,
        speak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

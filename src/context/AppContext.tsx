'use client';

// =============================================
// SMRITI CARE — App Context (Language, Patient, Online status, TTS)
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { FamilyMember, Language, Patient, PatientDetails, Region, User } from '@/types';
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
  patientDetails: PatientDetails;
  setPatientDetails: (details: PatientDetails) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  setPendingSyncCount: (n: number) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [region, setRegion] = useState<Region>('general');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patientDetails, setPatientDetailsState] = useState<PatientDetails>({ patient_id: 'demo-patient', address: '', phone: '' });
  const [familyMembers, setFamilyMembersState] = useState<FamilyMember[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

    const savedDetails = localStorage.getItem('smriti-patient-details');
    if (savedDetails) {
      try { setPatientDetailsState(JSON.parse(savedDetails)); } catch { /* ignore */ }
    }

    const savedFamily = localStorage.getItem('smriti-family-members');
    if (savedFamily) {
      try { setFamilyMembersState(JSON.parse(savedFamily)); } catch { /* ignore */ }
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

  const setPatientDetails = useCallback((details: PatientDetails) => {
    setPatientDetailsState(details);
    if (typeof window !== 'undefined') localStorage.setItem('smriti-patient-details', JSON.stringify(details));
  }, []);

  const setFamilyMembers = useCallback((members: FamilyMember[]) => {
    setFamilyMembersState(members);
    if (typeof window !== 'undefined') localStorage.setItem('smriti-family-members', JSON.stringify(members));
  }, []);

  // TTS speak helper
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [language]);

  // TTS stop helper
  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

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
        patientDetails,
        setPatientDetails,
        familyMembers,
        setFamilyMembers,
        isOnline,
        pendingSyncCount,
        setPendingSyncCount,
        speak,
        stopSpeaking,
        isSpeaking,
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

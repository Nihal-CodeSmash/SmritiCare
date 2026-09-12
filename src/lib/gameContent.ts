// =============================================
// SMRITI CARE — Game Content (NER Cultural Pack)
// =============================================

import type { GameContent, Domain, Region } from '@/types';

// ---- Everyday objects familiar to NER users ----
export const CONTENT_OBJECTS: GameContent[] = [
  // Fruits
  { id: 'o1', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Banana', label_hi: 'केला', emoji: '🍌', active: true },
  { id: 'o2', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Apple', label_hi: 'सेब', emoji: '🍎', active: true },
  { id: 'o3', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Mango', label_hi: 'आम', emoji: '🥭', active: true },
  { id: 'o4', domain: 'memory', region: 'assam', language: 'en', difficulty: 1, type: 'object', label_en: 'Lemon', label_hi: 'नींबू', emoji: '🍋', active: true },
  { id: 'o5', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Orange', label_hi: 'संतरा', emoji: '🍊', active: true },
  { id: 'o6', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Grapes', label_hi: 'अंगूर', emoji: '🍇', active: true },
  { id: 'o7', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Watermelon', label_hi: 'तरबूज', emoji: '🍉', active: true },
  { id: 'o8', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Pineapple', label_hi: 'अनानास', emoji: '🍍', active: true },
  { id: 'o9', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Strawberry', label_hi: 'स्ट्रॉबेरी', emoji: '🍓', active: true },
  { id: 'o10', domain: 'memory', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Coconut', label_hi: 'नारियल', emoji: '🥥', active: true },

  // Household objects
  { id: 'h1', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Cup', label_hi: 'कप', emoji: '☕', active: true },
  { id: 'h2', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Key', label_hi: 'चाबी', emoji: '🔑', active: true },
  { id: 'h3', domain: 'memory', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Book', label_hi: 'किताब', emoji: '📖', active: true },
  { id: 'h4', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Umbrella', label_hi: 'छाता', emoji: '☂️', active: true },
  { id: 'h5', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Glasses', label_hi: 'चश्मा', emoji: '👓', active: true },
  { id: 'h6', domain: 'memory', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Flower', label_hi: 'फूल', emoji: '🌸', active: true },
  { id: 'h7', domain: 'memory', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Clock', label_hi: 'घड़ी', emoji: '🕐', active: true },
  { id: 'h8', domain: 'memory', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Basket', label_hi: 'टोकरी', emoji: '🧺', active: true },
  { id: 'h9', domain: 'memory', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Lamp', label_hi: 'दीपक', emoji: '🪔', active: true },
  { id: 'h10', domain: 'memory', region: 'general', language: 'en', difficulty: 4, type: 'object', label_en: 'Mirror', label_hi: 'दर्पण', emoji: '🪞', active: true },

  // Animals
  { id: 'a1', domain: 'pattern', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Cat', label_hi: 'बिल्ली', emoji: '🐱', active: true },
  { id: 'a2', domain: 'pattern', region: 'general', language: 'en', difficulty: 1, type: 'object', label_en: 'Dog', label_hi: 'कुत्ता', emoji: '🐶', active: true },
  { id: 'a3', domain: 'pattern', region: 'assam', language: 'en', difficulty: 1, type: 'object', label_en: 'Elephant', label_hi: 'हाथी', emoji: '🐘', active: true },
  { id: 'a4', domain: 'pattern', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Bird', label_hi: 'पक्षी', emoji: '🐦', active: true },
  { id: 'a5', domain: 'pattern', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Fish', label_hi: 'मछली', emoji: '🐟', active: true },
  { id: 'a6', domain: 'pattern', region: 'general', language: 'en', difficulty: 2, type: 'object', label_en: 'Butterfly', label_hi: 'तितली', emoji: '🦋', active: true },
  { id: 'a7', domain: 'pattern', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Hen', label_hi: 'मुर्गी', emoji: '🐔', active: true },
  { id: 'a8', domain: 'pattern', region: 'general', language: 'en', difficulty: 3, type: 'object', label_en: 'Cow', label_hi: 'गाय', emoji: '🐄', active: true },
];

// ---- Daily Routine Activities ----
export const ROUTINE_ACTIVITIES = [
  { id: 'r1', label_en: 'Wake Up', label_hi: 'उठना', emoji: '🌅', order: 1, time: '6:00 AM' },
  { id: 'r2', label_en: 'Brush Teeth', label_hi: 'दाँत साफ करना', emoji: '🪥', order: 2, time: '6:15 AM' },
  { id: 'r3', label_en: 'Morning Walk', label_hi: 'सुबह की सैर', emoji: '🚶', order: 3, time: '6:30 AM' },
  { id: 'r4', label_en: 'Breakfast', label_hi: 'नाश्ता', emoji: '🍽️', order: 4, time: '8:00 AM' },
  { id: 'r5', label_en: 'Medicine', label_hi: 'दवाई लेना', emoji: '💊', order: 5, time: '8:30 AM' },
  { id: 'r6', label_en: 'Rest', label_hi: 'आराम करना', emoji: '😴', order: 6, time: '10:00 AM' },
  { id: 'r7', label_en: 'Lunch', label_hi: 'दोपहर का खाना', emoji: '🍱', order: 7, time: '1:00 PM' },
  { id: 'r8', label_en: 'Afternoon Nap', label_hi: 'दोपहर की नींद', emoji: '💤', order: 8, time: '2:00 PM' },
  { id: 'r9', label_en: 'Evening Tea', label_hi: 'शाम की चाय', emoji: '🍵', order: 9, time: '4:00 PM' },
  { id: 'r10', label_en: 'Dinner', label_hi: 'रात का खाना', emoji: '🍛', order: 10, time: '7:00 PM' },
  { id: 'r11', label_en: 'Prayer/Meditation', label_hi: 'प्रार्थना', emoji: '🙏', order: 11, time: '7:30 PM' },
  { id: 'r12', label_en: 'Sleep', label_hi: 'सोना', emoji: '🌙', order: 12, time: '9:00 PM' },
];

// ---- Pattern recognition sets ----
export const PATTERN_SETS = [
  {
    id: 'p1',
    difficulty: 1,
    sequence: ['🔴', '🔵', '🔴', '🔵'],
    answer: '🔴',
    options: ['🔴', '🟡', '🟢'],
  },
  {
    id: 'p2',
    difficulty: 1,
    sequence: ['⭐', '⭐', '❤️', '⭐'],
    answer: '⭐',
    options: ['⭐', '❤️', '🔵'],
  },
  {
    id: 'p3',
    difficulty: 2,
    sequence: ['🔺', '🔷', '🔺', '🔷', '🔺'],
    answer: '🔷',
    options: ['🔷', '⭕', '🔹'],
  },
  {
    id: 'p4',
    difficulty: 2,
    sequence: ['🌸', '🌿', '🌸', '🌿'],
    answer: '🌸',
    options: ['🌸', '🌺', '🌻'],
  },
  {
    id: 'p5',
    difficulty: 3,
    sequence: ['1️⃣', '2️⃣', '3️⃣', '1️⃣', '2️⃣'],
    answer: '3️⃣',
    options: ['3️⃣', '4️⃣', '5️⃣'],
  },
  {
    id: 'p6',
    difficulty: 3,
    sequence: ['🔴', '🟡', '🟢', '🔴', '🟡'],
    answer: '🟢',
    options: ['🟢', '🔵', '🟣'],
  },
];

// ---- Get objects by difficulty ----
export function getObjectsByDifficulty(
  difficulty: number,
  domain: Domain = 'memory',
  count: number = 4
): GameContent[] {
  const filtered = CONTENT_OBJECTS.filter(
    (o) => o.active && o.domain === domain && o.difficulty <= difficulty
  );
  // Shuffle and pick `count` items
  return shuffle(filtered).slice(0, Math.min(count, filtered.length));
}

// ---- Get distractors (different objects) ----
export function getDistractors(
  shown: GameContent[],
  count: number = 3,
  domain: Domain = 'memory'
): GameContent[] {
  const shownIds = new Set(shown.map((o) => o.id));
  const pool = CONTENT_OBJECTS.filter((o) => !shownIds.has(o.id) && o.domain === domain && o.active);
  return shuffle(pool).slice(0, count);
}

// ---- Utility: shuffle ----
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Object count by difficulty ----
export function getObjectCountForDifficulty(level: number): number {
  const counts: Record<number, number> = { 1: 3, 2: 4, 3: 4, 4: 5, 5: 6 };
  return counts[level] ?? 3;
}

// ---- Distractor count by difficulty ----
export function getDistractorCountForDifficulty(level: number): number {
  const counts: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  return counts[level] ?? 2;
}

// ---- Show duration (ms) by difficulty ----
export function getShowDurationForDifficulty(level: number): number {
  const durations: Record<number, number> = { 1: 6000, 2: 5000, 3: 4000, 4: 5000, 5: 6000 };
  return durations[level] ?? 5000;
}

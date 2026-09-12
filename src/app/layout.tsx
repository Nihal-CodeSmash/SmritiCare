import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'SMRITI CARE — AI Cognitive & Memory Assistance Platform',
  description:
    'An offline-first, multilingual cognitive-support platform for elderly users with adaptive games, memory reminders, and caregiver analytics. Built for SIH 2026.',
  keywords: ['dementia support', 'cognitive games', 'elderly care', 'memory assistance', 'NER', 'SIH 2026'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0d1b4b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

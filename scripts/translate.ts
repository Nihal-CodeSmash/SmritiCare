/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { en } from '../src/i18n';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.SARVAM_API_KEY;

if (!API_KEY) {
  console.error("Please add your SARVAM_API_KEY to .env.local");
  process.exit(1);
}

const targetLanguages = [
  { code: 'as-IN', prefix: 'as', name: 'Assamese' },
  { code: 'mni-IN', prefix: 'mni', name: 'Meitei' },
  { code: 'lus-IN', prefix: 'lus', name: 'Mizo' },
  { code: 'njz-IN', prefix: 'njz', name: 'Naga' },
];

async function translateText(text: string, targetCode: string): Promise<string> {
  if (typeof text !== 'string' || text.trim() === '') return text;

  try {
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY!,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'en-IN',
        target_language_code: targetCode,
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'sarvam-translate:v1',
        enable_preprocessing: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Translation failed for "${text}": ${errorText}`);
      return text; // Fallback to English
    }

    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    console.warn(`Translation error for "${text}":`, error);
    return text;
  }
}

async function translateObject(obj: Record<string, any>, targetCode: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      result[key] = await translateText(value, targetCode);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = await Promise.all(value.map((item) => typeof item === 'string' ? translateText(item, targetCode) : item));
      } else {
        result[key] = await translateObject(value, targetCode);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function run() {
  for (const lang of targetLanguages) {
    console.log(`\nTranslating to ${lang.name} (${lang.code})...`);
    
    if (lang.code === 'lus-IN' || lang.code === 'njz-IN') {
      console.log(`⚠️  ${lang.name} is currently not supported by Sarvam AI Translate API. Skipping.`);
      continue;
    }
    
    // Attempt translation of the entire English object
    const translatedObj = await translateObject(en, lang.code);
    
    // Write back to src/i18n/
    const outPath = path.join(process.cwd(), 'src', 'i18n', `${lang.prefix}.ts`);
    const content = `import type { TranslationKeys } from './en';\n\nconst ${lang.prefix}: TranslationKeys = ${JSON.stringify(translatedObj, null, 2)};\n\nexport default ${lang.prefix};\n`;
    
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`✅ Saved ${lang.prefix}.ts`);
  }
  
  console.log("\nDone! Please remember to update src/i18n/index.ts to map the new files.");
}

run();

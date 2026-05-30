/**
 * Builds src/data/n5MainVocabulary.ts and n4MainVocabulary.ts from kanji vocab lists.
 * Run: node scripts/build-main-vocabulary.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kanaToRomaji } from './kanaToRomaji.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseVocabularyTs(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const entries = [];
  const re =
    /\{\s*word:\s*'((?:\\'|[^'])*)',\s*reading:\s*'((?:\\'|[^'])*)',\s*romaji:\s*'((?:\\'|[^'])*)',\s*meaning:\s*'((?:\\'|[^'])*)'\s*\}/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    entries.push({
      word: match[1].replace(/\\'/g, "'"),
      reading: match[2].replace(/\\'/g, "'"),
      romaji: match[3].replace(/\\'/g, "'"),
      meaning: match[4].replace(/\\'/g, "'"),
    });
  }
  return entries;
}

function guessPos(word, reading, meaning) {
  const m = meaning.toLowerCase();
  if (m.startsWith('to ') && !m.includes(';')) return 'verb';
  if (word.endsWith('する')) return 'verb';
  if (m.includes('expression') || m.includes('greeting')) return 'expression';
  if (m.includes('adverb') || m.endsWith('ly')) return 'adv';
  if (word.endsWith('な') && reading.endsWith('な')) return 'adj-na';
  const head = m.split(/[;,]/)[0].trim();
  if (word.endsWith('い') || reading.endsWith('い')) {
    if (/^(big|small|new|old|hot|cold|good|bad|high|low|cheap|long|short|early|late|young|fun|difficult|easy|busy|quiet|fast|slow|heavy|light|near|far|delicious|tasty|warm|cool|happy|sad|pretty|beautiful|interesting|boring|scary|safe|clean|white|black|red|blue|tall|wide|narrow|deep|empty|full|open|closed|correct|wrong|same|different|important|ready|alone|together|right|left|inside|outside|north|south|east|west)/.test(head)) {
      return 'adj-i';
    }
  }
  return 'noun';
}

function makeExample(word, meaning, pos) {
  const brief = meaning.split(';')[0].trim();
  const briefLower = brief.toLowerCase();
  switch (pos) {
    case 'verb':
      if (word.endsWith('する')) {
        return [`${word.slice(0, -2)}します。`, `I ${briefLower.replace(/^to /, '')}.`];
      }
      return [`毎日${word}。`, `I ${briefLower.replace(/^to /, '')} every day.`];
    case 'adj-i':
      return [`とても${word}。`, `It is very ${briefLower}.`];
    case 'adj-na':
      return [`${word}です。`, `It is ${briefLower}.`];
    case 'adv':
      return [`${word}、行きます。`, `I go ${briefLower}.`];
    case 'expression':
      return [word, brief];
    default:
      return [`${word}が好きです。`, `I like ${briefLower}.`];
  }
}

function dedupeEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries) {
    const key = `${entry.word}|${entry.reading}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function enrich(entry) {
  const partOfSpeech = guessPos(entry.word, entry.reading, entry.meaning);
  const [example, exampleMeaning] = makeExample(entry.word, entry.meaning, partOfSpeech);
  return {
    word: entry.word,
    reading: entry.reading,
    romaji: entry.romaji?.trim() || kanaToRomaji(entry.reading),
    meaning: entry.meaning.split(';')[0].trim(),
    partOfSpeech,
    example,
    exampleMeaning,
  };
}

function writeFile(level, entries) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lines = [
    "import type { MainVocabularySeed } from '../types';",
    '',
    `/** JLPT ${level} main vocabulary for review. */`,
    `export const ${level}_MAIN_VOCABULARY: MainVocabularySeed[] = [`,
  ];
  for (const e of entries) {
    lines.push(
      `  { word: '${esc(e.word)}', reading: '${esc(e.reading)}', romaji: '${esc(e.romaji)}', meaning: '${esc(e.meaning)}', partOfSpeech: '${e.partOfSpeech}', example: '${esc(e.example)}', exampleMeaning: '${esc(e.exampleMeaning)}' },`,
    );
  }
  lines.push('];', '');
  fs.writeFileSync(
    path.join(__dirname, `../src/data/${level.toLowerCase()}MainVocabulary.ts`),
    lines.join('\n'),
    'utf8',
  );
  console.log(level, entries.length, 'entries');
}

const n5Raw = parseVocabularyTs(path.join(__dirname, '../src/data/n5Vocabulary.ts'));
const n4Raw = parseVocabularyTs(path.join(__dirname, '../src/data/n4Vocabulary.ts'));
writeFile('N5', dedupeEntries(n5Raw).map(enrich));
writeFile('N4', dedupeEntries(n4Raw).map(enrich));

/** Hepburn-style romaji from hiragana/katakana (for vocabulary readings). */

const KATA_OFFSET = 0x60;

const BASE = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  ゐ: 'wi',
  ゑ: 'we',
  を: 'wo',
  ん: 'n',
  ゔ: 'vu',
  ゕ: 'ka',
  ゖ: 'ke',
};

const SMALL_Y = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa' };

const DIGRAPHS = {
  きゃ: 'kya',
  きゅ: 'kyu',
  きょ: 'kyo',
  ぎゃ: 'gya',
  ぎゅ: 'gyu',
  ぎょ: 'gyo',
  しゃ: 'sha',
  しゅ: 'shu',
  しょ: 'sho',
  じゃ: 'ja',
  じゅ: 'ju',
  じょ: 'jo',
  ちゃ: 'cha',
  ちゅ: 'chu',
  ちょ: 'cho',
  にゃ: 'nya',
  にゅ: 'nyu',
  にょ: 'nyo',
  ひゃ: 'hya',
  ひゅ: 'hyu',
  ひょ: 'hyo',
  びゃ: 'bya',
  びゅ: 'byu',
  びょ: 'byo',
  ぴゃ: 'pya',
  ぴゅ: 'pyu',
  ぴょ: 'pyo',
  みゃ: 'mya',
  みゅ: 'myu',
  みょ: 'myo',
  りゃ: 'rya',
  りゅ: 'ryu',
  りょ: 'ryo',
};

function toHiragana(text) {
  // Normalize to NFC so combining dakuten (が) becomes precomposed (が).
  const normalized = text.normalize('NFC');
  return [...normalized].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
      return String.fromCharCode(code - KATA_OFFSET);
    }
    if (ch === 'ー') return 'ー';
    return ch;
  }).join('');
}

function consonantOf(romaji) {
  if (!romaji || romaji === 'n') return '';
  if (romaji === 'chi') return 'ch';
  if (romaji === 'shi') return 'sh';
  if (romaji === 'tsu') return 'ts';
  if (romaji.endsWith('u') && romaji.length > 1) return romaji.slice(0, -1);
  return romaji;
}

/**
 * @param {string} input
 * @returns {string}
 */
export function kanaToRomaji(input) {
  const src = toHiragana(input.trim());
  let out = '';
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === 'っ') {
      const next = src.slice(i + 1, i + 3);
      const digraph = DIGRAPHS[next] ?? BASE[src[i + 1]];
      const c = consonantOf(digraph ?? '');
      if (c) out += c;
      i += 1;
      continue;
    }

    if (ch === 'ー') {
      const prev = out[out.length - 1];
      if (prev && 'aiueo'.includes(prev)) out += prev;
      i += 1;
      continue;
    }

    const tri = src.slice(i, i + 2);
    if (DIGRAPHS[tri]) {
      out += DIGRAPHS[tri];
      i += 2;
      continue;
    }

    const pair = src.slice(i, i + 2);
    if (BASE[pair[0]] && SMALL_Y[pair[1]]) {
      const base = BASE[pair[0]];
      const y = SMALL_Y[pair[1]].slice(1);
      out += base.slice(0, -1) + y;
      i += 2;
      continue;
    }

    if (BASE[ch]) {
      out += BASE[ch];
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

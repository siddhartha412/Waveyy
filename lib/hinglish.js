const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

const vowels = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ii",
  "उ": "u",
  "ऊ": "uu",
  "ऋ": "ri",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
  "ऑ": "o",
  "ऍ": "e",
};

const matras = {
  "ा": "aa",
  "ि": "i",
  "ी": "ii",
  "ु": "u",
  "ू": "uu",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "ॉ": "o",
  "ॅ": "e",
  "ं": "n",
  "ँ": "n",
  "ः": "h",
};

const consonants = {
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "ng",
  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "ny",
  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",
  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",
  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",
  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "v",
  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",
  "ळ": "l",
  // Nukta characters (NFC forms)
  "\u0958": "q",   // क़
  "\u0959": "kh",  // ख़
  "\u095A": "gh",  // ग़
  "\u095B": "z",   // ज़
  "\u095C": "d",   // ड़ - User requested "do ra to ...", usually 'd' (Dhadkan) or 'r'. 'd' is safer for 'Dhadkan'.
  "\u095D": "rh",  // ढ़
  "\u095E": "f",   // फ़
  "\u095F": "y",   // य़
};

const halant = "्";

// Manual replacement map for Decomposed -> Precomposed
const nuktaReplacements = [
  ["क\u093C", "\u0958"], // q
  ["ख\u093C", "\u0959"], // kh
  ["ग\u093C", "\u095A"], // gh
  ["ज\u093C", "\u095B"], // z
  ["ड\u093C", "\u095C"], // d
  ["ढ\u093C", "\u095D"], // rh
  ["फ\u093C", "\u095E"], // f
  ["य\u093C", "\u095F"], // y
];

export const toHinglish = (text = "") => {
  if (!text || typeof text !== "string") return text;
  if (!DEVANAGARI_REGEX.test(text)) return text;

  // Manually replace decomposed instances first
  for (const [base, composed] of nuktaReplacements) {
    text = text.split(base).join(composed);
  }

  // Normalize remaining (just in case)
  text = text.normalize("NFC");

  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (vowels[ch]) {
      out += vowels[ch];
      continue;
    }

    if (consonants[ch]) {
      const base = consonants[ch];
      if (next === halant) {
        out += base;
        i += 1;
        continue;
      }
      if (matras[next]) {
        out += base + matras[next];
        i += 1;
        continue;
      }

      // Schwa deletion: Only add 'a' if the next char is a valid Devanagari char (consonant/vowel/halant/matra)
      // If it's space, punctuation, or end of string, don't add 'a'.
      if (next && DEVANAGARI_REGEX.test(next) && next !== "\u093C") {
        out += base + "a";
      } else {
        out += base;
      }
      continue;
    }

    if (matras[ch]) {
      out += matras[ch];
      continue;
    }

    // Skip standalone Nukta (should have been replaced, but if stray)
    if (ch === "\u093C") continue;

    // Safety: If character is Devanagari but not mapped (e.g. accents, modifiers we missed), drop it.
    if (DEVANAGARI_REGEX.test(ch)) continue;

    out += ch;
  }

  // Post-normalization for common transliteration edge cases.
  return out
    .replace(/\bvnde\b/gi, "vande");
};

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Preprocesses text before passing to Cartesia TTS.
 * Replaces written laughter (e.g. "haha", "hahaha", "ha-ha", "hehe", "lol", "*laughs*", "*chuckles*")
 * with Cartesia expressive emotion tags like [laughter] or [chuckle].
 * This prevents Cartesia from pronouncing "haha" literally/robotically as letters and instead generates natural human laughter.
 */
export function preprocessCartesiaText(text: string): string {
  if (!text) return text;

  let processed = text;

  // 1. Strip markdown symbols that cause speech artifacts (*, _, #, ~)
  processed = processed.replace(/[\*_~`#]/g, '');

  // 2. Convert parenthetical or action descriptions into Cartesia sound tags
  processed = processed.replace(/\(?(laughs|laughing|giggles|giggle|chuckles|chuckle|snickers|snicker|sighs|sigh)\)?/gi, (match, action) => {
    const lower = action.toLowerCase();
    if (lower.includes('chuckle') || lower.includes('snicker')) return '[chuckle]';
    if (lower.includes('giggle')) return '[giggle]';
    if (lower.includes('sigh')) return '[sigh]';
    return '[laughter]';
  });

  // 3. Convert written laughter spellings ("hahaha", "haha", "ha-ha", "ha ha", "hehe", "hehehe", "lol", "lmao", "rofl")
  // into Cartesia audio tags [laughter] or [chuckle]
  processed = processed.replace(/\b(ha(ha)+|ha-ha|ha\sha|hehe(he)*|lol|rofl|lmao)\b/gi, (match) => {
    if (match.toLowerCase().startsWith('he')) {
      return '[chuckle]';
    }
    return '[laughter]';
  });

  // 4. Clean up repeated consecutive tags like "[laughter] [laughter]" -> "[laughter]"
  processed = processed.replace(/(\[(laughter|chuckle|giggle|sigh)\]\s*)+/gi, '$1');

  // 5. Ensure space after tags if followed immediately by text
  processed = processed.replace(/(\[(laughter|chuckle|giggle|sigh)\])([A-Za-z])/g, '$1 $3');

  // 6. Normalize multiple spaces
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
}

/**
 * Strips Cartesia sound/emotion tags (e.g. [laughter], [chuckle], [sigh], [giggle])
 * and asterisk/parenthetical action descriptors (e.g. *laughs*, *chuckles*, (sighs))
 * from text so they are hidden from the user UI text display while leaving the audio expressive.
 */
export function stripAudioTags(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // 1. Remove square bracket audio/emotion tags like [laughter], [chuckle], [sigh], [giggle], [gasp], etc.
  cleaned = cleaned.replace(/\[(laughter|chuckle|giggle|sigh|gasp|groan|yawn|cough|snicker|applause|cheering|screaming|whispering|[a-zA-Z_\s-]+)\]/gi, '');

  // 2. Remove asterisk action descriptions like *laughs*, *chuckles*, *smiles*
  cleaned = cleaned.replace(/\*+[^*]+\*+/g, '');

  // 3. Fix orphan punctuation spaces, e.g. "Hello , " -> "Hello, " or " ! " -> "! "
  cleaned = cleaned.replace(/\s+([.,!?:;])/g, '$1');

  // 4. Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}
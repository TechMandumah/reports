/**
 * Language Detection Utility
 * Detects the language of text and returns ISO 639-1 language codes
 */

/**
 * Detect the language of a given text string
 * @param text - The text to analyze
 * @returns Language code ('AR' for Arabic, 'EN' for English, etc.) or empty string if unable to detect
 */
export function detectLanguage(text: string | null | undefined): string {
  if (!text || text.trim() === '') {
    return '';
  }

  const trimmedText = text.trim();
  
  // Count different character types
  const arabicChars = (trimmedText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (trimmedText.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (trimmedText.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
  const japaneseChars = (trimmedText.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const koreanChars = (trimmedText.match(/[\uAC00-\uD7AF\u1100-\u11FF]/g) || []).length;
  const cyrillicChars = (trimmedText.match(/[\u0400-\u04FF]/g) || []).length;
  const greekChars = (trimmedText.match(/[\u0370-\u03FF]/g) || []).length;
  const hebrewChars = (trimmedText.match(/[\u0590-\u05FF]/g) || []).length;
  const thaiChars = (trimmedText.match(/[\u0E00-\u0E7F]/g) || []).length;
  const devanagariChars = (trimmedText.match(/[\u0900-\u097F]/g) || []).length;
  
  // Total characters (excluding spaces and punctuation)
  const totalChars = arabicChars + latinChars + chineseChars + japaneseChars + 
                     koreanChars + cyrillicChars + greekChars + hebrewChars + 
                     thaiChars + devanagariChars;
  
  // If no significant characters detected, return empty
  if (totalChars === 0) {
    return '';
  }
  
  // Calculate percentages
  const arabicPercent = (arabicChars / totalChars) * 100;
  const latinPercent = (latinChars / totalChars) * 100;
  const chinesePercent = (chineseChars / totalChars) * 100;
  const japanesePercent = (japaneseChars / totalChars) * 100;
  const koreanPercent = (koreanChars / totalChars) * 100;
  const cyrillicPercent = (cyrillicChars / totalChars) * 100;
  const greekPercent = (greekChars / totalChars) * 100;
  const hebrewPercent = (hebrewChars / totalChars) * 100;
  const thaiPercent = (thaiChars / totalChars) * 100;
  const devanagariPercent = (devanagariChars / totalChars) * 100;
  
  // Determine language based on highest percentage (threshold: 30%)
  const threshold = 30;
  
  // Create array of language percentages
  const languages = [
    { code: 'AR', percent: arabicPercent },
    { code: 'EN', percent: latinPercent },  // Assuming Latin = English (most common)
    { code: 'ZH', percent: chinesePercent },
    { code: 'JA', percent: japanesePercent },
    { code: 'KO', percent: koreanPercent },
    { code: 'RU', percent: cyrillicPercent },  // Assuming Cyrillic = Russian (most common)
    { code: 'EL', percent: greekPercent },
    { code: 'HE', percent: hebrewPercent },
    { code: 'TH', percent: thaiPercent },
    { code: 'HI', percent: devanagariPercent },

  ];
  
  // Sort by percentage (descending)
  languages.sort((a, b) => b.percent - a.percent);
  
  // Return the highest percentage language if it meets threshold
  if (languages[0].percent >= threshold) {
    return languages[0].code;
  }
  
  // If no clear majority but Latin chars exist, default to EN
  if (latinPercent > 10) {
    return 'EN';
  }
  
  // Return the highest percentage language even if below threshold
  return languages[0].percent > 0 ? languages[0].code : '';
}

/**
 * Detect language and return more specific codes for Latin-based languages
 * This is a more advanced version that can differentiate between EN, FR, ES, DE, etc.
 * based on common character patterns and diacritics
 */
export function detectLanguageAdvanced(text: string | null | undefined): string {
  const basicLang = detectLanguage(text);
  
  // If it's not Latin-based, return the basic detection
  if (basicLang !== 'EN') {
    return basicLang;
  }
  
  if (!text || text.trim() === '') {
    return '';
  }
  
  const trimmedText = text.trim().toLowerCase();
  
  // French indicators: accents (é, è, ê, ç, à), common words
  const hasFrenchAccents = /[éèêëçàâùûô]/g.test(trimmedText);
  const frenchWords = /(le|la|les|de|du|des|et|un|une|dans|pour|avec|est|ce|que)/g;
  const frenchMatches = (trimmedText.match(frenchWords) || []).length;
  
  // Spanish indicators: ñ, accents, inverted punctuation
  const hasSpanishChars = /[ñáéíóúü¿¡]/g.test(trimmedText);
  const spanishWords = /(el|la|los|las|de|del|y|un|una|en|para|con|que|es)/g;
  const spanishMatches = (trimmedText.match(spanishWords) || []).length;
  
  // German indicators: umlauts, ß
  const hasGermanChars = /[äöüß]/g.test(trimmedText);
  const germanWords = /(der|die|das|und|ein|eine|in|zu|den|ist|von|für|mit)/g;
  const germanMatches = (trimmedText.match(germanWords) || []).length;
  
  // Italian indicators: common patterns
  const italianWords = /(il|lo|la|i|gli|le|di|da|un|una|in|per|con|che|è)/g;
  const italianMatches = (trimmedText.match(italianWords) || []).length;
  
  // Portuguese indicators
  const portugueseWords = /(o|a|os|as|de|do|da|dos|das|e|um|uma|em|para|com|que|é)/g;
  const portugueseMatches = (trimmedText.match(portugueseWords) || []).length;
  
  // Score each language
  const scores = {
    FR: (hasFrenchAccents ? 3 : 0) + frenchMatches,
    ES: (hasSpanishChars ? 3 : 0) + spanishMatches,
    DE: (hasGermanChars ? 3 : 0) + germanMatches,
    IT: italianMatches,
    PT: portugueseMatches
  };
  
  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  
  // If a clear winner with significant score (>= 3), return that language
  if (maxScore >= 3) {
    const detectedLang = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    return detectedLang || 'EN';
  }
  
  // Default to English
  return 'EN';
}

/**
 * Batch detect languages for multiple texts
 * @param texts - Array of texts to analyze
 * @param useAdvanced - Whether to use advanced Latin language detection
 * @returns Array of language codes
 */
export function detectLanguageBatch(texts: (string | null | undefined)[], useAdvanced: boolean = false): string[] {
  const detectFn = useAdvanced ? detectLanguageAdvanced : detectLanguage;
  return texts.map(text => detectFn(text));
}

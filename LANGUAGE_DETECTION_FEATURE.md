# Language Detection Feature for Title Reports

## Overview
Language detection columns have been added to all title reports to automatically detect and display the language of each title field (245 and 246 fields).

## Implementation Date
19 October 2025

## Files Modified

### 1. New File: `src/utils/languageDetection.ts`
**Purpose**: Contains language detection utility functions

**Key Functions**:
- `detectLanguage(text: string)`: Basic language detection using Unicode character ranges
- `detectLanguageAdvanced(text: string)`: Advanced detection for Latin-based languages (EN, FR, ES, DE, IT, PT)
- `detectLanguageBatch(texts: string[], useAdvanced: boolean)`: Batch processing for multiple texts

**Supported Languages**:
- **AR** - Arabic (Unicode range: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF)
- **EN** - English (Latin characters, default for Latin script)
- **ZH** - Chinese (Unicode range: \u4E00-\u9FFF, \u3400-\u4DBF)
- **JA** - Japanese (Unicode range: \u3040-\u309F, \u30A0-\u30FF)
- **KO** - Korean (Unicode range: \uAC00-\uD7AF, \u1100-\u11FF)
- **RU** - Russian/Cyrillic (Unicode range: \u0400-\u04FF)
- **EL** - Greek (Unicode range: \u0370-\u03FF)
- **HE** - Hebrew (Unicode range: \u0590-\u05FF)
- **TH** - Thai (Unicode range: \u0E00-\u0E7F)
- **HI** - Hindi/Devanagari (Unicode range: \u0900-\u097F)
- **FR** - French (via advanced detection with accents: é, è, ê, ç, etc.)
- **ES** - Spanish (via advanced detection with ñ, accents, ¿, ¡)
- **DE** - German (via advanced detection with umlauts: ä, ö, ü, ß)
- **IT** - Italian (via advanced detection)
- **PT** - Portuguese (via advanced detection)

**Detection Algorithm**:
1. Count characters from each language's Unicode range
2. Calculate percentage for each language
3. Return language with highest percentage (threshold: 30%)
4. For Latin scripts, can use advanced detection to differentiate between EN/FR/ES/DE/IT/PT

### 2. Modified File: `src/services/reportService.ts`

**Changes**:
- Added import: `import { detectLanguage } from '@/utils/languageDetection';`
- Updated `generatePredefinedReport()` function for title reports
- Added language detection for each title field

**New Fields Added** (for each title field):
```typescript
result.title_245_1_a = (record as any).marc_245_1_a || '';
result.title_245_1_a_lang = detectLanguage(result.title_245_1_a);  // NEW

result.title_245_1_b = (record as any).marc_245_1_b || '';
result.title_245_1_b_lang = detectLanguage(result.title_245_1_b);  // NEW

result.title_246_1_a = (record as any).marc_246_1_a || '';
result.title_246_1_a_lang = detectLanguage(result.title_246_1_a);  // NEW

// ... and so on for all title fields
```

**Affected Report Types**:
- `export_research_titles`
- `export_translations_titles_authors`
- `export_translations_citation_title`

### 3. Modified File: `src/utils/excelExport.ts`

**Changes to `export_research_titles` Configuration**:
```typescript
columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Biblio Details", key: "biblio_details" },
  { header: "Title 245 (1)(a)", key: "title_245_1_a" },
  { header: "245(1)(a) Lang", key: "title_245_1_a_lang" },  // NEW
  { header: "Title 246 (1)(a)", key: "title_246_1_a" },
  { header: "246(1)(a) Lang", key: "title_246_1_a_lang" },  // NEW
  { header: "Title 246 (2)(a)", key: "title_246_2_a" },
  { header: "246(2)(a) Lang", key: "title_246_2_a_lang" },  // NEW
  { header: "Title 246 (3)(a)", key: "title_246_3_a" },
  { header: "246(3)(a) Lang", key: "title_246_3_a_lang" },  // NEW
  { header: "Title 242 (1)(a)", key: "title_242_1_a" },
  { header: "242(1)(a) Lang", key: "title_242_1_a_lang" },  // NEW
  { header: "Language 041", key: "language_041" },
]
```

**Changes to `export_translations_titles_authors` Configuration**:
Similar pattern - language column added after each title column:
```typescript
{ header: "Title 245 (1)(a)", key: "title_245_1_a" },
{ header: "245(1)(a) Lang", key: "title_245_1_a_lang" },  // NEW
{ header: "Title 245 (1)(b)", key: "title_245_1_b" },
{ header: "245(1)(b) Lang", key: "title_245_1_b_lang" },  // NEW
// ... pattern continues for all title fields
```

## Column Structure

### export_research_titles Report
Total new columns added: **5 language columns**

| Original Column | New Language Column |
|----------------|---------------------|
| Title 245 (1)(a) | 245(1)(a) Lang |
| Title 246 (1)(a) | 246(1)(a) Lang |
| Title 246 (2)(a) | 246(2)(a) Lang |
| Title 246 (3)(a) | 246(3)(a) Lang |
| Title 242 (1)(a) | 242(1)(a) Lang |

### export_translations_titles_authors Report
Total new columns added: **8 language columns**

| Original Column | New Language Column |
|----------------|---------------------|
| Title 245 (1)(a) | 245(1)(a) Lang |
| Title 245 (1)(b) | 245(1)(b) Lang |
| Title 246 (1)(a) | 246(1)(a) Lang |
| Title 246 (1)(b) | 246(1)(b) Lang |
| Title 246 (2)(a) | 246(2)(a) Lang |
| Title 246 (2)(b) | 246(2)(b) Lang |
| Title 246 (3)(a) | 246(3)(a) Lang |
| Title 246 (3)(b) | 246(3)(b) Lang |
| Title 242 (1)(a) | 242(1)(a) Lang |
| Title 242 (1)(b) | 242(1)(b) Lang |

## Usage Examples

### Example 1: Arabic Title
- **Title**: "التعليم العالي في المملكة العربية السعودية"
- **Detected Language**: AR
- **Reason**: Arabic Unicode characters detected (>30% threshold)

### Example 2: English Title
- **Title**: "Higher Education in Saudi Arabia"
- **Detected Language**: EN
- **Reason**: Latin characters, no special diacritics

### Example 3: French Title
- **Title**: "L'éducation supérieure en France"
- **Detected Language**: FR (if using advanced detection)
- **Reason**: French accents (é) and common French words detected

### Example 4: Mixed Language Title
- **Title**: "Education التعليم"
- **Detected Language**: EN or AR (whichever has higher percentage)
- **Reason**: Mixed content - highest percentage wins

### Example 5: Empty Title
- **Title**: ""
- **Detected Language**: (empty string)
- **Reason**: No content to analyze

## Technical Details

### Detection Threshold
- **Primary threshold**: 30% - A language must represent at least 30% of characters to be detected
- **Fallback**: If no language meets the 30% threshold but Latin characters exist (>10%), defaults to 'EN'
- **Final fallback**: Returns the language with highest percentage even if below threshold

### Character Counting
The algorithm:
1. Counts characters from each Unicode range (Arabic, Latin, Chinese, etc.)
2. Calculates total countable characters (excludes spaces, punctuation)
3. Computes percentage for each language
4. Returns language code with highest percentage

### Performance Considerations
- **Fast**: Uses regex matching on Unicode ranges
- **Efficient**: Single pass through text
- **Scalable**: Can process thousands of titles per second
- **Memory**: Minimal - only counts characters, doesn't store large data structures

## Data Flow

```
Database (MARC XML)
  ↓
reportService.ts (EXTRACTVALUE)
  ↓
generatePredefinedReport() extracts title fields
  ↓
detectLanguage() function called for each title
  ↓
Language code ('AR', 'EN', etc.) added to result
  ↓
excelExport.ts includes language columns
  ↓
Excel file with title + language columns
```

## Testing Recommendations

1. **Test Arabic titles**: Verify AR detection
2. **Test English titles**: Verify EN detection
3. **Test mixed content**: Check which language wins
4. **Test empty fields**: Ensure empty string returned
5. **Test special characters**: Ensure proper handling
6. **Test performance**: Generate report with 1000+ records

## Future Enhancements

### Possible Improvements:
1. **Advanced Latin detection by default**: Enable FR/ES/DE/IT/PT detection automatically
2. **Confidence score**: Add column showing detection confidence (0-100%)
3. **Multi-language detection**: Show all detected languages if multiple exist (e.g., "AR/EN")
4. **Custom threshold**: Allow users to configure detection threshold
5. **Language statistics**: Add summary showing language distribution across all records
6. **Machine learning**: Use ML models for more accurate detection
7. **Context-aware**: Consider MARC 041 field to validate detected language

## Maintenance Notes

- **Unicode ranges**: Keep updated as Unicode standard evolves
- **Language additions**: Easy to add new languages by adding Unicode ranges
- **Testing**: Add unit tests for languageDetection.ts
- **Documentation**: Update if new languages added

## Support

For issues or questions about language detection:
1. Check `languageDetection.ts` comments for algorithm details
2. Verify Unicode ranges match expected language scripts
3. Test with sample data to validate detection accuracy
4. Consider enabling advanced detection for Latin-based language differentiation

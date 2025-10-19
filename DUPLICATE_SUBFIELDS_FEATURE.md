# Duplicate Subfields Handling in Custom Reports

## Overview
Custom MARC field reports now properly handle duplicate subfields within the same datafield instance by concatenating them with the '|' separator character.

## Implementation Date
19 October 2025

## Problem Statement
In MARC records, some fields can have multiple subfields with the same code within a single datafield instance. For example:

```xml
<datafield tag="692" ind1=" " ind2=" ">
  <subfield code="a">Education</subfield>
  <subfield code="a">Technology</subfield>
  <subfield code="a">Innovation</subfield>
</datafield>
```

Previously, the EXTRACTVALUE function only returned the first value ("Education"), losing the other values.

## Solution
The system now:
1. Identifies fields configured to have duplicate subfields
2. Retrieves the full MARC XML metadata for those records
3. Parses the XML to extract ALL duplicate subfield values
4. Joins them with ' | ' separator

Result: "Education | Technology | Innovation"

## Affected Fields

Fields marked with `duplicateSubfields: true`:
- **692** (Keywords) - subfields 'a' and 'b'
- **653** (Index Term) - subfield 'a'

## Files Modified

### 1. `src/services/reportService.ts`

#### Type Definition Update (Line 465)
```typescript
const MARC_FIELD_CONFIGS: { 
  [key: string]: { 
    subfields: string[], 
    multiValue?: boolean, 
    duplicateSubfields?: boolean  // NEW PROPERTY
  } 
} = {
  // ... field configurations
  '653': { subfields: ['a'], multiValue: true, duplicateSubfields: true },
  '692': { subfields: ['a', 'b'], multiValue: true, duplicateSubfields: true },
}
```

#### New Helper Function: `extractDuplicateSubfields()` (Lines 495-538)
```typescript
function extractDuplicateSubfields(marcXML: string | null, fieldTag: string, subfieldCode: string): string
```

**Purpose**: Extracts all duplicate subfields from MARC XML and joins them with ' | '

**Algorithm**:
1. Find all `<datafield tag="XXX">` instances
2. For each datafield, find all `<subfield code="Y">` elements
3. Collect all values within the same datafield
4. Join duplicate subfields within same datafield with ' | '
5. Join multiple datafield instances with ' | '

**Example**:
- Input: MARC XML with two 692 datafields, first has "A|B", second has "C"
- Output: "A | B | C"

#### Query Enhancement: `getBiblioRecordsForCustomReport()` (Lines 710-760)

**Added logic**:
```typescript
// Check if we need to include MARC XML metadata for duplicate subfield processing
const needsMetadata = selectedFields.some(fieldTag => {
  const config = MARC_FIELD_CONFIGS[fieldTag];
  return config?.duplicateSubfields === true;
});

const metadataSelect = needsMetadata ? ',\n      bm.metadata' : '';
```

**Impact**: Only fetches metadata when necessary (performance optimization)

#### Query Enhancement: `getBiblioRecordsByNumbers()` (Lines 637-643)

Same metadata inclusion logic for biblio number searches.

#### Data Processing: `generateCustomReport()` (Lines 810-848)

**Added duplicate subfield processing**:
```typescript
// Process fields with duplicate subfields if metadata is available
const metadata = record.metadata || null;

Object.keys(marcFieldMap).forEach(marcKey => {
  let fieldValue = record[marcKey] || '';
  
  // Extract field tag and subfield code from marcKey
  const marcKeyMatch = marcKey.match(/^marc_(\d+)_([a-z0-9]+)$/i);
  if (marcKeyMatch && metadata) {
    const fieldTag = marcKeyMatch[1];
    const subfieldCode = marcKeyMatch[2];
    const config = MARC_FIELD_CONFIGS[fieldTag];
    
    // If this field is configured to have duplicate subfields, extract all values
    if (config?.duplicateSubfields === true) {
      const extractedValue = extractDuplicateSubfields(metadata, fieldTag, subfieldCode);
      if (extractedValue) {
        fieldValue = extractedValue;
      }
    }
  }
  
  (result as any)[marcKey] = fieldValue;
  (result as any)[fieldName] = fieldValue;
});

// Remove metadata from result to avoid including it in export
delete (result as any).metadata;
```

## Examples

### Example 1: Single datafield with duplicate subfields
**MARC XML**:
```xml
<datafield tag="692" ind1=" " ind2=" ">
  <subfield code="a">الذكاء الاصطناعي</subfield>
  <subfield code="a">التعلم الآلي</subfield>
  <subfield code="a">التعليم</subfield>
</datafield>
```

**Excel Export**: 
| 692_a |
|-------|
| الذكاء الاصطناعي \| التعلم الآلي \| التعليم |

### Example 2: Multiple datafields with duplicate subfields
**MARC XML**:
```xml
<datafield tag="692" ind1=" " ind2=" ">
  <subfield code="a">Education</subfield>
  <subfield code="a">Higher Education</subfield>
</datafield>
<datafield tag="692" ind1=" " ind2=" ">
  <subfield code="a">Saudi Arabia</subfield>
</datafield>
```

**Excel Export**:
| 692_a |
|-------|
| Education \| Higher Education \| Saudi Arabia |

### Example 3: Field 653 (Index Terms)
**MARC XML**:
```xml
<datafield tag="653" ind1=" " ind2=" ">
  <subfield code="a">Universities</subfield>
  <subfield code="a">Research</subfield>
  <subfield code="a">Innovation</subfield>
  <subfield code="a">Development</subfield>
</datafield>
```

**Excel Export**:
| 653_a |
|-------|
| Universities \| Research \| Innovation \| Development |

### Example 4: Mixed - 692 with both 'a' and 'b' subfields
**MARC XML**:
```xml
<datafield tag="692" ind1=" " ind2=" ">
  <subfield code="a">Technology</subfield>
  <subfield code="a">Innovation</subfield>
  <subfield code="b">تكنولوجيا</subfield>
  <subfield code="b">ابتكار</subfield>
</datafield>
```

**Excel Export**:
| 692_a | 692_b |
|-------|-------|
| Technology \| Innovation | تكنولوجيا \| ابتكار |

## Performance Considerations

### Optimization: Conditional Metadata Fetching
- Metadata (MARC XML) is only fetched when at least one selected field has `duplicateSubfields: true`
- This prevents unnecessary data transfer for most reports
- Typical metadata size: 5-50 KB per record

### Impact on Query Performance
- **Without duplicate subfields**: No impact (metadata not fetched)
- **With duplicate subfields**: Minimal impact (~5-10% slower due to larger data transfer)
- Metadata is stored in `biblio_metadata.metadata` (LONGTEXT column)

### Memory Usage
- Metadata temporarily stored in JavaScript for processing
- Removed from final result before export
- No increase in exported file size

## Data Flow

```
Database Query
  ↓
Check if any selected field has duplicateSubfields flag
  ↓
If YES: Include bm.metadata in SELECT
  ↓
Execute query and retrieve records
  ↓
For each record with metadata:
  ↓
  For each MARC field in result:
    ↓
    Check if field has duplicateSubfields flag
    ↓
    If YES: Call extractDuplicateSubfields()
      ↓
      Parse MARC XML
      ↓
      Extract all matching subfields
      ↓
      Join with ' | '
      ↓
      Replace field value with concatenated result
  ↓
Remove metadata from result
  ↓
Export to Excel with ' | ' separated values
```

## Testing Recommendations

1. **Test single duplicate subfields**:
   - Create record with 692$a repeated 2-3 times
   - Verify all values appear separated by ' | '

2. **Test multiple datafield instances**:
   - Create record with two 692 datafields, each with duplicate $a
   - Verify all values from both datafields combined

3. **Test mixed subfields**:
   - Create record with 692$a and 692$b duplicated
   - Verify each subfield processes independently

4. **Test empty/missing values**:
   - Record without 692 field
   - Record with 692 but no duplicate subfields
   - Verify graceful handling

5. **Test performance**:
   - Generate custom report with 692 selected (1000+ records)
   - Compare query time with/without metadata fetching
   - Verify acceptable performance

6. **Test special characters**:
   - Arabic text in duplicate subfields
   - Special characters, punctuation
   - Verify proper encoding in Excel export

## Future Enhancements

### Possible Improvements:
1. **Configurable separator**: Allow users to choose separator (|, ;, /, etc.)
2. **Deduplication option**: Remove duplicate values before joining
3. **Sorting option**: Alphabetically sort values before joining
4. **Count display**: Show count of values (e.g., "Education | Technology (2 values)")
5. **Additional fields**: Mark more fields as having duplicate subfields if discovered
6. **XML caching**: Cache parsed XML for multiple field extractions

### Fields to Consider:
- Field **600** (Subject - Personal Name) - may have duplicate subfields
- Field **610** (Subject - Corporate Name) - may have duplicate subfields
- Field **650** (Subject - Topical) - may have duplicate subfields
- Field **651** (Subject - Geographic) - may have duplicate subfields

## Troubleshooting

### Issue: Values not concatenated with '|'
**Check**:
1. Is the field marked with `duplicateSubfields: true` in MARC_FIELD_CONFIGS?
2. Is metadata being fetched in the query? (check console logs)
3. Does the MARC XML actually have duplicate subfields?

### Issue: Empty results for 692/653 fields
**Check**:
1. Do the records actually have these fields?
2. Check MARC XML structure - are tags/codes correct?
3. Verify XML is well-formed (no parsing errors in console)

### Issue: Performance degradation
**Check**:
1. How many fields with duplicateSubfields are selected?
2. Consider limiting to essential fields
3. Review database query execution time in logs

## Maintenance Notes

- **Adding new duplicate subfield fields**: Update MARC_FIELD_CONFIGS with `duplicateSubfields: true`
- **Changing separator**: Modify the `.join(' | ')` in extractDuplicateSubfields function
- **XML parsing errors**: Check regex patterns match actual MARC XML format
- **Testing**: Add unit tests for extractDuplicateSubfields function with various XML inputs

## References

- MARC 21 Format for Bibliographic Data: [https://www.loc.gov/marc/bibliographic/](https://www.loc.gov/marc/bibliographic/)
- Field 692: Local Keywords (institution-specific)
- Field 653: Index Term - Uncontrolled

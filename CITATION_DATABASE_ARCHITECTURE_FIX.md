# Citation Reports Database Architecture Fix

## 🚨 **Issue Identified**

The citation database has a different architecture than initially understood:

### **Previous Understanding (Incorrect):**
- Biblio = Individual citation record
- Biblioitems = Multiple versions of same citation
- Input biblionumbers = Direct citation matches

### **Correct Understanding:**
- **Biblio = Journal/Magazine** (e.g., biblionumber 1433060, 1433079)
- **Citations = Individual records within journals** (e.g., biblionumber 6458666, 6458719, etc.)
- **Relationship = Citations reference parent journals via MARC field 773**

## 📊 **Evidence from User's Data**

**Input:** 2 journal biblionumbers (1433060, 1433079)
**Output:** 142 individual citation records with different biblionumbers (6458666, 6458719, etc.)

This proves that:
1. Journals contain multiple citations
2. Citations have their own biblionumbers  
3. Citations reference parent journals through MARC relationships

## 🔧 **Fix Applied**

### **Before (Wrong Query Logic):**
```sql
SELECT * FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.biblionumber IN (1433060, 1433079)  -- Looking for direct matches
```
**Result:** No records (because 1433060, 1433079 are journals, not individual citations)

### **After (Correct Query Logic):**
```sql
SELECT * FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') IN ('1433060', '1433079')
-- Looking for citations that reference these journals
```
**Result:** 142 citation records that belong to those journals

## 📋 **Files Modified**

1. **Custom Citation Reports** (`/api/citation-reports/custom/route.ts`)
2. **Author Translation Reports** (`/api/citation-reports/author-translations/route.ts`)  
3. **Title Translation Reports** (`/api/citation-reports/title-translations/route.ts`)

All three APIs now use the correct relationship logic:
- **MARC field 773 subfield w** = Journal biblionumber reference
- **Query finds citations within specified journals**
- **Returns individual citation records with their own biblionumbers**

## 🎯 **Expected Results**

Now when you input journal biblionumbers `1433060, 1433079`:
1. **Performance:** Fast EXTRACTVALUE queries (seconds instead of minutes)
2. **Accuracy:** Returns all 142 citations within those journals
3. **Data:** Each citation has its own biblionumber, title (245), author (100), etc.

## 🧪 **Testing**

Your friend's query should now work correctly:
```sql
SELECT a.`biblionumber`, 
       EXTRACTVALUE(marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS title_245,
       EXTRACTVALUE(marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS title_242
FROM biblioitems a
INNER JOIN biblio b ON a.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') IN ('1433060', '1433079')
```

This matches the corrected logic now implemented in all citation report APIs.
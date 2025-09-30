-- Friend's Query Structure for Citation Reports
-- Input: Journal biblionumbers (1433060, 1433079)
-- Output: All individual citations within those journals

-- Based on the CSV data pattern, the correct query should be:

SELECT 
  a.`biblionumber`,
  EXTRACTVALUE(marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS title_245,
  EXTRACTVALUE(marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS title_242,
  EXTRACTVALUE(marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS author_100,
  EXTRACTVALUE(marcxml, '//datafield[@tag="700"]/subfield[@code="a"]') AS additional_author,
  EXTRACTVALUE(marcxml, '//datafield[@tag="260"]/subfield[@code="c"]') AS year,
  EXTRACTVALUE(marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') AS journal_title,
  a.url
FROM biblioitems a
INNER JOIN biblio b ON a.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND a.marcxml IS NOT NULL
  AND a.marcxml != ''
  -- The key filter: Find citations that belong to specific journals
  AND EXISTS (
    SELECT 1 
    FROM biblioitems parent_journal 
    WHERE parent_journal.biblionumber IN (1433060, 1433079)
      AND a.some_journal_reference_field = parent_journal.biblionumber
  )

-- Alternative approach if there's a direct journal relationship:
-- This might be through a field in marcxml or a direct reference

SELECT 
  a.`biblionumber`,
  EXTRACTVALUE(marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS title_245,
  EXTRACTVALUE(marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS title_242
FROM biblioitems a
INNER JOIN biblio b ON a.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND a.marcxml IS NOT NULL
  AND a.marcxml != ''
  -- Possible approaches to link citations to journals:
  -- Option 1: Through MARC field 773 (source/journal reference)
  AND EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') IN ('1433060', '1433079')
  
  -- Option 2: Through a parent-child relationship in biblioitems
  -- OR a.parent_biblionumber IN (1433060, 1433079)
  
  -- Option 3: Through URL pattern or other identifier
  -- OR a.url LIKE '1433060-%' OR a.url LIKE '1433079-%'

-- The exact field/relationship needs to be determined from your database structure
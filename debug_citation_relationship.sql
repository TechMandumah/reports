-- Debug query to understand the citation-journal relationship
-- Let's examine what MARC fields are available and how citations might reference journals

USE `koha_citation`;

-- 1. Check if journals 1433060, 1433079 exist in the database
SELECT 
    biblionumber, 
    frameworkcode, 
    author, 
    title, 
    copyrightdate,
    seriestitle
FROM biblio 
WHERE biblionumber IN (1433060, 1433079);

-- 2. Check if there are any biblioitems for these journal numbers
SELECT 
    bi.biblioitemnumber,
    bi.biblionumber,
    bi.url,
    SUBSTRING(bi.marcxml, 1, 500) as marcxml_sample
FROM biblioitems bi 
WHERE bi.biblionumber IN (1433060, 1433079)
LIMIT 5;

-- 3. Look for citations that might reference these journals in different MARC fields
-- Check common journal reference fields in MARC

-- Method 1: MARC 773 subfield w (what we tried)
SELECT COUNT(*) as count_773_w
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') IN ('1433060', '1433079');

-- Method 2: MARC 773 subfield x (ISSN reference)
SELECT COUNT(*) as count_773_x
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="x"]') IN ('1433060', '1433079');

-- Method 3: MARC 773 subfield o (other identifier)
SELECT COUNT(*) as count_773_o
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="o"]') IN ('1433060', '1433079');

-- Method 4: Check if it's in the URL pattern
SELECT COUNT(*) as count_url_pattern
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND (bi.url LIKE '1433060-%' OR bi.url LIKE '1433079-%');

-- Method 5: Check if it's in publishercode
SELECT COUNT(*) as count_publishercode
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND bi.publishercode IN ('1433060', '1433079');

-- 6. Sample some actual MARC XML to see the structure
SELECT 
    bi.biblionumber,
    bi.url,
    bi.publishercode,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') as marc_773_w,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="x"]') as marc_773_x,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="o"]') as marc_773_o,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') as marc_773_t,
    bi.marcxml
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND bi.marcxml IS NOT NULL
  AND bi.marcxml != ''
ORDER BY bi.biblionumber
LIMIT 10;

-- 7. Check if there are any citations with biblionumbers in the range we expect (6458666, etc.)
SELECT COUNT(*) as total_citations
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND b.biblionumber BETWEEN 6458000 AND 6500000;

-- 8. Sample some citations from the expected range
SELECT 
    bi.biblionumber,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') as title_245,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') as journal_ref_w,
    EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') as journal_title,
    bi.url,
    bi.publishercode
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.frameworkcode = 'CIT'
  AND b.biblionumber BETWEEN 6458000 AND 6460000
LIMIT 5;
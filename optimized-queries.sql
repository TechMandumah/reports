-- SQL Query Performance Analysis
-- This file demonstrates the optimized queries that should work well with the Koha database schema

-- 1. Optimized biblio number query (direct lookup using primary key)
-- This should be very fast as it uses the primary key index
SELECT 
  b.biblionumber,
  b.frameworkcode,
  b.author,
  b.title,
  b.medium,
  b.subtitle,
  b.part_number,
  b.part_name,
  b.unititle,
  b.notes,
  b.serial,
  b.seriestitle,
  b.copyrightdate,
  b.timestamp,
  b.datecreated,
  b.abstract,
  bi.url,
  bi.journalnum,
  bi.volumenumber,
  bi.issuenumber
FROM biblio b
LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
WHERE b.biblionumber IN (1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13)
ORDER BY b.biblionumber DESC;

-- 2. Index recommendations for better performance
-- The current schema has these indexes:
-- biblio: PRIMARY KEY (biblionumber) - GOOD
-- biblio_metadata: PRIMARY KEY (id), UNIQUE KEY uq_biblionumber (biblionumber), KEY idx_timestamp (timestamp) - GOOD
-- biblioitems: PRIMARY KEY (biblioitemnumber), KEY idx_biblionumber (biblionumber) - GOOD

-- Additional indexes that would help for common queries:
-- CREATE INDEX idx_biblio_copyrightdate ON biblio(copyrightdate);
-- CREATE INDEX idx_biblio_author ON biblio(author);
-- CREATE INDEX idx_biblioitems_journalnum ON biblioitems(journalnum);

-- 3. Test query for year range filtering (would benefit from copyrightdate index)
SELECT COUNT(*) 
FROM biblio b
LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
WHERE b.copyrightdate >= 1980 AND b.copyrightdate <= 2000;

-- 4. Test query for magazine filtering (would benefit from journalnum index)
SELECT COUNT(*)
FROM biblio b
LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
WHERE bi.journalnum IN (5, 2, 881);

-- 5. Test query for author filtering (would benefit from author index)
SELECT COUNT(*)
FROM biblio b
LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
WHERE b.author LIKE '%محمد%';

-- 6. Test abstract filtering (uses existing data)
SELECT COUNT(*)
FROM biblio b
LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
WHERE b.abstract IS NOT NULL AND b.abstract != '' AND TRIM(b.abstract) != '';

-- 7. MARC metadata query optimization (uses unique index)
SELECT biblionumber, metadata
FROM biblio_metadata
WHERE biblionumber IN (1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13);

-- Expected performance characteristics:
-- - Biblio number IN queries: Should be very fast (primary key lookup)
-- - Year range queries: Fast if copyrightdate is indexed
-- - Magazine number queries: Fast if journalnum is indexed  
-- - Author LIKE queries: Slower without index, much faster with index
-- - MARC metadata queries: Fast due to unique index on biblionumber
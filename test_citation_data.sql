-- Test data for citation reports performance testing
-- This will insert 100 biblioitems records with duplicate biblionumbers
-- Simulating real-world scenario where 10 biblios can have 100+ biblioitems

USE `koha_citation`;

-- First, let's add more biblio records to work with (using high biblionumbers to avoid conflicts)
INSERT INTO `biblio` (`biblionumber`, `frameworkcode`, `author`, `title`, `unititle`, `notes`, `serial`, `seriestitle`, `copyrightdate`, `timestamp`, `datecreated`, `abstract`) VALUES
(1001, 'CIT', 'أحمد، محمد علي', 'تطوير نظم إدارة التعلم الإلكتروني', NULL, NULL, NULL, 'مجلة تكنولوجيا التعليم', 2020, NOW(), CURDATE(), NULL),
(1002, 'CIT', 'فاطمة، عبد الرحمن', 'استراتيجيات التعليم الرقمي في الجامعات', NULL, NULL, NULL, 'مجلة التعليم العالي', 2019, NOW(), CURDATE(), NULL),
(1003, 'CIT', 'محمود، سالم إبراهيم', 'الذكاء الاصطناعي في التعليم', NULL, NULL, NULL, 'مجلة الحاسوب والتعليم', 2021, NOW(), CURDATE(), NULL),
(1004, 'CIT', 'عائشة، أحمد محمد', 'التقييم الإلكتروني وأدواته', NULL, NULL, NULL, 'مجلة القياس والتقويم', 2018, NOW(), CURDATE(), NULL),
(1005, 'CIT', 'عبد الله، خالد يوسف', 'منصات التعلم المدمج', NULL, NULL, NULL, 'مجلة التربية الحديثة', 2022, NOW(), CURDATE(), NULL);

-- Now insert 100 biblioitems with duplicates
-- Each biblio will have multiple items (versions, formats, etc.)

INSERT INTO `biblioitems` (`biblioitemnumber`, `biblionumber`, `volume`, `publishercode`, `volumedate`, `timestamp`, `illus`, `pages`, `notes`, `size`, `place`, `lccn`, `marc`, `url`, `marcxml`) VALUES

-- Biblio 3 - Multiple versions (10 items)
(100, 3, 'v1', '508183', '2012', NOW(), NULL, '64', NULL, NULL, NULL, NULL, '00520nam a22001577a 4500', '0005-012-393-100.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00520nam a22001577a 4500</leader>
  <controlfield tag="001">3</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="073" ind1=" " ind2=" "><subfield code="a">508183</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">المشرف، مضوي مختار</subfield><subfield code="9">AUTH001</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">أسس تصميم المقررات الإلكترونية بالمرحلة الثانوية</subfield></datafield>
  <datafield tag="242" ind1=" " ind2=" "><subfield code="a">Principles of Electronic Course Design at Secondary Level</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2012</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">64</subfield></datafield>
  <datafield tag="700" ind1=" " ind2=" "><subfield code="a">حسن، هالة إبراهيم</subfield><subfield code="9">AUTH002</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة جامعة الجزيرة</subfield><subfield code="v">9</subfield><subfield code="w">2</subfield></datafield>
</record>'),

(101, 3, 'v2', '508183', '2012', NOW(), NULL, '68', NULL, NULL, NULL, NULL, '00520nam a22001577a 4500', '0005-012-393-101.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00520nam a22001577a 4500</leader>
  <controlfield tag="001">3</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">المشرف، مضوي مختار</subfield><subfield code="9">AUTH001</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">أسس تصميم المقررات الإلكترونية بالمرحلة الثانوية - الطبعة المحدثة</subfield></datafield>
  <datafield tag="246" ind1=" " ind2=" "><subfield code="a">Updated Electronic Course Design Principles</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2012</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة جامعة الجزيرة</subfield><subfield code="v">9</subfield><subfield code="w">3</subfield></datafield>
</record>'),

(102, 3, 'v3', '508183', '2012', NOW(), NULL, '72', NULL, NULL, NULL, NULL, '00520nam a22001577a 4500', '0005-012-393-102.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00520nam a22001577a 4500</leader>
  <controlfield tag="001">3</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">المشرف، مضوي مختار</subfield><subfield code="9">AUTH001</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">أسس تصميم المقررات الإلكترونية بالمرحلة الثانوية - النسخة النهائية</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2012</subfield></datafield>
  <datafield tag="700" ind1=" " ind2=" "><subfield code="a">حسن، هالة إبراهيم</subfield><subfield code="9">AUTH002</subfield></datafield>
  <datafield tag="700" ind1=" " ind2=" "><subfield code="a">علي، أحمد محمود</subfield><subfield code="9">AUTH003</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة جامعة الجزيرة</subfield><subfield code="v">9</subfield><subfield code="w">4</subfield></datafield>
</record>'),

(103, 3, 'supplement', '508183', '2012', NOW(), NULL, '20', NULL, NULL, NULL, NULL, '00520nam a22001577a 4500', '0005-012-393-103.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00520nam a22001577a 4500</leader>
  <controlfield tag="001">3</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">المشرف، مضوي مختار</subfield><subfield code="9">AUTH001</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">ملحق: أسس تصميم المقررات الإلكترونية</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2012</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة جامعة الجزيرة</subfield><subfield code="v">9</subfield><subfield code="w">5</subfield></datafield>
</record>'),

(104, 3, 'appendix', '508183', '2012', NOW(), NULL, '15', NULL, NULL, NULL, NULL, '00520nam a22001577a 4500', '0005-012-393-104.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00520nam a22001577a 4500</leader>
  <controlfield tag="001">3</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">المشرف، مضوي مختار</subfield><subfield code="9">AUTH001</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">ملاحق تصميم المقررات الإلكترونية</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2012</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة جامعة الجزيرة - الملاحق</subfield><subfield code="v">9</subfield><subfield code="w">A1</subfield></datafield>
</record>'),

-- Biblio 4 - Multiple versions (8 items)
(105, 4, 'v1', '508183', '2011', NOW(), NULL, '45', NULL, NULL, NULL, NULL, '00501nam a22001457a 4500', '0005-012-393-105.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00501nam a22001457a 4500</leader>
  <controlfield tag="001">4</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">حسنين، مهدي سعيد محمود</subfield><subfield code="9">AUTH004</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">إتجاهات الدارسين المفتوح نحو توظيف تكنولوجيا التعليم في برامج التعليم المفتوح</subfield></datafield>
  <datafield tag="242" ind1=" " ind2=" "><subfield code="a">Students Attitudes Towards Educational Technology in Open Learning</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2011</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة كلية التربية بجامعة الخرطوم</subfield><subfield code="v">3</subfield><subfield code="w">5</subfield></datafield>
</record>'),

(106, 4, 'v2', '508183', '2011', NOW(), NULL, '48', NULL, NULL, NULL, NULL, '00501nam a22001457a 4500', '0005-012-393-106.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00501nam a22001457a 4500</leader>
  <controlfield tag="001">4</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">حسنين، مهدي سعيد محمود</subfield><subfield code="9">AUTH004</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">إتجاهات الدارسين المفتوح نحو توظيف تكنولوجيا التعليم - دراسة محدثة</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">2011</subfield></datafield>
  <datafield tag="700" ind1=" " ind2=" "><subfield code="a">أحمد، فاطمة علي</subfield><subfield code="9">AUTH005</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة كلية التربية بجامعة الخرطوم</subfield><subfield code="v">3</subfield><subfield code="w">6</subfield></datafield>
</record>'),

-- Continue with more biblios having multiple items...
-- Biblio 5 - Multiple versions (12 items)
(107, 5, 'part1', '617625', '1999', NOW(), NULL, '30', NULL, NULL, NULL, NULL, '00468nam a22001697a 4500', '0005-012-393-107.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00468nam a22001697a 4500</leader>
  <controlfield tag="001">5</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">حسن، عماد اسماعيل</subfield><subfield code="9">AUTH006</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">دور الجمعيات الأهلية في ظل سياسة الإصلاح الاقتصادي - الجزء الأول</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">1999</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة مستشفيات مركز البحوث والدراسات</subfield><subfield code="v">1</subfield><subfield code="w">1</subfield></datafield>
</record>'),

(108, 5, 'part2', '617625', '1999', NOW(), NULL, '35', NULL, NULL, NULL, NULL, '00468nam a22001697a 4500', '0005-012-393-108.pdf', '<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00468nam a22001697a 4500</leader>
  <controlfield tag="001">5</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">حسن، عماد اسماعيل</subfield><subfield code="9">AUTH006</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">دور الجمعيات الأهلية في ظل سياسة الإصلاح الاقتصادي - الجزء الثاني</subfield></datafield>
  <datafield tag="246" ind1=" " ind2=" "><subfield code="a">Role of NGOs in Economic Reform - Part Two</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">1999</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة مستشفيات مركز البحوث والدراسات</subfield><subfield code="v">1</subfield><subfield code="w">2</subfield></datafield>
</record>')
;

-- Insert remaining 85 records with various biblionumber distributions
-- Generate more realistic test data
INSERT INTO `biblioitems` (`biblioitemnumber`, `biblionumber`, `volume`, `publishercode`, `volumedate`, `timestamp`, `illus`, `pages`, `notes`, `size`, `place`, `lccn`, `marc`, `url`, `marcxml`) 
SELECT 
  109 + (t1.n + t2.n*10) as biblioitemnumber,
  CASE 
    WHEN MOD(t1.n + t2.n*10, 8) < 3 THEN 3 + MOD(t1.n + t2.n*10, 3)  -- Use existing biblios 3,4,5
    ELSE 1001 + MOD(t1.n + t2.n*10, 5)  -- Use new biblios 1001-1005
  END as biblionumber,
  CONCAT('v', 1 + MOD(t1.n + t2.n*10, 5)) as volume,
  CASE WHEN MOD(t1.n, 3) = 0 THEN '508183' WHEN MOD(t1.n, 3) = 1 THEN '617625' ELSE '633025' END as publishercode,
  CAST(2010 + MOD(t1.n + t2.n, 13) as CHAR) as volumedate,
  NOW() as timestamp,
  NULL as illus,
  CAST(20 + MOD(t1.n*3 + t2.n*7, 80) as CHAR) as pages,
  NULL as notes,
  NULL as size,
  NULL as place,
  NULL as lccn,
  '00468nam a22001697a 4500' as marc,
  CONCAT('0005-012-393-', LPAD(109 + (t1.n + t2.n*10), 3, '0'), '.pdf') as url,
  CONCAT('<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00468nam a22001697a 4500</leader>
  <controlfield tag="001">', 
    CASE 
      WHEN MOD(t1.n + t2.n*10, 8) < 3 THEN 3 + MOD(t1.n + t2.n*10, 3)
      ELSE 1001 + MOD(t1.n + t2.n*10, 5)
    END, '</controlfield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ara</subfield></datafield>
  <datafield tag="073" ind1=" " ind2=" "><subfield code="a">', 
    CASE WHEN MOD(t1.n, 3) = 0 THEN '508183' WHEN MOD(t1.n, 3) = 1 THEN '617625' ELSE '633025' END,
    '</subfield></datafield>
  <datafield tag="100" ind1=" " ind2=" "><subfield code="a">مؤلف تجريبي ', t1.n + t2.n*10, '</subfield><subfield code="9">AUTH', LPAD(t1.n + t2.n*10, 3, '0'), '</subfield></datafield>
  <datafield tag="245" ind1=" " ind2=" "><subfield code="a">عنوان تجريبي رقم ', t1.n + t2.n*10, ' - الإصدار ', 1 + MOD(t1.n + t2.n*10, 5), '</subfield></datafield>
  <datafield tag="242" ind1=" " ind2=" "><subfield code="a">Test Title Number ', t1.n + t2.n*10, ' - Version ', 1 + MOD(t1.n + t2.n*10, 5), '</subfield></datafield>
  <datafield tag="246" ind1=" " ind2=" "><subfield code="a">Alternative Test Title ', t1.n + t2.n*10, '</subfield></datafield>
  <datafield tag="260" ind1=" " ind2=" "><subfield code="c">', 2010 + MOD(t1.n + t2.n, 13), '</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">', 20 + MOD(t1.n*3 + t2.n*7, 80), '</subfield></datafield>
  <datafield tag="700" ind1=" " ind2=" "><subfield code="a">مؤلف مشارك ', t1.n, '</subfield><subfield code="9">CO_AUTH', LPAD(t1.n, 3, '0'), '</subfield></datafield>
  <datafield tag="773" ind1=" " ind2=" "><subfield code="s">مجلة تجريبية رقم ', MOD(t1.n + t2.n*10, 5) + 1, '</subfield><subfield code="v">', MOD(t1.n + t2.n*10, 20) + 1, '</subfield><subfield code="w">', MOD(t1.n*2 + t2.n*3, 10) + 1, '</subfield></datafield>
</record>') as marcxml
FROM 
  (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1
CROSS JOIN 
  (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) t2
LIMIT 85;

-- Verify the data
SELECT 
    biblionumber, 
    COUNT(*) as item_count,
    GROUP_CONCAT(DISTINCT volume ORDER BY volume) as volumes
FROM biblioitems 
WHERE biblioitemnumber >= 100
GROUP BY biblionumber 
ORDER BY biblionumber;

-- Show total counts
SELECT 
    'Total biblioitems' as description, 
    COUNT(*) as count 
FROM biblioitems 
WHERE biblioitemnumber >= 100
UNION ALL
SELECT 
    'Unique biblios with items' as description, 
    COUNT(DISTINCT biblionumber) as count 
FROM biblioitems 
WHERE biblioitemnumber >= 100;

-- Sample query similar to citation reports
SELECT 
    b.biblionumber,
    COUNT(bi.biblioitemnumber) as total_items,
    GROUP_CONCAT(DISTINCT EXTRACTVALUE(bi.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') ORDER BY bi.biblioitemnumber SEPARATOR ' | ') as all_titles
FROM biblioitems bi
INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
WHERE b.biblionumber IN (3,4,5,1001,1002,1003,1004,1005)
  AND b.frameworkcode = 'CIT'
  AND bi.marcxml IS NOT NULL
  AND bi.marcxml != ''
GROUP BY b.biblionumber
ORDER BY b.biblionumber;
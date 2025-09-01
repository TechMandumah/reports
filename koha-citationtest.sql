/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 5.7.24 : Database - koha_citation
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`koha_citation` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `koha_citation`;

/*Table structure for table `biblio` */

DROP TABLE IF EXISTS `biblio`;

CREATE TABLE `biblio` (
  `biblionumber` int(11) NOT NULL,
  `frameworkcode` varchar(10) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `unititle` varchar(255) DEFAULT NULL,
  `notes` text,
  `serial` varchar(100) DEFAULT NULL,
  `seriestitle` varchar(255) DEFAULT NULL,
  `copyrightdate` int(4) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `datecreated` date DEFAULT NULL,
  `abstract` text,
  PRIMARY KEY (`biblionumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `biblio` */

insert  into `biblio`(`biblionumber`,`frameworkcode`,`author`,`title`,`unititle`,`notes`,`serial`,`seriestitle`,`copyrightdate`,`timestamp`,`datecreated`,`abstract`) values 
(3,'CIT','المشرف، مغوري مختار','أسس تصميم المقررات الإلكترونية بالمرحلة الثانوية',NULL,NULL,NULL,'مجلة جامعة الجزيرة',2012,'2018-12-07 09:36:00','2017-09-24',NULL),
(4,'CIT','حسني، مهدي سعيد محمود','اتجاهات الدارسين بالفتح نحو توظيف تكنولوجيا التعليم في برامج التعليم المفتوح',NULL,NULL,NULL,'مجلة كلية التربية بجامعة الخرطوم',2011,'2018-12-07 09:36:00','2017-09-24',NULL),
(5,'CIT','حسن، عماد اسماعيل','دور الجمعيات الأهلية في ظل سياسة الإصلاح الاقتصادي',NULL,NULL,NULL,'مجلة مستشفيات مركز البحوث والدراسات بالجامعة المحالية',1999,'2018-12-07 09:36:00','2017-09-24',NULL),
(6,'CIT','رودت ربيع عبدالعظيم','جودة التعليم الإلكتروني',NULL,NULL,NULL,'مجلة التعليم الإلكتروني بجامعة المنصورة',2012,'2017-10-03 18:01:00','2017-09-24',NULL),
(7,'CIT','احمد مازن عبد الهادي','استخدام اللعب كوسيلة لمعالجة بعض أنواع صعوبات التعلم لدى الأطفال بعمر 9 سنوات',NULL,NULL,NULL,'مجلة علوم التربية الرياضية',2006,'2017-10-05 14:20:00','2017-09-24',NULL);

/*Table structure for table `biblioitems` */

DROP TABLE IF EXISTS `biblioitems`;

CREATE TABLE `biblioitems` (
  `biblioitemnumber` int(11) NOT NULL,
  `biblionumber` int(11) DEFAULT NULL,
  `volume` varchar(50) DEFAULT NULL,
  `publishercode` varchar(50) DEFAULT NULL,
  `volumedate` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `illus` varchar(50) DEFAULT NULL,
  `pages` varchar(50) DEFAULT NULL,
  `notes` text,
  `size` varchar(50) DEFAULT NULL,
  `place` varchar(50) DEFAULT NULL,
  `lccn` varchar(50) DEFAULT NULL,
  `marc` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `marcxml` longtext,
  PRIMARY KEY (`biblioitemnumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `biblioitems` */

insert  into `biblioitems`(`biblioitemnumber`,`biblionumber`,`volume`,`publishercode`,`volumedate`,`timestamp`,`illus`,`pages`,`notes`,`size`,`place`,`lccn`,`marc`,`url`,`marcxml`) values 
(3,3,NULL,'508183',NULL,'2018-12-07 13:06:00',NULL,'64',NULL,NULL,NULL,NULL,'00468nam a22001697a 450000100020000000200004100800200070370001000800039000100003900',NULL,'<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<record\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n    xsi:schemaLocation=\"http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd\"\r\n    xmlns=\"http://www.loc.gov/MARC21/slim\">\r\n\r\n  <leader>00386nam a22001457a 4500</leader>\r\n  <controlfield tag=\"001\">6</controlfield>\r\n  <datafield tag=\"041\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">ara</subfield>\r\n  </datafield>\r\n  <datafield tag=\"073\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">508183</subfield>\r\n  </datafield>\r\n  <datafield tag=\"100\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">رمود، ربيع عبدالعظيم</subfield>\r\n  </datafield>\r\n  <datafield tag=\"245\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">جودة التعلم الإلكتروني </subfield>\r\n  </datafield>\r\n  <datafield tag=\"260\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">2012</subfield>\r\n  </datafield>\r\n  <datafield tag=\"336\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Journal Article</subfield>\r\n  </datafield>\r\n  <datafield tag=\"773\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"s\">مجلة التعلم الالكتروني بجامعة المنصورة</subfield>\r\n  </datafield>\r\n  <datafield tag=\"995\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Citation</subfield>\r\n  </datafield>\r\n  <datafield tag=\"999\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">6</subfield>\r\n    <subfield code=\"d\">6</subfield>\r\n  </datafield>\r\n</record>\r\n'),
(4,4,NULL,'508183',NULL,'2018-12-07 13:06:00',NULL,NULL,NULL,NULL,NULL,NULL,'00510nam a22001457a 450000100020000000200004100800200070370001000800039000100004300',NULL,'<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<record\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n    xsi:schemaLocation=\"http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd\"\r\n    xmlns=\"http://www.loc.gov/MARC21/slim\">\r\n\r\n  <leader>00468nam a22001457a 4500</leader>\r\n  <controlfield tag=\"001\">7</controlfield>\r\n  <datafield tag=\"041\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">ara</subfield>\r\n  </datafield>\r\n  <datafield tag=\"073\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">633025</subfield>\r\n  </datafield>\r\n  <datafield tag=\"100\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">احمد، مازن عبدالهادى</subfield>\r\n  </datafield>\r\n  <datafield tag=\"245\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">استخدام اللعب كوسيلة لمعالجة بعض أنواع صعوبات التعلم لدى الأطفال بعمر 9 سنوات</subfield>\r\n  </datafield>\r\n  <datafield tag=\"260\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">2006</subfield>\r\n  </datafield>\r\n  <datafield tag=\"336\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Journal Article</subfield>\r\n  </datafield>\r\n  <datafield tag=\"773\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"s\">مجلة علوم التربية الرياضية</subfield>\r\n    <subfield code=\"v\">15</subfield>\r\n    <subfield code=\"w\">1</subfield>\r\n  </datafield>\r\n  <datafield tag=\"995\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Citation</subfield>\r\n  </datafield>\r\n  <datafield tag=\"999\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">7</subfield>\r\n    <subfield code=\"d\">7</subfield>\r\n  </datafield>\r\n</record>\r\n'),
(5,5,NULL,'617625',NULL,'2018-12-07 13:06:00',NULL,NULL,NULL,NULL,NULL,NULL,'00520nam a22001577a 450000100020000000200004100800200070370001000800039000100005000',NULL,'<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<record\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n    xsi:schemaLocation=\"http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd\"\r\n    xmlns=\"http://www.loc.gov/MARC21/slim\">\r\n\r\n  <leader>00468nam a22001697a 4500</leader>\r\n  <controlfield tag=\"001\">3</controlfield>\r\n  <datafield tag=\"041\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">ara</subfield>\r\n  </datafield>\r\n  <datafield tag=\"073\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">508183</subfield>\r\n  </datafield>\r\n  <datafield tag=\"100\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">المشرف، مضوي مختار</subfield>\r\n  </datafield>\r\n  <datafield tag=\"245\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">أسس تصميم المقررات الإلكترونية بالمرحلة الثانوية</subfield>\r\n  </datafield>\r\n  <datafield tag=\"260\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">2012</subfield>\r\n  </datafield>\r\n  <datafield tag=\"300\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">64</subfield>\r\n  </datafield>\r\n  <datafield tag=\"336\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Journal Article</subfield>\r\n  </datafield>\r\n  <datafield tag=\"700\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">حسن، هالة إبراهيم </subfield>\r\n  </datafield>\r\n  <datafield tag=\"773\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"s\">مجلة جامعة الجزيرة </subfield>\r\n    <subfield code=\"v\">9</subfield>\r\n    <subfield code=\"w\">2</subfield>\r\n  </datafield>\r\n  <datafield tag=\"995\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Citation</subfield>\r\n  </datafield>\r\n  <datafield tag=\"999\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">3</subfield>\r\n    <subfield code=\"d\">3</subfield>\r\n  </datafield>\r\n</record>\r\n'),
(6,6,NULL,'508183',NULL,'2018-12-07 13:06:00',NULL,NULL,NULL,NULL,NULL,NULL,'00368nam a22001457a 450000100020000000200004100800200070370001000800039000100004300',NULL,'<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<record\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n    xsi:schemaLocation=\"http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd\"\r\n    xmlns=\"http://www.loc.gov/MARC21/slim\">\r\n\r\n  <leader>00501nam a22001457a 4500</leader>\r\n  <controlfield tag=\"001\">4</controlfield>\r\n  <datafield tag=\"041\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">ara</subfield>\r\n  </datafield>\r\n  <datafield tag=\"073\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">508183</subfield>\r\n  </datafield>\r\n  <datafield tag=\"100\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">حسنين، مهدي سعيد محمود</subfield>\r\n  </datafield>\r\n  <datafield tag=\"245\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">إتجاهات الدارسين المفتوح نحو توظيف تكنولوجيا التعليم في برامج التعليم المفتوح</subfield>\r\n  </datafield>\r\n  <datafield tag=\"260\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">2011</subfield>\r\n  </datafield>\r\n  <datafield tag=\"336\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Journal Article</subfield>\r\n  </datafield>\r\n  <datafield tag=\"773\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"s\">مجلة كلية التربية بجامعة الخرطوم </subfield>\r\n    <subfield code=\"u\">السودان</subfield>\r\n    <subfield code=\"w\">5</subfield>\r\n    <subfield code=\"v\">3</subfield>\r\n  </datafield>\r\n  <datafield tag=\"995\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"a\">Citation</subfield>\r\n  </datafield>\r\n  <datafield tag=\"999\" ind1=\" \" ind2=\" \">\r\n    <subfield code=\"c\">4</subfield>\r\n    <subfield code=\"d\">4</subfield>\r\n  </datafield>\r\n</record>\r\n'),
(7,7,NULL,'633025',NULL,'2018-12-07 13:06:00',NULL,NULL,NULL,NULL,NULL,NULL,'00468nam a22001697a 450000100020000000200004100800200070370001000800039000100004300',NULL,'<?xml version=\"1.0\" encoding=\"UTF-8\"?>');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

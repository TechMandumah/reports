/*!40101 SET NAMES utf8 */;

create table `vtiger_account` (
	`accountid` int (19),
	`account_no` varchar (300),
	`accountname` varchar (750),
	`parentid` int (19),
	`account_type` varchar (600),
	`industry` varchar (600),
	`annualrevenue` Decimal (27),
	`rating` varchar (600),
	`ownership` varchar (150),
	`siccode` varchar (150),
	`tickersymbol` varchar (90),
	`phone` varchar (90),
	`otherphone` varchar (90),
	`email1` varchar (300),
	`email2` varchar (300),
	`website` varchar (300),
	`fax` varchar (90),
	`employees` varchar (30),
	`emailoptout` varchar (9),
	`notify_owner` varchar (9),
	`isconvertedfromlead` varchar (9)
); 
insert into `vtiger_account` (`accountid`, `account_no`, `accountname`, `parentid`, `account_type`, `industry`, `annualrevenue`, `rating`, `ownership`, `siccode`, `tickersymbol`, `phone`, `otherphone`, `email1`, `email2`, `website`, `fax`, `employees`, `emailoptout`, `notify_owner`, `isconvertedfromlead`) values('5384','ACC3727','التربية','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'0001','0','0',NULL);
insert into `vtiger_account` (`accountid`, `account_no`, `accountname`, `parentid`, `account_type`, `industry`, `annualrevenue`, `rating`, `ownership`, `siccode`, `tickersymbol`, `phone`, `otherphone`, `email1`, `email2`, `website`, `fax`, `employees`, `emailoptout`, `notify_owner`, `isconvertedfromlead`) values('5385','ACC3728','ثقافة الطفل','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'0002','0','0',NULL);
insert into `vtiger_account` (`accountid`, `account_no`, `accountname`, `parentid`, `account_type`, `industry`, `annualrevenue`, `rating`, `ownership`, `siccode`, `tickersymbol`, `phone`, `otherphone`, `email1`, `email2`, `website`, `fax`, `employees`, `emailoptout`, `notify_owner`, `isconvertedfromlead`) values('5386','ACC3729','مجلة كلية التربية','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'0003','0','0',NULL);
insert into `vtiger_account` (`accountid`, `account_no`, `accountname`, `parentid`, `account_type`, `industry`, `annualrevenue`, `rating`, `ownership`, `siccode`, `tickersymbol`, `phone`, `otherphone`, `email1`, `email2`, `website`, `fax`, `employees`, `emailoptout`, `notify_owner`, `isconvertedfromlead`) values('5387','ACC3730','الفكر التربوي العربي','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'0004','0','0',NULL);
insert into `vtiger_account` (`accountid`, `account_no`, `accountname`, `parentid`, `account_type`, `industry`, `annualrevenue`, `rating`, `ownership`, `siccode`, `tickersymbol`, `phone`, `otherphone`, `email1`, `email2`, `website`, `fax`, `employees`, `emailoptout`, `notify_owner`, `isconvertedfromlead`) values('5388','ACC3731','صحيفة التربية','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'0005','0','0',NULL);

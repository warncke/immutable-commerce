CREATE TABLE `account` (
  `accountId` binary(16) NOT NULL,
  `drupalUserId` int(10) unsigned NOT NULL,
  `accountCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`accountId`),
  UNIQUE KEY `drupalUserId` (`drupalUserId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
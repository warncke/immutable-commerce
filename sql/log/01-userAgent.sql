CREATE TABLE `userAgent` (
  `userAgentId` binary(16) NOT NULL,
  `userAgentName` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`userAgentId`),
  KEY `userAgentName` (`userAgentName`(256))
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

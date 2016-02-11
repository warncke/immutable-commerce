CREATE TABLE `session` (
  `sessionId` binary(16) NOT NULL,
  `originalSessionId` binary(16) DEFAULT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `sessionCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`sessionId`),
  KEY `originalSessionId` (`originalSessionId`)
) ENGINE=MyISAM DEFAULT CHARSET=UTF8;

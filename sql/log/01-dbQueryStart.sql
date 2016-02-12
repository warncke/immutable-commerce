CREATE TABLE `dbQueryStart` (
  `dbQueryStartId` binary(16) NOT NULL,
  `requestId` binary(16) NOT NULL,
  `moduleCallId` binary(16) DEFAULT NULL,
  `dbConnectionId` binary(16) NOT NULL,
  `dbQueryId` binary(16) NOT NULL,
  `dbQueryParamsId` binary(16) DEFAULT NULL,
  `dbQueryOptionsId` binary(16) DEFAULT NULL,
  `dbQueryStartCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`dbQueryStartId`),
  KEY `requestId` (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `dbQuery` (
  `dbQueryId` binary(16) NOT NULL,
  `requestId` binary(16) DEFAULT NULL,
  `moduleCallId` binary(16) DEFAULT NULL,
  `dbConnectionId` binary(16) NOT NULL,
  `dbQueryStringId` binary(16) NOT NULL,
  `dbQueryParamsId` binary(16) DEFAULT NULL,
  `dbQueryOptionsId` binary(16) DEFAULT NULL,
  `dbQueryCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`dbQueryId`),
  KEY `requestId` (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

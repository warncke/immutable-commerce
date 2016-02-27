CREATE TABLE `dbResponse` (
  `dbQueryId` binary(16) NOT NULL,
  `dbResponseId` binary(16) DEFAULT NULL,
  `dbResponseCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`dbQueryId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


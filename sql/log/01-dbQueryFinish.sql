CREATE TABLE `dbQueryFinish` (
  `dbQueryStartId` binary(16) NOT NULL,
  `dbQueryResponseId` binary(16) DEFAULT NULL,
  `dbQueryFinishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`dbQueryStartId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


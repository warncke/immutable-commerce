CREATE TABLE `dbConnection` (
  `dbConnectionId` binary(16) NOT NULL,
  `instanceId` binary(16) NOT NULL,
  `dbConnectionParamsId` binary(16) NOT NULL,
  `dbConnectionName` varchar(255) NOT NULL,
  `dbConnectionNum` int(10) unsigned NOT NULL,
  `dbConnectionCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`dbConnectionId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

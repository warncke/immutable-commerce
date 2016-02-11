CREATE TABLE `instance` (
  `instanceId` binary(16) NOT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `port` varchar(255) DEFAULT NULL,
  `version` varchar(255) DEFAULT NULL,
  `instanceCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`instanceId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

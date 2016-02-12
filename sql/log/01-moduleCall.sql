CREATE TABLE `moduleCall` (
  `moduleCallId` binary(16) NOT NULL,
  `argsId` binary(16),
  `requestId` binary(16) NOT NULL,
  `stackId` binary(16),
  `callNumber` int(10) unsigned DEFAULT NULL,
  `functionName` varchar(255) DEFAULT NULL,
  `moduleName` varchar(255) DEFAULT NULL,
  `moduleCallCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`moduleCallId`),
  KEY `requestId` (`requestId`),
  KEY `moduleName` (`moduleName`),
  KEY `functionName` (`functionName`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

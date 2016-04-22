CREATE TABLE `moduleCall` (
  `moduleCallId` binary(16) NOT NULL,
  `argsId` binary(16),
  `requestId` binary(16) DEFAULT NULL,
  `stackId` binary(16),
  `functionName` varchar(255) DEFAULT NULL,
  `moduleName` varchar(255) DEFAULT NULL,
  `moduleCallCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`moduleCallId`),
  KEY `requestId` (`requestId`),
  KEY `moduleName` (`moduleName`),
  KEY `functionName` (`functionName`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

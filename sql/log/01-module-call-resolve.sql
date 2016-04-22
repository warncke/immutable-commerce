CREATE TABLE `moduleCallResolve` (
  `moduleCallId` binary(16) NOT NULL,
  `moduleCallResolveDataId` binary(16) DEFAULT NULL,
  `resolved` tinyint(1) NOT NULL,
  `moduleCallResolveCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`moduleCallId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

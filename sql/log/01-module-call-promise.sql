CREATE TABLE `moduleCallPromise` (
  `moduleCallId` binary(16) NOT NULL,
  `promiseDataId` binary(16) DEFAULT NULL,
  `resolved` tinyint(1) NOT NULL,
  `moduleCallPromiseCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`moduleCallId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

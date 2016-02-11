CREATE TABLE `moduleCallReturn` (
  `moduleCallId` binary(16) NOT NULL,
  `returnDataId` binary(16) DEFAULT NULL,
  `moduleCallReturnCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`moduleCallId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

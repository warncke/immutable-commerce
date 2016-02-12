CREATE TABLE `responseFinish` (
  `requestId` binary(16) NOT NULL,
  `responseFinishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

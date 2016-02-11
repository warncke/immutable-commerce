CREATE TABLE `responseStart` (
  `requestId` binary(16) NOT NULL,
  `bodyId` binary(16) NOT NULL,
  `headerId` binary(16) NOT NULL,
  `contentLength` int(10) unsigned DEFAULT NULL,
  `statusCode` char(3) DEFAULT NULL,
  `responseStartCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

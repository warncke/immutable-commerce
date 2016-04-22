CREATE TABLE `responseStart` (
  `requestId` binary(16) NOT NULL,
  `responseBodyId` binary(16),
  `responseHeaderId` binary(16),
  `contentLength` int(10) unsigned DEFAULT NULL,
  `statusCode` char(3) DEFAULT NULL,
  `responseStartCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

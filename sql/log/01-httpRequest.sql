CREATE TABLE `httpRequest` (
  `httpRequestId` binary(16) NOT NULL,
  `httpRequestOptionsId` binary(16) NOT NULL,
  `requestId` binary(16) DEFAULT NULL,
  `moduleCallId` binary(16) DEFAULT NULL,
  `httpRequestMethod` varchar(16) DEFAULT NULL,
  `httpRequestUrl` varchar(4096) DEFAULT NULL,
  `httpRequestCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`httpRequestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

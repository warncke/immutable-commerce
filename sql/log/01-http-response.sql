CREATE TABLE `httpResponse` (
  `httpRequestId` binary(16) NOT NULL,
  `httpResponseBodyId` binary(16) DEFAULT NULL,
  `httpResponseHeaderId` binary(16) DEFAULT NULL,
  `httpResponseStatusCode` char(3) DEFAULT NULL,
  `httpResponseCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`httpRequestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

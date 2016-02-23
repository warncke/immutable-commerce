CREATE TABLE `httpRequestError` (
  `httpRequestId` binary(16) NOT NULL,
  `httpRequestErrorId` binary(16) DEFAULT NULL,
  `httpRequestErrorCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`httpRequestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

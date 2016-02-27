CREATE TABLE `productDelete` (
  `productId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productDeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

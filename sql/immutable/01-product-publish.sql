CREATE TABLE `productPublish` (
  `productId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productPublishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

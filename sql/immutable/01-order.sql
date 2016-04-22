CREATE TABLE `order` (
  `orderId` binary(16) NOT NULL,
  `originalOrderId` binary(16) NOT NULL,
  `parentOrderId` binary(16) DEFAULT NULL,
  `partialOrderId` binary(4) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `cartId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `orderCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`orderId`),
  UNIQUE KEY `cartId` (`cartId`),
  UNIQUE KEY `parentOrderId` (`parentOrderId`),
  UNIQUE KEY `accountId` (`accountId`,`partialOrderId`),
  KEY `originalOrderId` (`originalOrderId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

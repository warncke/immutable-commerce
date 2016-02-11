CREATE TABLE `order` (
  `orderId` binary(16) NOT NULL,
  `originalOrderId` binary(16),
  `accountId` binary(16) NOT NULL,
  `cartId` binary(16) NOT NULL,
  `orderCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`orderId`),
  KEY `originalOrderId` (`originalOrderId`),
  UNIQUE KEY `cartId` (`cartId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

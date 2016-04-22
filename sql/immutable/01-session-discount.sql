CREATE TABLE `sessionDiscount` (
  `discountId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `sessionDiscountCreateTime` datetime(6) NOT NULL,
  KEY `discountId` (`discountId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

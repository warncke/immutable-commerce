CREATE TABLE `discount` (
  `discountId` binary(16) NOT NULL,
  `originalDiscountId` binary(16) NOT NULL,
  `parentDiscountId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `discountCode` varchar(255) DEFAULT NULL,
  `discountType` varchar(255) NOT NULL,
  `discountData` mediumtext NOT NULL,
  `discountStartTime` datetime(6) DEFAULT NULL,
  `discountEndTime` datetime(6) DEFAULT NULL,
  `discountCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`discountId`),
  UNIQUE KEY `parentDiscountId` (`parentDiscountId`),
  UNIQUE KEY `discountCode` (`discountCode`,`parentDiscountId`),
  KEY `originalDiscountId` (`originalDiscountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

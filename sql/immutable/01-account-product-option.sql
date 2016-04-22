CREATE TABLE `accountProductOption` (
  `accountId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `optionName` varchar(255) DEFAULT NULL,
  `optionValue` varchar(255) DEFAULT NULL,
  `accountProductOptionCreateTime` datetime(6) NOT NULL,
  KEY `accountId` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

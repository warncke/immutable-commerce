CREATE TABLE `cartProductOption` (
  `cartId` binary(16) NOT NULL,
  `cartProductId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `optionName` varchar(255) DEFAULT NULL,
  `optionValue` varchar(255) DEFAULT NULL,
  `cartProductOptionCreateTime` datetime(6) NOT NULL,
  KEY `cartId` (`cartId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

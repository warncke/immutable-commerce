CREATE TABLE `product` (
  `productId` binary(16) NOT NULL,
  `productDataId` binary(16) NOT NULL,
  `originalProductId` binary(16),
  `productData` mediumtext NOT NULL,
  `productCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productId`),
  INDEX (`productDataId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

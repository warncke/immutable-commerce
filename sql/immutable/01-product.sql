CREATE TABLE `product` (
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `parentProductId` binary(16) DEFAULT NULL,
  `productDataId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `productData` mediumtext,
  `productCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `parentProductId` (`parentProductId`),
  KEY `originalProductId` (`originalProductId`),
  KEY `productDataId` (`productDataId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

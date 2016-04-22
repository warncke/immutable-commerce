CREATE TABLE `product` (
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `parentProductId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `productData` mediumtext NOT NULL,
  `productCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `parentProductId` (`parentProductId`),
  KEY `originalProductId` (`originalProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

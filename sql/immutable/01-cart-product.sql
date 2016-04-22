CREATE TABLE `cartProduct` (
  `cartProductId` binary(16) NOT NULL,
  `originalCartProductId` binary(16) NOT NULL,
  `parentCartProductId` binary(16) DEFAULT NULL,
  `cartId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `quantity` int(11) NOT NULL,
  `cartProductCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`cartProductId`),
  UNIQUE KEY `parentCartProductId` (`parentCartProductId`),
  KEY `originalCartProductId` (`originalCartProductId`),
  KEY `cartId` (`cartId`),
  KEY `productId` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

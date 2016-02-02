CREATE TABLE `cartProduct` (
  `cartId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `quantity` int(11) NOT NULL,
  `cartProductCreateTime` datetime(6) NOT NULL,
  KEY `cartId` (`cartId`),
  KEY `productId` (`productId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
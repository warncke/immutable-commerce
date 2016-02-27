CREATE TABLE `cart` (
  `cartId` binary(16) NOT NULL,
  `originalCartId` binary(16) NOT NULL,
  `parentCartId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `cartCreateTime` datetime(6) NOT NULL,
  `cartData` varchar(16384) NOT NULL,
  PRIMARY KEY (`cartId`),
  UNIQUE KEY `parentCartId` (`parentCartId`),
  KEY `originalCartId` (`originalCartId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

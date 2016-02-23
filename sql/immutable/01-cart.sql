CREATE TABLE `cart` (
  `cartId` binary(16) NOT NULL,
  `originalCartId` binary(16) DEFAULT NULL,
  `parentCartId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `cartCreateTime` datetime(6) NOT NULL,
  `cartData` VARCHAR(16384) NOT NULL,
  PRIMARY KEY (`cartId`),
  KEY `originalCartId` (`originalCartId`),
  UNIQUE KEY `parentCartId` (`parentCartId`),
  KEY `sessionID` (`sessionId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

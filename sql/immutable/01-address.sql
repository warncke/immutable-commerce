CREATE TABLE `address` (
  `addressId` binary(16) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `addressData` mediumtext NOT NULL,
  `addressType` varchar(255) DEFAULT NULL,
  `addressCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`addressId`),
  KEY `accountId` (`accountId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

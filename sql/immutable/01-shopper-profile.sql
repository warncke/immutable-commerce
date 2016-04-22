CREATE TABLE `shopperProfile` (
  `shopperProfileId` binary(16) NOT NULL,
  `originalShopperProfileId` binary(16) NOT NULL,
  `parentShopperProfileId` binary(16) DEFAULT NULL,
  `frUid` varchar(63) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `data` mediumtext NOT NULL,
  `shopperProfileCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`shopperProfileId`),
  UNIQUE KEY `parentShopperProfileId` (`parentShopperProfileId`),
  KEY `originalShopperProfileId` (`originalShopperProfileId`),
  KEY `frUid` (`frUid`, `shopperProfileCreateTime`),
  KEY `sessionId` (`sessionId`, `shopperProfileCreateTime`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

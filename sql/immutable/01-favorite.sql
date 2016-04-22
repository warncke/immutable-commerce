CREATE TABLE `favorite` (
  `accountId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `toggle` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `favoriteCreateTime` datetime(6) NOT NULL,
  KEY `accountId` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

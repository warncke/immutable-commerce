CREATE TABLE `paymentMethod` (
  `paymentMethodId` binary(16) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) NOT NULL,
  `default` tinyint(1) NOT NULL,
  `store` tinyint(1) NOT NULL,
  `paymentMethodData` mediumtext NOT NULL,
  `paymentMethodCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`paymentMethodId`),
  KEY `accountId` (`accountId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

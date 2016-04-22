CREATE TABLE `paymentMethodTransaction` (
  `paymentMethodTransactionId` binary(16) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `orderId` binary(16) NOT NULL,
  `paymentMethodId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `paymentMethodTransactionAmount` decimal(27,9) NOT NULL,
  `paymentMethodTransactionData` mediumtext NOT NULL,
  `paymentMethodTransactionType` varchar(255) NOT NULL,
  `paymentMethodTransactionCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`paymentMethodTransactionId`),
  KEY `paymentMethodId` (`paymentMethodId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

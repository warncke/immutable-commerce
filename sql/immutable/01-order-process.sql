CREATE TABLE `orderProcess` (
  `orderProcessId` binary(16) NOT NULL,
  `orderId` binary(16) NOT NULL,
  `orderProcessAttempt` bigint(20) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `orderProcessCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`orderProcessId`),
  UNIQUE KEY `orderId` (`orderId`,`orderProcessAttempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

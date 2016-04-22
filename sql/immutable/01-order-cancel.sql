CREATE TABLE `orderCancel` (
  `orderCancelId` binary(16) NOT NULL,
  `orderId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `orderCancelCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`orderCancelId`),
  KEY `orderId` (`orderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `paymentMethodDelete` (
  `paymentMethodId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `paymentMethodDeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`paymentMethodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

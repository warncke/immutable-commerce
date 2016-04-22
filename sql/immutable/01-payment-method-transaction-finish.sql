CREATE TABLE `paymentMethodTransactionFinish` (
  `paymentMethodTransactionId` binary(16) NOT NULL,
  `paymentMethodTransactionSuccess` tinyint(1) NOT NULL,
  `paymentMethodTransactionFinishData` mediumtext NOT NULL,
  `paymentMethodTransactionFinishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`paymentMethodTransactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

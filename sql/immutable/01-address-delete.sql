CREATE TABLE `addressDelete` (
  `addressId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `addressDeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`addressId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

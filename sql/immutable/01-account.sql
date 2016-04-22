CREATE TABLE `account` (
  `accountId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `frUid` varchar(63) DEFAULT NULL,
  `accountCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

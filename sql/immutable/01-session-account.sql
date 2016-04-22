CREATE TABLE `sessionAccount` (
  `sessionId` binary(16) NOT NULL,
  `accountId` binary(16) NOT NULL,
  `sessionAccountCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`sessionId`),
  KEY `accountId` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO sessionAccount VALUES(
    '1111111111111111',
    '1111111111111111',
    '2000-01-01'
);

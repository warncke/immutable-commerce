CREATE TABLE `session` (
  `sessionId` binary(16) NOT NULL,
  `token` binary(16) NOT NULL,
  `sessionCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8;

INSERT INTO session VALUES(
    '1111111111111111',
    '1111111111111111',
    '2000-01-01'
);

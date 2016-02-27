CREATE TABLE `session` (
  `sessionId` binary(16) NOT NULL,
  `originalSessionId` binary(16) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `sessionCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`sessionId`),
  KEY `originalSessionId` (`originalSessionId`)
) ENGINE=MyISAM DEFAULT CHARSET=UTF8;

INSERT INTO session VALUES(
    '1111111111111111',
    '1111111111111111',
    '1111111111111111',
    '0.0.0.0',
    '2000-01-01'
);

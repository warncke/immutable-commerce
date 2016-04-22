CREATE TABLE `resourceDelete` (
  `resourceDeleteId` binary(16) NOT NULL,
  `resourceId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `resourceDeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`resourceDeleteId`),
  KEY `resourceId` (`resourceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

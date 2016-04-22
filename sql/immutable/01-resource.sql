CREATE TABLE `resource` (
  `resourceId` binary(16) NOT NULL,
  `ownerId` binary(16) NOT NULL,
  `resourceCreateTime` datetime(6) NOT NULL,
  `resourceName` varchar(255) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  PRIMARY KEY (`resourceId`),
  KEY `ownerId` (`ownerId`,`resourceName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

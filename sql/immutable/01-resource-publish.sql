CREATE TABLE `resourcePublish` (
  `resourcePublishId` binary(16) NOT NULL,
  `resourceId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `resourcePublishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`resourcePublishId`),
  KEY `resourceId` (`resourceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

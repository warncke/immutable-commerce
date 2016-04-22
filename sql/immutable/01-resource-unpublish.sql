CREATE TABLE `resourceUnpublish` (
  `resourcePublishId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `resourceUnpublishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`resourcePublishId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

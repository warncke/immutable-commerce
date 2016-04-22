CREATE TABLE `resourceUndelete` (
  `resourceDeleteId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `resourceUndeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`resourceDeleteId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

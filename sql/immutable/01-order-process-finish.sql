CREATE TABLE `orderProcessFinish` (
  `orderProcessId` binary(16) NOT NULL,
  `orderProcessSuccess` tinyint(1) NOT NULL,
  `orderProcessFinishData` mediumtext NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `orderProcessFinishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`orderProcessId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `error` (
  `errorId` binary(16) NOT NULL,
  `errorStackId` binary(16) DEFAULT NULL,
  `errorMessage` varchar(4096) DEFAULT NULL,
  `errorCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`errorId`),
  KEY `errorStackId` (`errorStackId`),
  KEY `errorCreateTime` (`errorCreateTime`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

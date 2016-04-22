CREATE TABLE `auth` (
  `authId` binary(16) NOT NULL,
  `originalAuthId` binary(16) NOT NULL,
  `parentAuthId` binary(16) DEFAULT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `authProviderName` varchar(128) NOT NULL,
  `authProviderAccountId` varchar(128) NOT NULL,
  `authProviderData` mediumtext NOT NULL,
  `authCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`authId`),
  UNIQUE KEY `parentAuthId` (`parentAuthId`),
  KEY `authProviderAccount` (`authProviderName`,`authProviderAccountId`),
  KEY `originalAuthId` (`originalAuthId`),
  KEY `accountId` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

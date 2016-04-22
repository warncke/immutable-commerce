CREATE TABLE `sessionProductOption` (
  `sessionId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `originalProductId` binary(16) NOT NULL,
  `optionName` varchar(255) DEFAULT NULL,
  `optionValue` varchar(255) DEFAULT NULL,
  `sessionProductOptionCreateTime` datetime(6) NOT NULL,
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

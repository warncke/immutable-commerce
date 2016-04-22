CREATE TABLE `productOfferPublish` (
  `productOfferId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productOfferPublishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productOfferId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `productOfferPublish` (
  `productOfferId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productOfferPublishCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productOfferId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

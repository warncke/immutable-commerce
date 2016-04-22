CREATE TABLE `productOfferDelete` (
  `productOfferId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productOfferDeleteCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productOfferId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `productOffer` (
  `productOfferId` binary(16) NOT NULL,
  `originalProductOfferId` binary(16) NOT NULL,
  `parentProductOfferId` binary(16) NOT NULL,
  `productId` binary(16) NOT NULL,
  `productOfferGroupId` binary(16) NOT NULL,
  `sessionId` binary(16) NOT NULL,
  `productOfferPrice` decimal(16,2) DEFAULT NULL,
  `productOfferCurrency` char(3) DEFAULT NULL,
  `productOfferCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`productOfferId`),
  UNIQUE KEY `parentProductOfferId` (`parentProductOfferId`),
  KEY `productId` (`productId`,`productOfferGroupId`),
  KEY `originalProductOfferId` (`originalProductOfferId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `request` (
  `requestId` binary(16) NOT NULL,
  `accountId` binary(16) DEFAULT NULL,
  `bodyId` binary(16) DEFAULT NULL,
  `cookieId` binary(16) DEFAULT NULL,
  `headerId` binary(16) DEFAULT NULL,
  `instanceId` binary(16) DEFAULT NULL,
  `queryId` binary(16) DEFAULT NULL,
  `sessionId` binary(16) DEFAULT NULL,
  `userAgentId` binary(16) DEFAULT NULL,
  `host` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `method` varchar(16) DEFAULT NULL,
  `url` varchar(4096) DEFAULT NULL,
  `requestCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`requestId`),
  KEY `requestCreateTime` (`requestCreateTime`),
  KEY `accountId` (`accountId`),
  KEY `instanceId` (`instanceId`),
  KEY `sessionId` (`sessionId`),
  KEY `ipAddress` (`ipAddress`),
  KEY `url` (`url`(333))
) ENGINE=MyISAM DEFAULT CHARSET=utf8

CREATE VIEW request_hex AS SELECT
  HEX(requestId) AS requestId,
  HEX(accountId) AS accountId,
  HEX(bodyId) AS bodyId,
  HEX(cookieId) AS cookieId,
  HEX(headerId) AS headerId,
  HEX(instanceId) AS instanceId,
  HEX(queryId) AS queryId,
  HEX(sessionId) AS sessionId,
  HEX(userAgentId) AS userAgentId,
  host,
  ipAddress,
  method,
  url,
  requestCreateTime
FROM request;

CREATE TABLE `data` (
  `dataId` binary(16) NOT NULL,
  `data` text,
  PRIMARY KEY (`dataId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE OR REPLACE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `data_hex` AS
select hex(`data`.`dataId`) AS `dataId`,
`data`.`data` AS `data`
from `data`;

CREATE TABLE `addressValidate` (
  `addressId` binary(16) NOT NULL,
  `addressValidated` tinyint(1) NOT NULL,
  `addressValidateData` mediumtext NOT NULL,
  `addressValidateCreateTime` datetime(6) NOT NULL,
  PRIMARY KEY (`addressId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

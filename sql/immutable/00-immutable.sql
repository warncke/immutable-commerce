DROP DATABASE IF EXISTS immutable;
CREATE DATABASE immutable;
GRANT INSERT, SELECT ON immutable.* TO 'immutable'@'localhost' IDENTIFIED BY 'immutable';
GRANT SELECT ON immutable.* TO 'eng'@'localhost' IDENTIFIED BY 'immutable';
USE immutable;

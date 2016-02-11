DROP DATABASE IF EXISTS log;
CREATE DATABASE log;
GRANT INSERT ON log.* TO 'immutable'@'localhost' IDENTIFIED BY 'immutable';
GRANT SELECT ON log.* TO 'eng'@'localhost' IDENTIFIED BY 'immutable';
USE log;

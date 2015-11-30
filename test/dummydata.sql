USE ebdb;
INSERT INTO 
	accounts (userUuid, oauth, permis)
	VALUES
		('uuuid1', 'ljanssen@stanford.edu', '1');

INSERT INTO 
	experiments (expUuid, succUuid, numVar, descr, name, userUuid, prop) 
	VALUES
		('euuid1','suuid1', '2', 'testdescr1','testname1','uuuid1','20'),
		('euuid2','suuid2', '3', 'testdescr2','testname2','uuuid1','10');

INSERT INTO 
	successfns (succUuid, userUuid, fn, argstr1, argstr2) 
	VALUES
		('euuid1', '2', 'testdescr1','testname1','uuuid1','20'),
		('euuid2', '3', 'testdescr2','testname2','uuuid1','10');		

CREATE TABLE IF NOT EXISTS 
	euuid1.variations (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		variationUuid VARCHAR(255) NOT NULL, 
		name VARCHAR(50) NOT NULL DEFAULT 'Untitled', 
		expUuid VARCHAR(255) NOT NULL, 
		js MEDIUMBLOB, 
		css MEDIUMBLOB, 
		html MEDIUMBLOB,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_variationUuid ( variationUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS 
	euuid2.variations (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		variationUuid VARCHAR(255) NOT NULL, 
		name VARCHAR(50) NOT NULL DEFAULT 'Untitled', 
		expUuid VARCHAR(255) NOT NULL, 
		js MEDIUMBLOB, 
		css MEDIUMBLOB, 
		html MEDIUMBLOB,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_variationUuid ( variationUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid1.intest (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL,   
		userUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid2.intest (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL,   
		userUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;	

CREATE TABLE IF NOT EXISTS
	euuid1.userdata (
		id INT NOT NULL AUTO_INCREMENT,
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL, 
		userUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL,
		succesReturn VARCHAR(255) DEFAULT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid2.userdata (
		id INT NOT NULL AUTO_INCREMENT,
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL, 
		userUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		successReturn VARCHAR(255) DEFAULT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=MyISAM DEFAULT CHARSET=utf8;	


INSERT INTO 
	euuid1.variations (variationUuid, name, expUuid, html)
	VALUES
		('vuuid1', 'A', 'euuid1','<a href="/"><img src="https://assets-cdn.github.com/images/modules/logos_page/Octocat.png" alt=""></a>'),
		('vuuid2', 'B', 'euuid1','<a href="/"><img src="http://svn.apache.org/repos/asf/subversion/trunk/notes/logo/256-colour/subversion_logo-384x332.png" alt=""></a>');

INSERT INTO 
	euuid2.variations (variationUuid, name, expUuid, html, css)
	VALUES
		('vuuid3', 'C', 'euuid2','<a href="/"><img src="https://lh3.googleusercontent.com/ZZPdzvlpK9r_Df9C3M7j1rNRi7hhHRvPhlklJ3lfi5jk86Jd1s0Y5wcQ1QgbVaAP5Q=w300" alt=""></a>', 'p{color:red;text-align:center;}'),
		('vuuid4', 'D', 'euuid2','<a href="/"><img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/3fe6027858667.55e61091bc63d.jpg" alt=""></a>', 'p{color:blue;text-align:left;}'),
		('vuuid5', 'E', 'euuid2','<a href="/"><img src="http://www.mullenloweus.com/wp-content/uploads//2013/10/instagramlogo.jpg" alt=""></a>', 'p{color:green;text-align:right;}');

INSERT INTO 
	euuid1.intest (testUuid, userUuid, variationUuid, expUuid)
	VALUES
		('tuuid1', 'uuuid1', 'vuuid1', 'euuid1'),
		('tuuid2', 'uuuid1', 'vuuid2', 'euuid1'),
		('tuuid3', 'uuuid1', 'vuuid1', 'euuid1'),
		('tuuid4', 'uuuid1', 'vuuid2', 'euuid1');		

INSERT INTO 
	euuid2.intest (testUuid, userUuid, variationUuid, expUuid)
	VALUES
		('tuuid5', 'uuuid1', 'vuuid3', 'euuid2'),
		('tuuid6', 'uuuid1', 'vuuid3', 'euuid2'),
		('tuuid7', 'uuuid1', 'vuuid5', 'euuid2');		

INSERT INTO 
	euuid1.userdata (testUuid, userUuid, variationUuid, expUuid, successReturn, miscFields)
	VALUES
		('tuuid8', 'uuuid1', 'vuuid1', 'euuid1'),
		('tuuid9', 'uuuid1', 'vuuid1', 'euuid1'),
		('tuuid10', 'uuuid1', 'vuuid2', 'euuid1'),
		('tuuid11', 'uuuid1', 'vuuid1', 'euuid1'),
		('tuuid12', 'uuuid1', 'vuuid2', 'euuid1'),
		('tuuid13', 'uuuid1', 'vuuid2', 'euuid1'),
		('tuuid14', 'uuuid1', 'vuuid2', 'euuid1'),
		('tuuid15', 'uuuid1', 'vuuid1', 'euuid1');

INSERT INTO 
	euuid2.userdata (testUuid, userUuid, variationUuid, expUuid, successReturn, miscFields)
	VALUES
		('tuuid16', 'uuuid1', 'vuuid1', 'euuid2'),
		('tuuid17', 'uuuid1', 'vuuid1', 'euuid2'),
		('tuuid18', 'uuuid1', 'vuuid2', 'euuid2'),
		('tuuid19', 'uuuid1', 'vuuid1', 'euuid2'),
		('tuuid20', 'uuuid1', 'vuuid2', 'euuid2');
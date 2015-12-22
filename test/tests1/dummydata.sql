USE ebdb;
INSERT INTO 
	accounts (userUuid, oauth, firstName, lastName, permis)
	VALUES
		('uuuid1', 'ljanssen@stanford.edu', 'loek', 'janssen', '1');

INSERT INTO 
	experiments (expUuid, succUuid, numVar, descr, name, userUuid, prop) 
	VALUES
		('euuid1','suuid1', '2', 'testdescr1','testname1','uuuid1','20'),
		('euuid2','suuid2', '3', 'testdescr2','testname2','uuuid1','10');

INSERT INTO 
	successfns (succUuid, userUuid, name, descr, fn, argstr1, argstr2) 
	VALUES
		('suuid1', 'uuuid1', 'testsucfn1','on sale > 500','js code1', '500','otherInput'),
		('suuid2', 'uuuid1', 'testsucfn2','on # reloads of homepage in session','js code2','4','otherInput');		

CREATE TABLE IF NOT EXISTS 
	euuid1_variations (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		variationUuid VARCHAR(255) NOT NULL, 
		name VARCHAR(50) NOT NULL DEFAULT 'Untitled', 
		expUuid VARCHAR(255) NOT NULL, 
		active BOOLEAN NOT NULL DEFAULT 0,
		js MEDIUMBLOB, 
		css MEDIUMBLOB, 
		html MEDIUMBLOB,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_variationUuid ( variationUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS 
	euuid2_variations (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		variationUuid VARCHAR(255) NOT NULL, 
		name VARCHAR(50) NOT NULL DEFAULT 'Untitled', 
		expUuid VARCHAR(255) NOT NULL, 
		active BOOLEAN NOT NULL DEFAULT 0,
		js MEDIUMBLOB, 
		css MEDIUMBLOB, 
		html MEDIUMBLOB,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_variationUuid ( variationUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid1_intest (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL,   
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid2_intest (
		id INT NOT NULL AUTO_INCREMENT, 
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL,   
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=InnoDB DEFAULT CHARSET=utf8;	

CREATE TABLE IF NOT EXISTS
	euuid1_userdata (
		id INT NOT NULL AUTO_INCREMENT,
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL,
		successReturn VARCHAR(255) DEFAULT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS
	euuid2_userdata (
		id INT NOT NULL AUTO_INCREMENT,
		addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
		testUuid VARCHAR(255) NOT NULL, 
		variationUuid VARCHAR(255) NOT NULL, 
		expUuid VARCHAR(255) NOT NULL, 
		successReturn VARCHAR(255) DEFAULT NULL, 
		miscFields MEDIUMBLOB DEFAULT NULL,
		PRIMARY KEY ( id ), 
		UNIQUE KEY unique_testUuid ( testUuid ) 
	)
	ENGINE=MyISAM DEFAULT CHARSET=utf8;	


INSERT INTO 
	euuid1_variations (variationUuid, name, expUuid, html)
	VALUES
		('vuuid1', 'A', 'euuid1','<a href="/"><img src="https://assets-cdn.github.com/images/modules/logos_page/Octocat.png" alt=""></a>'),
		('vuuid2', 'B', 'euuid1','<a href="/"><img src="http://svn.apache.org/repos/asf/subversion/trunk/notes/logo/256-colour/subversion_logo-384x332.png" alt=""></a>');

INSERT INTO 
	euuid2_variations (variationUuid, name, expUuid, html, css)
	VALUES
		('vuuid3', 'C', 'euuid2','<a href="/"><img src="https://lh3.googleusercontent.com/ZZPdzvlpK9r_Df9C3M7j1rNRi7hhHRvPhlklJ3lfi5jk86Jd1s0Y5wcQ1QgbVaAP5Q=w300" alt=""></a>', 'p{color:red;text-align:center;}'),
		('vuuid4', 'D', 'euuid2','<a href="/"><img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/3fe6027858667.55e61091bc63d.jpg" alt=""></a>', 'p{color:blue;text-align:left;}'),
		('vuuid5', 'E', 'euuid2','<a href="/"><img src="http://www.mullenloweus.com/wp-content/uploads//2013/10/instagramlogo.jpg" alt=""></a>', 'p{color:green;text-align:right;}');

INSERT INTO 
	euuid1_intest (testUuid, variationUuid, expUuid, miscFields)
	VALUES
		('tuuid1', 'vuuid1', 'euuid1', '{8,USA}'),
		('tuuid2', 'vuuid2', 'euuid1', '{89,NL}'),
		('tuuid3', 'vuuid1', 'euuid1', '{42,NL}'),
		('tuuid4', 'vuuid2', 'euuid1', '{72,NL}');		

INSERT INTO 
	euuid2_intest (testUuid, variationUuid, expUuid, miscFields)
	VALUES
		('tuuid5', 'vuuid3', 'euuid2', '{26000}'),
		('tuuid6', 'vuuid3', 'euuid2', '{11000}'),
		('tuuid7', 'vuuid5', 'euuid2', '{93000}');		

INSERT INTO 
	euuid1_userdata (testUuid, variationUuid, expUuid, successReturn, miscFields)
	VALUES
		('tuuid8', 'vuuid1', 'euuid1', '600', '{24,NL}'),
		('tuuid9', 'vuuid1', 'euuid1', '800', '{10,NL}'),
		('tuuid10', 'vuuid2', 'euuid1', '1200', '{53,USA}'),
		('tuuid11', 'vuuid1', 'euuid1', '700', '{23,NL}'),
		('tuuid12', 'vuuid2', 'euuid1', '700', '{21,USA}'),
		('tuuid13', 'vuuid2', 'euuid1', '1000', '{15,NL}'),
		('tuuid14', 'vuuid2', 'euuid1', '900', '{29,USA}'),
		('tuuid15', 'vuuid1', 'euuid1', '600', '{34,NL}');

INSERT INTO 
	euuid2_userdata (testUuid, variationUuid, expUuid, successReturn, miscFields)
	VALUES
		('tuuid16', 'vuuid1', 'euuid2', '2', '{13000}'),
		('tuuid17', 'vuuid1', 'euuid2', '5', '{34000}'),
		('tuuid18', 'vuuid2', 'euuid2', '4', '{32000}'),
		('tuuid19', 'vuuid1', 'euuid2', '1', '{50000}'),
		('tuuid20', 'vuuid2', 'euuid2', '8', '{23000}');
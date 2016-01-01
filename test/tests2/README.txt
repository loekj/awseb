Testing goes as follows by running test_run.js:

1. it sets up database tables if not exists
2. populates accounts with 1 user with userUuid cdc7b5e9_1556_4539_b62c_65b0c81510f3
3. shoots requests to experiments endpoints
	a. first request creates new one
	b. second creates new one
	c. third alters first one
4. shoots request to variation
5. 
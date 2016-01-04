import sys, os
sys.path.append(r"/usr/local/lib/python2.7/site-packages")
import requests
from pprint import pprint
import json
import MySQLdb


class RESTwrapper():
	def __init__(self, root):
		self.counter = 0
		self.root = root

	def request(self, response, endpoint, method, data = None):
		self.counter += 1
		if data:
			print("Request {0}\t[{1}] {2}\t Data:".format(self.counter, endpoint, method))
			print(json.dumps(json.loads(data),indent = 2, sort_keys = True))
		else:
			print("Request {0}\t[{1}] {2}".format(self.counter, endpoint, method))
		if response.ok:
			print("Result:\n\tStatus:\t{0}\n\tData:".format(response.status_code))
			print(json.dumps(json.loads(response.content),indent = 2, sort_keys = True))
		else:
			print("Result:\n\tStatus:\t{0}\n\tData:\t{1}".format(response.status_code, ''))
			sys.exit(0)
		raw_input('\ncontinue')
		return json.loads(response.content)

	def get(self, endpoint):
		return self.request(requests.get(self.root + endpoint), endpoint, 'GET')

	def post(self, endpoint, data):
		return self.request(requests.post(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'POST', data)

	def patch(self, endpoint, data):
		return self.request(requests.patch(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'PATCH', data)				

	def delete(self, endpoint, data):
		return self.request(requests.delete(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'DELETE', data)


class sqlWrapper():
	def __init__(self, connection):
		self.counter = 0
		self.conn = connection

	def rint(self, query):
		self.counter += 1
		self.conn.execute(query)
		print("Query {0}\t[{1}]:\n\t{2}\nResult:".format(self.counter, query.strip().split(' ')[0],query))
		pprint(self.conn.fetchall()[0][1:-1])		
		

def main(argv = None):
	if len(argv) < 6:
		print('Usage:\n\t{0}<user> <host> <pwd> <db name> <"local"/"remote"> [port]'.format(argv[0]))
		sys.exit(0)
	db_args = {
		'user' : argv[1],
		'host' : argv[2],
		'passwd' : argv[3],
		'db' : argv[4]
		}
	mode = argv[5]
	if len(argv) == 7:
		db_args['port'] = argv[6]

	#p = sqlWrapper(MySQLdb.connect(**db_args).cursor())
	if (mode == 'remote'):
		r = RESTwrapper('http://sigmaticv010-env.elasticbeanstalk.com/')	
	elif (mode == 'local'):
		r = RESTwrapper('http://127.0.0.1:3000/')


	# action 1: registering a user, fire register endpoint. 
	r.post('register','{"firstName":"Loek","lastName":"Janssen","oauth":"ljanssen@stanford.edu"}')
	user_uuid  = raw_input('Input uuid:\t')

	# action 2: registering a new experiment
	r.post(user_uuid + '/exp/new','{"name" : "Falu vs Turqois background","descr" : "Landing page test of site engagement with different background colors of website","prop":"25","succUuid":"0e3a11a6_5627_499e_b60c_7b2269843e89","updateModel":"10","dataWindow":"30","timeout":"1000"}')

	# action 3: activating the experiment
	exp_uuid  = raw_input('Input created exp uuid:\t')
	r.patch(user_uuid + '/exp/' + exp_uuid,'{"active" : "1"}')	

	# action 4: editing the experiment
	r.patch(user_uuid + '/exp/' + exp_uuid,'{"name" : "Falu vs Darkgreen vs Black background","descr" : "Different background colors of website","prop":"35","succUuid":"0e3a11a6_5627_499e_b60c_7b2269843e89","updateModel":"14","dataWindow":"20","timeout":"12000"}')



if __name__=='__main__':
	main(sys.argv)
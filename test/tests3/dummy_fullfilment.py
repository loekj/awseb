import sys, os
sys.path.append(r"/usr/local/lib/python2.7/site-packages")
import requests
from pprint import pprint
import json
import random
import time


class RESTwrapper():
	def __init__(self, root):
		self.counter = 0
		self.root = root

	def request(self, response, endpoint, method, data = None):
		self.counter += 1
		if data:
			print("Request {0}\t[{1}] {2}\t Data:".format(self.counter, endpoint, method))
			print(data)
			print(json.dumps(json.loads(data),indent = 2, sort_keys = True))
		else:
			print("Request {0}\t[{1}] {2}".format(self.counter, endpoint, method))
		if response.ok:
			print("Result:\n\tStatus:\t{0}\n\tData:".format(response.status_code))
			print(json.dumps(json.loads(response.content),indent = 2, sort_keys = True))
		else:
			print("Result:\n\tStatus:\t{0}\n\tData:\t{1}".format(response.status_code, ''))
			sys.exit(0)
		return json.loads(response.content)

	def get(self, endpoint):
		return self.request(requests.get(self.root + endpoint), endpoint, 'GET')

	def post(self, endpoint, data):
		return self.request(requests.post(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'POST', data)

	def patch(self, endpoint, data):
		return self.request(requests.patch(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'PATCH', data)				

	def delete(self, endpoint, data):
		return self.request(requests.delete(self.root + endpoint, data = data, headers={"content-type":"application/json"}), endpoint, 'DELETE', data)	
		

def main(argv = None):
	if len(argv) < 3:
		print('Usage:\n\t{0}<"local"/"remote"> <# of cases>'.format(argv[0]))
		sys.exit(0)

	mode = argv[1]
	n = int(argv[2])

	if (mode == 'remote'):
		r = RESTwrapper('http://branch-dev.elasticbeanstalk.com/')	
	elif (mode == 'local'):
		r = RESTwrapper('http://127.0.0.1:3000/')

	def get_random_datapoint():
		# feature 1: car color
		color = ['black', 'green', 'red', 'blue', 'purple']

		# feature 2: miles driven range
		min_miles = 5000
		max_miles = 250000

		# feature 3: car make
		car = ['nissan', 'ford', 'toyota', 'volvo']

		# feature 4: income range
		min_income = 30000
		max_income = 300000
		return '["' + color[random.randint(0,len(color)-1)] + '","' + str(random.randint(min_miles,max_miles)) + '","' + car[random.randint(0,len(car)-1)] + '","' + str(random.randint(min_income,max_income)) + '"]'

		

	exp_uuid  = raw_input('Input expUuid:\t')

	# generating random data
	for _ in range(n):
		r.post('fulfillment','{"callback":"__jsonp_0","userData":' + str(get_random_datapoint()) +',"modules":[{"expUuid":"' + exp_uuid + '"}]}')
		print("")
		time.sleep(10)

	



if __name__=='__main__':
	main(sys.argv)
"""
import sklearn
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
# Dummy data
from sklearn.datasets import make_hastie_10_2
"""

"""
Python script that trains the model
For now just do random selection
"""
import random
import sys, os
import socket

server_address = '/tmp/pysocket'
"""Implement socket listening?"""
class dummyObj(object):
	def __init__(self):
		self.x = 5

	def setX(self, x):
		self.x = x

	def getX(self):
		return self.x



try:
	MY_DUMMY
except NameError:
	MY_DUMMY = dummyObj()

def main(argv = sys.argv):
	global MY_DUMMY
	exp_uuid = argv[1]
	x1 = int(argv[2])
	print(MY_DUMMY.getX())
	MY_DUMMY.setX(x1)

if __name__=='__main__':
	main()



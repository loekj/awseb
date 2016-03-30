#http://scikit-learn.org/stable/modules/generated/sklearn.linear_model.MultiTaskElasticNet.html

import sys
import os
from bson.objectid import ObjectId
from pymongo import MongoClient
import json
from sklearn import linear_model
import numpy as np
from operator import add

#UNDER CONSTRUCTION
#DO NOT USE

PATH_DB_DATA = "../../../database_info_remote.json"


if __name__ == "__main__":
	if len(sys.argv) < 2:
		raise RuntimeError('usage:\n\t{0} <_moduleId of document>'.format(sys.argv[0]))
	
	with open(PATH_DB_DATA) as f:
		db_info = json.load(f)

	#url_db = "mongodb://"+db_info["user"]+":"+db_info["password"]+"@"+db_info["host"]+":"+db_info["port"]
	client = MongoClient(db_info["host"]+":"+db_info["port"])
	db = client[db_info["database"]]
	#print(db)
	#db.authenticate(db_info["user"],db_info["password"],source=db_info["database"])

	object_id = ObjectId(sys.argv[1])
	data = db.data.find({"_moduleId" : object_id})[0]["data"]
	module_info = db.modules.find({"_id" : object_id})[0]
	assert(module_info["succ"]["TestSuccFn"]["depVarType"] == "binary")
	variations = module_info["variations"]
	num_var = len(variations)
	num_feat = len(module_info["featureType"])
	# X = np.ndarray(len(data))
	#assert(module_info["succ"]["TestSuccFn"]["depVarType"] == "numerical")

	# count variations first
	var_count = {variation : 0 for variation in variations}
	for row in data:
		var_count[row["variation"]] += 1
	clf = linear_model.MultiTaskElasticNet(alpha=0.1)
	X = np.ndarray((2,2,2))
	Y = np.ndarray((2,2))
	X[0][0][1] = 3
	Y[0][0] = 4
	print(X)
	print("------")
	print(Y)
	clf.fit(X,Y)

	#X = np.ndarray((max(var_count.values()),num_feat,num_var))
	#print(X[1])
	sys.exit(1)
	for row in data:
		row_data = [float(observed) for observed in row["userData"]]
		task = variations.index(row["variation"])
		try:
			X[task]
			try:
				X[task].append(row_data)
			except:
				X[task] = [row_data]
		except:
			X.append([row_data])
		try:
			Y[task]
			try:
				Y[task].append(float(row["result"]))
			except:
				try:
					Y[task] = [float(row["result"])]
				except:
					pass
		except:
			try:
				Y.append([float(row["result"])])
			except:
				pass

	#clf = linear_model.MultiTaskElasticNet(alpha=0.1)
	#clf.fit(X,Y)

	# X = []
	# Y = []
	# for row in data:
	# 	row_data = [float(observed) for observed in row["userData"]]
	# 	task = variations.index(row["variation"])
	# 	try:
	# 		X[task]
	# 		try:
	# 			X[task].append(row_data)
	# 		except:
	# 			X[task] = [row_data]
	# 	except:
	# 		X.append([row_data])
	# 	try:
	# 		Y[task]
	# 		try:
	# 			Y[task].append(float(row["result"]))
	# 		except:
	# 			try:
	# 				Y[task] = [float(row["result"])]
	# 			except:
	# 				pass
	# 	except:
	# 		try:
	# 			Y.append([float(row["result"])])
	# 		except:
	# 			pass


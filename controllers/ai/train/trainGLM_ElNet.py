#http://scikit-learn.org/stable/modules/generated/sklearn.linear_model.MultiTaskElasticNet.html
# IMPORTANT:
#	Do not upgrade to SciKit-learn 0.19 or higher. This only works with version 0.17

import sys
import os
from bson.objectid import ObjectId
from pymongo import MongoClient
import json
from sklearn import linear_model
import warnings
from datetime import datetime
import itertools
import pprint

if __name__ == "__main__":

	if len(sys.argv) < 3:
		raise RuntimeError('usage:\n\t{0} <_moduleId of document> <database info file>'.format(sys.argv[0]))
	
	try:
		with open(sys.argv[2]) as f:
			db_info = json.load(f)
	except:
		print("No database file found!")
		sys.exit(1)

	# visualize the fetched object
	pp = pprint.PrettyPrinter()

	#url_db = "mongodb://"+db_info["user"]+":"+db_info["password"]+"@"+db_info["host"]+":"+db_info["port"]
	client = MongoClient(db_info["host"]+":"+db_info["port"])
	db = client[db_info["database"]]
	
	# authenticate?
	#db.authenticate(db_info["user"],db_info["password"],source=db_info["database"])

	object_id = ObjectId(sys.argv[1])
	data = db.data.find({"_moduleId" : object_id})[0]["data"]
	module_info = db.modules.find({"_id" : object_id})[0]
	variations = module_info["variations"]

	# get dimensions for later us
	num_var = len(variations)
	num_feat = len(module_info["featureType"])

	# check all different levels of cat variables and store them
	cat_levels = [[]] * num_feat
	no_result_counter = 0
	for row in data:
		try:
			row["result"]
		except:
			no_result_counter += 1
		else:
			try:
				
				for idx, feature in enumerate(module_info["featureType"]):
					if feature == "0": # categorical, keep as string and track seen levels
						row["userData"][idx] = str(row["userData"][idx])
						this_feature = row["userData"][idx].strip()
						if not this_feature in cat_levels[idx]:
							cat_levels[idx].append(this_feature)
			except Exception as e:
				print(e)
				sys.exit(1)
	
	assert(module_info["succ"]["TestSuccFn"]["depVarType"] == "numerical")

	# Decompose into variations first
	X_all = {str(variation) : [] for variation in variations}
	Y_all = {str(variation) : [] for variation in variations}

	# Now get the fitted model and store all the cat variables in sub-lists
	for row in data:
		try:
			Y_all[str(row["variation"])].append(float(row["result"]))
		except:
			pass
		else:
			try:
				X_all[str(row["variation"])].append([])
				for idx, feature in enumerate(module_info["featureType"]):
					if feature == "0": # multiclass, keep as string and track seen levels
						this_observed = row["userData"][idx].strip()						
						X_all[str(row["variation"])][-1].append([0] * (len(cat_levels[idx]) - 1))
						if this_observed != cat_levels[idx][-1]: # then it's not the implied level
							idx_level = cat_levels[idx].index(this_observed)
							X_all[str(row["variation"])][-1][-1][idx_level] = 1						
					else: # numerical (ordinal?)
						X_all[str(row["variation"])][-1][idx] = float(row["userData"][idx])
			except Exception as e:
				print(e)
				sys.exit(1)


	#decide here if that is enough to train this model for all
	for var_id, var_data in Y_all.iteritems():
		if len(var_data) < 200:
			print(str(len(var_data)) + "/200: Not enough samples yet for variation " + str(var_id))
			raise RuntimeError()

	# flatten X row-by-row:
	for variation_key in X_all:
		for idx in range(len(X_all[variation_key])):
			X_all[variation_key][idx] = list(itertools.chain.from_iterable(X_all[variation_key][idx]))

	# check VIF perhaps?
	# ...
	# For each model, check linear vs non-linear relationship, 
	# determine models to try, do nested regularized CV over modelspace?
	# For now just do simple e-net CV
	model_props = {
		"l1_ratio" : 0.5, #0.5 default, [.1, .25, .5, .7, .8, .85, .9, .925, .95, .97, .99, 1]
		"eps" : 0.001,
		"n_alphas" : 100,
		"alphas" : None,
		"fit_intercept" : True,
		"normalize" : False,
		"precompute" : 'auto',
		"max_iter" : 5000,
		"tol" : 0.0001,
		"cv" : None,
		"copy_X" : True,
		"verbose" : 0,
		"n_jobs" : 1,
		"positive" : False,
		"random_state" : int(datetime.utcnow().strftime("%s")),
		"selection" : 'random'
	}
	
	# setup trained funcs
	fitted_pars = {str(variation) : None for variation in variations}
	intercepts = {str(variation) : None for variation in variations}
	clf = linear_model.ElasticNetCV(**model_props)
	warnings.filterwarnings("ignore", category=DeprecationWarning)
	for var_id in X_all:
		# set CV to k-fold
		clf.set_params(cv= len(X_all[var_id]))
		fitted_model = clf.fit(X_all[var_id],Y_all[var_id])
		fitted_pars[var_id] = list(fitted_model.coef_)
		intercepts[var_id] = fitted_model.intercept_

	# now wrap each cat var parameter fitted pars list in a dict
	for variation_key in fitted_pars:
		ii = 0
		new_pars_data = []
		while len(fitted_pars[variation_key]) != 0:
			if module_info["featureType"][ii] == "0":
				num_fitted_pars = len(cat_levels[ii]) - 1 # 
				cat_feat_pars = fitted_pars[variation_key][:num_fitted_pars]
				new_pars_data.append( dict(zip(cat_levels[ii][:-1],cat_feat_pars)) )
				for _ in range(len(cat_feat_pars)):
					fitted_pars[variation_key].pop(0)
			else:
				new_pars_data.append( fitted_pars[variation_key][0] )
				fitted_pars[variation_key].pop(0)
			ii += 1
		fitted_pars[variation_key] = [intercepts[variation_key]] + new_pars_data
	
	result_update = db.modules.update_one(
		{
			"_id" : object_id
		},
		{
			"$set" : {
				"model" : {
					"type" : "GLM_ElNet",
					"modified" : datetime.utcnow(),
					"levels" : cat_levels,
					"fit" : fitted_pars
				}
			}
		})
	print("Finished!:")
	print(result_update)

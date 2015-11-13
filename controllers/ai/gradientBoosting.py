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
import random,sys

exp_uuid = sys.argv[1]
num_variations = int(sys.argv[2])
x1 = sys.argv[3]
x2 = sys.argv[4]

print(random.randint(0,num_variations-1))



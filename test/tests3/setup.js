use sigmatic
db.createCollection('accounts', { autoIndexID : true })
db.accounts.insert({'firstName' : 'Loek', 'lastName' : 'Janssen', 'added' : Date.now(), 'email' : 'ljanssen@stanford.edu', 'permis' : 1, 'subscrId' : 0});
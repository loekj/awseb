// Here are some strawmen we can use to discuss our MongoDB collection structure

/************************************************************
  Collection: Accounts
************************************************************/
{  
   "_id":"56802a9198e1d763bedce3c5",
   "email":"ljanssen@stanford.edu",
   "pwd":BinData(0,"3m0xCxgKQ97FMTdRfzGD3BLlQOQLnta9rpWBTynTw9jOq8y7UD2G9G17cniw5H1zl/tZWmbIV/ykJeSpAGQUcPQ8wlzC8myJqSzCU77JjO6Q687rlQa3u3GjoQhn2MYdF/jfYYNo5LgG1sgz1YD7I50fFjpFbaN4qB4tFXLoaKA939284LX0cu91Ai0c2daCuDZhg2xtLwbyaTxaLZzZC2pnbs69//vAyiDdfzYaNovRm0VPYA80XiHZdUBQKKlal1ibTqkcyTj5t0mAiEaNDamLIeir33ZysXQ2U6j1tA8VPJ//xFjscdBkpOuvjYhiAADkEeH6DSVMJnP/16FP16/1FkV4nyqLYZkGDz8qqSUp6eXXRH9EjXki5ZtxD6J04Jc0WwFaVLn7fc9MBDe7RM5bZBFdu3/0q2jdYXzaZA78uinSgG9nwCO9OsYz6NalAsNbRRm+DtdYvnNqny5p4yOp2rTNLsGCcED2DVSh2h3JDzcYUbYEjfhovMzpRbDTx2+BW8ByF2C7ypO4KqPmYASus3jzYBX6baiN5WKx1mZ/XUH9vHZMNd+mYmLemOVhW22BnU4flN8OiGrrFyhNYHBsmKRGafNGKLXWo02vEOp3OjATKrZ+ONabaFWGg4NZ04hE+oWfF/G5+dsRSABksm4bYJhnLBGU7qORTnpwsbE="),
   // BinData is a BSON datatype, base64 encoded byte-strings
   "salt":"3JdaPHM6mwk/ujONSayh29xvFw95nOclX+kq0YiQB9faWTI4ZrR1CE1x7nNzJ+KW3EmXz8583gJzDIG33vhCK114QU2tN5FJY/iB5Oecq+hOeaucdY+R5rg94lZGPZgIBg/tetbUcom9of4AIUMZYPyZmW8xw4Ravci1eGqn7UU=",
   "firstName":"Loek",
   "lastName":"Janssen",
   "added":1451240081045,
   "permis":1,
   "subscrId":0
}

/************************************************************
  Collection: Variations
************************************************************/
[
  {
    "_id": "568575d508e9edcad10506a5",
    "_moduleId": "5685754a08e9edcad105069e",
    "_userId": "56802a9198e1d763bedce3c5",
    "name": "var4",
    "descr": "blah1",
    "added": 1451587029380,
    "modified": 1451587029380,
    "html": {
      "id1": "<div class=\"345\"><h2>title1</h2></div>",
      "id2": "<div class=\"678\"><h3>title3</h3></div>"
    },
    "css": ".345{color:blue;} .678{color:black;}",
    "js": null
  }
]


/************************************************************
  Collection: Modules
************************************************************/
[
 {
    "_id": "5685754a08e9edcad105069e",
    "_userId": "56802a9198e1d763bedce3c5",
    "name": "test2",
    "descr": "Second test module",
    "added": 1451586890161,
    "modified": 1451586890161,
    "prop": 15,
    "window": 20,
    "update": 15,
    "variations": [
      "568575d508e9edcad10506a5",
      "568575da08e9edcad10506a6",
      "568575de08e9edcad10506a7",
      "568575e208e9edcad10506a8",
      "568575e608e9edcad10506a9"
    ],
    "succ": {
      "succUuid": "7722c97f-d721-4604-9619-34f6a4961a58",
      "url": "/testurl", //url can be missing
      "depVarType": "binary", //binary/ mclass/ numerical (defines train type)
      "args": [
        "test1",
        "test2",
        "test3"
      ],
      "timeout": 15000
    },
    "featureType": [ // 0 is categorical, 1 is numerical
      "0", 
      "1",
      "0",
      "0"
    ] 

    /* 
    This fit key-val will only be here when model is trained
    */
    /*
    "fit" : {
      "568575d508e9edcad10506a5" : [
          { 
            "green":"0.12",
            "red":"0.21",
            "blue":"0.02",
            "black":"0.50" // Categorical feature 4 classes (see featureType)
          },
          [
            "2.1",
            "1.82" // Numerical feature (see featureType)
          ],
          {
            "0":"0.12",
            "1":"0.88" // Categorical feature 2 classes (see featureType)
          },          
          {
            "ford":"0.19",
            "vw":"0.14",
            "jaguar":"0.05",
            "bently":"0.09",
            "cadillac":"0.41" // Categorical feature 5 classes (see featureType)
          },     
        ], 
        same for other varia tions
        etc....      
    }
    */ 
  }
]

/************************************************************
  Collection: Data
************************************************************/

{  
   "_id":"5685754a08e9edcad105069f",
   "_moduleId":"5685754a08e9edcad105069e",
   "_userId":"56802a9198e1d763bedce3c5",
   "data":[  
      {
        'testUuid' : "f42cde8e-91f5-4ehs-b73b-513154409790",
        'added' : 1451586890260,
        'userData' : [
          "10",
          "205",
          "green"
        ],
        'variation' : "568575d508e9edcad10506a5", 
        'result' : null,
        'inTest' : true
      }, 
      {
        'testUuid' : "9j2cdla1-72g5-10zs-akz6-141167991291",
        'added' : 1451586890502,
        'userData' : [
          "-5",
          "201",
          "black"
        ],
        'variation' : "568575d508e9edcad10506a7",
        'result' : "1", //binary response modules.succ.depVarType
        'inTest' : false
      },           
   ]
}
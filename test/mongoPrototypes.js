var promiseLib = require('when');

var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;

var dbUrl = 'mongodb://localhost:27017/';
var url = dbUrl + 'test';

// Here are some strawmen we can use to discuss our MongoDB collection structure

/************************************************************
  Collection: Variations
************************************************************/
var variationsCollection = [
  {
    _id: 'module123_812', // This UUID would need to be constructed upon variation entry into the DB.
    moduleId: 'module123', // Equal to the module's UUID in the Module
    code: {
      // HTML Needs to be key/value pairs.  Keys correlate to div's on page.
      html: {
        id1: "<div class='thingOne'>content 1</div>",
        id2: "<div class='thingTwo'>content 2</div>",
        id3: "<div class='thingThree'>content 3</div>"
      },
      css: ".thingOne {color: purple} .thingTwo {color: green}",
      js: "return utilities.promiseLib.promise(function(resolve) { setTimeout(function() {this.resolve()}.bind({resolve: resolve}),3000); });"
    }
  }, 
  {
    _id: 'module123_813',
    moduleId: 'module123',  
    code: {
      html: {
      // HTML Needs to be key/value pairs.  Keys correlate to div's on page.
        id1: "<div class='thingOne'>content 5</div>",
        id2: "<div class='thingTwo'>content 6</div>",
        id3: "<div class='thingThree'>content 7</div>"
      },
      css: ".thingOne {color: red} .thingTwo {color: blue}",
      js: "return utilities.promiseLib.promise(function(resolve) { setTimeout(function() {this.resolve()}.bind({resolve: resolve}),3000); });"
    }
  }, 
  {
    _id: 'module738_814',
    moduleId: 'module738',  
    code: {
      html: {
        id1: "<div class='thingOne'>content X</div>"
      },
      css: ".thingOne {color: red} .thingTwo {color: blue}"
    }
  }
]


/************************************************************
  Collection: Modules
************************************************************/
var modulesCollection = [
  {
    _id: "module123",
    creationDate: 1451082879000, // Date of module's entry
    omissionDate: 1482705244000, // Date to omit data from localStorage
    // An array of variation IDs, matching those in the Variations Collection:
    variations: ["module123_812", "module123_813"],
    percentToInclude: 0.1,
    tests: {
      clickExample: {
        type: "click-specific",
        elemId: "someButton",
        url: "/confirmation/",
        expiration: "1800000000",
        unique: false
      },
      customSuccess1: {
        type: "destination-page",
        url: "?signedup=true",
        expiration: "2700000000",
        unique: true
      },
    }
  },
  {
    _id: "module738",
    creationDate: 1451082879000, // Date of module's entry
    omissionDate: 1482705244000, // Date to omit data from localStorage
    // An array of variation IDs, matching those in the Variations Collection:
    variations: ["module123_812", "module123_813"],
    percentToInclude: 0.1,
    tests: {
      clickExample: {
        type: "click-specific",
        elemId: "someButton",
        url: "/confirmation/",
        expiration: "1800000000",
        unique: false
      },
      destinationPageExample: {
        type: "destination-page",
        url: "?signedup=true",
        expiration: "2700000000",
        unique: true
      },
    }
  }
]
/************************************************************
  Collection: User-completed Successes
************************************************************/

var successesCollection = [
    {
    _id: "module123", // Equal to the module's UUID in the Module Collection
    variations: {
      clickExample: [
        {
          userData: [1234, 1343, 6343, 0924, 2433],
          value: 1
        }, 
        {
          userData: [6343, 0924, 7648, 0276, 1237, 0937],
          value: 1
        }, 
        {
          userData: [8367, 3816, 0098],
          value: 1
        }, 
      ],
      customSuccess1: [
        {
          userData: [1234, 1343, 6343, 2473],
          value: 199.99
        }, {
          userData: [7648, 0276, 1237, 0937],
          value: 899.99
        }, {
          userData: [7366, 2389, 2971, 4301, 9378, 9034],
          value: 7.50
        }
      ]
    }
  },
  {
    _id: "module738", // Equal to the module's UUID in the Module Collection
    variations: {
      clickExample: [
        {
          userData: [1234, 1343, 6343, 0924, 2433],
          value: 1
        }
      ],
      destinationPageExample: [
        {
          userData: [1234, 1343, 6343, 2473],
          value: 199.99
        }, 
        {
          userData: [7648, 0276, 1237, 0937],
          value: 899.99
        }
      ]
    }
  }
]

/************************************************************
  Collection: Users
  This may not be necessary.  Just a structure in case we need to record successes on a user bases
************************************************************/

var usersCollection = [
  {
    _id: 1290481293,
    modules: {
      // Keys of module object are the tests the user is in:
      module123: {
        variation: "variationId1",
        clickExample: 12, // Number of successes incurred by this success type
        destinationPageExample: true
      },
      module738: {
        variation: "control",
        pageviews: 24, // Number of successes incurred by this success type
        destinationPageExample: true, // If success type is boolean (has user gone to specific page, in this case)
        customSuccess1: [199.99, 24.99, 8.75] // If we were to collect purchase totals of user
      }
    },
    userSegments: [1234, 1343, 6343, 0924, 2433]
  },
  {
    _id: 1290481294,
    modules: {
      // Keys of module object are the tests the user is in:
      module123: {
        // Each test object contains an entry for each success:
        variation: "control",
        clickExample: 54, // Number of successes incurred by this success type
        destinationPageExample: false
      },
      module738: {
        variation: "variation5",
        pageviews: 24, // Number of successes incurred by this success type
        destinationPageExample: true, // If success type is boolean (has user gone to specific page, in this case)
        customSuccess1: [41.00, 1.00] // If we were to collect purchase totals of user
      }
    },
    userSegments: [6343, 0924, 7648, 0276, 1237, 0937] // If we were to store user data
  }
];


function insertDbEntry(url, collectionName, data) {
  return promiseLib.promise(function(resolve, reject) {
    MongoClient.connect(url, function(err, db) {
      db.collection(collectionName).insertOne(data, function(err, result) {
        console.log("Inserted a document into the restaurants collection.");
        resolve(result);
        db.close(result);
      });
    });
  });
}

for(var i=0; i< variationsCollection.length; i++) {
  insertDbEntry(url, 'variations', variationsCollection[i]).then(function(x) {
    console.log('variationsCollection', x);
  });
}
for(var i=0; i< modulesCollection.length; i++) {
  insertDbEntry(url, 'modules', modulesCollection[i]).then(function(x) {
    console.log('modulesCollection', x);
  });
}
for(var i=0; i< successesCollection.length; i++) {
  insertDbEntry(url, 'successes', successesCollection[i]).then(function(x) {
    console.log('successesCollection', x);
  });
}
for(var i=0; i< usersCollection.length; i++) {
  insertDbEntry(url, 'users', usersCollection[i]).then(function(x) {
    console.log('usersCollection', x);
  });
}
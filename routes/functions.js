var express = require('express');
var router = express.Router();

/*
GET DATA
This function handels all question to get something from the database
 */
router.post('/get', function(req, res) {
	//initalise the db
	var db = req.db;
	
	/*Gets the requesttype for further actions
	0 = Gives back all users
	1 = Gives back beacons by macAdress
	2 = Gives back all macAdresses, who sees beacon(s)
	3 = Gives back all macAdresses, who sees beacon(s) in a specific range
	*/
	var reqtyp = req.body.reqtyp;
	
  switch (parseInt(reqtyp)) {
  
	//Gives back all user with macAdress, registered and timestamp back
	//POST : reqtyp : '0'
    case 0:
		//FUNCTION
		db.collection('userlist').find().toArray(function (err, result) {
			res.send(result);
		});
    break;
	
	//Gives back all beacons that one user(by his macAdress) can see 
	//POST: reqtyp : '1', macAdress : 'macAdress'
    case 1:
		//VARIABLES
		thisOwner = req.body.macAdress;
		
		//FUNCTION
		db.collection('beaconlist').find({ macAdressOwner : thisOwner }).toArray(function (err, result) {
			res.send(result);
		});
    break;
    
    //Request from house control
    //POST: reqtyp : '2', beacons : 'macAdressBeacon1, macAdressBeacon2, ...
    //or beacons : 'macAdressBeacon1, minRage1, maxRange1, macAdressBeacon2, minRage2, maxRange2', ...
    case 2:
    var searchData = [];
		var help = [];
		var helpp = [];
		var prev = {macAdressOwner : ''};
		var boolHelp = false;
		var beaconData = req.body.beacons.split('#');
		var sendData = "";
    
    
    var callback = function(error, results) {
      if(error) 
        console.log(error);
      else {
        console.log(results);
        console.log(results[0]['timestamp']);
      }
    };
    
    if(isNaN(beaconData[1]) && isNaN(beaconData[2])) {
    for(var i=0; i<beaconData.length; i++) {
			searchData[i] = { 'macAdressBeacon' : beaconData[i] }
		}
		db.collection('beaconlist').find( { $or: searchData } ).toArray(function (err, result) {
			for(var i=0; i<result.length; i++){
				if(result[i].macAdressOwner !== prev.macAdressOwner){
				help.push(result[i]);	
				helpp.push(1);
				}
				else{
					helpp[helpp.length-1]++;
				}
				prev = result[i];
			}
			for(var i=0; i<result.length; i++){
				if(helpp[i] === searchData.length){
					if( sendData != '' && i<result.length){
					sendData += "#";
					}
					sendData += help[i].macAdressOwner;
					//TIMESTAMP
				}
			}
			res.send(sendData);
		});
    }
    //Get macAdress of users, who sees this beacon(s)
    else {
      for(var i=0; i<beaconData.length; i=i+3){
        searchData[i/3] = { 'macAdressBeacon' : beaconData[i], 'rangeBeacon' : { $gt :  parseFloat(beaconData[i+1]), $lt :  parseFloat(beaconData[i+2]) } }
      }
      console.log(searchData);
      var documents = db.collection('beaconlist').find( { $or: searchData  } ).toArray(function(error, results) {
          if(error)
            console.log(error);
          else {
            console.log(results);
            console.log(results[0]['macAdressOwner']);
            db.collection('userlist').find( { macAdress : results[0]['macAdressOwner'] } ).toArray(callback);
          }
      });
		/*function (err, result) {
			if(result != null){
			for(var i=0; i<result.length; i++){
				if(result[i].macAdressOwner !== prev.macAdressOwner){
				help.push(result[i]);	
				helpp.push(1);
				}
				else{
					helpp[helpp.length-1]++;
				}
				prev = result[i];
			}
			for(var i=0; i<result.length; i++){
				if(helpp[i] === searchData.length){
					if( sendData != '' && i<result.length){
					sendData += "#";
					}
					sendData += help[i].macAdressOwner;
					}
					//TIMESTAMP
					
					var myCursor = db.collection('userlist').find( { macAdress : help[i].macAdressOwner } );
					console.log("Cursor");
					console.log(myCursor);
					while (myCursor.hasNext()) {
            printjson(myCursor.next());
          }/*.toArray(function (err, result) {
					
					console.log(result[0].timestamp);
					sendData += '#' + result[0].timestamp;
					}
					});
				}
			}
			res.send(sendData);
		});*/
    }
    break;
    
   default:
      res.send('This request is not defined!');
	
  }
	 
});


/*
UPDATE DATA
This function handles all inputs in the database 
 */
router.post('/update', function(req, res) {
	//VARIABLES
	var db = req.db;
	var dataMac = req.body.macAdress;	
	//save the date in miliseconds
	var thisTimestamp = Date.now();
	var beacons	= req.body.beacons;
	//later contains all beacondata
	var splitBeacons = [];
	console.log(req.body);
	//-----------CHECK POST----------
	//check if macAdress is real
	if(!checkMacAdress(dataMac)){
		res.send({ msg: 'Das ist keine echte MAC-Adresse' });
		return;
	}
	
	//check Beacons
	if(beacons != ''){
    splitBeacons = beacons.split("#");
    for(var i=0; i< splitBeacons.length; i=i+2){
      //check macAdress Beacons
      if(!checkMacAdress(splitBeacons[i])){
        res.send({ msg: 'Das ist keine echte MAC-Adresse' });
        return;
      }
	
      //check range Beacons
      if(isNaN(splitBeacons[i+1]) || splitBeacons[i+1] === null || splitBeacons[i+1] === ''){
        res.send({ msg: 'Die Range deiner Beacons stimmt nicht' });
        return;
      }
    }
	}
	//-----------CHECK POST----------
	
	//FUNCTION
	//Updates or set the user
	db.collection('userlist').update({macAdress : dataMac},{ $set:{ macAdress : dataMac, timestamp : thisTimestamp } }, {upsert: true }, function(err, result){
        res.send((err === null) ? { msg: '' } : { msg: err });
    });
    
	//removes all beacons of this user(by macAdress)
    db.collection('beaconlist').remove( { macAdressOwner : dataMac }, function(err, result) {
    });
   
	//checks if the user see beacons
	if(beacons != ''){
		//puts in all beacons with range
		for(var i=0; i< splitBeacons.length; i=i+2){
				db.collection('beaconlist').update({macAdressBeacon : splitBeacons[i], macAdressOwner : dataMac }, { $set:{ macAdressOwner : dataMac, macAdressBeacon : splitBeacons[i], rangeBeacon : parseFloat(splitBeacons[i+1]) } }, {upsert: true }, function(err, result){
					res.send( (err === null) ? { msg: '' } : { msg: err });
				});
		}
   }
   
});

/*
DELETE DATA
This functions deletes all datas of the user(including the beacons he sees)
 */
router.post('/delete', function(req, res) {
	//VARIABLES
    var db = req.db;
    var dataMacAdress = req.body.macAdress;
	
	//FUNCTION
	//removes all beacons that the user(macAdress) has
	db.collection('beaconlist').remove( { macAdressOwner : dataMacAdress }, function(err, result) {
      res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
	
	//removes the user(by macAdress)
    db.collection('userlist').remove({macAdress : dataMacAdress}, function(err, result) {
		res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

/*
REGISTER DATA
this function un/register the user
*/
router.post('/register', function(req, res) {
	//VARIABLES
	var db = req.db;
	var dataMacAdress = req.body.macAdress;
	
	//FUNCTION
	//replace the whole entry with the new registered flag
	db.collection('userlist').update({macAdress : dataMacAdress }, { $set: req.body}, function(err, result) {
            res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	});
});


function checkMacAdress(macAdress){
	var checkMac;
	
	if(macAdress === null){
	return false;
	}
	checkMac = macAdress.split(':');
	if(checkMac.length != 6){
	return false;
	}
	for(var i=0; i<checkMac.length; i++){
		if(!isHex(checkMac[i])){
			return false;
		}
	}
	return true;
}

function isHex(string)
 {
    if (string.length!=2) return false;
    for (i=0; i<2; i++)
    {
      if (isNaN(parseInt(string, 16)))
        {return false;}
    }
    return true;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
 }



module.exports = router;
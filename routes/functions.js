var express = require('express');
var router = express.Router();

var debugMode = true; //En-/Disable Logs

/*
GET DATA
These functions handels all question to get something from the database
 */
 
//Gives back all user with macAdress, registered and timestamp back
 router.post('/getUser', function(req, res) {
	var db = req.db;
 
	db.collection('userlist').find().toArray(function (err, result) {
	
			if(debugMode)
				console.log(result);
			
			res.send(result);
		});		
 });

//Gives back all beacons that one user(by his macAdress) can see  
router.post('/getBeacons', function(req, res) {
  		//VARIABLES
		var db = req.db;
		var thisOwner = req.body.macAdress;
		
		//FUNCTION
		db.collection('beaconlist').find({ macAdressOwner : thisOwner }).toArray(function (err, result) {
		
			if(debugMode)
				console.log(result);
			
			res.send(result);
		});
});
 
router.post('/get', function(req, res) {
	//initalise the db
	var db = req.db;

    //Get macAdress of users, who sees this beacon(s)
	//beacons : 'macAdressBeacon1, macAdressBeacon2, ...'
		//VARIABLES
		//holds the formated data, that is searched for
		var searchData = [];
		
		var newSearchData = [];
		
		var sortedResult = [];
		var countResult = [];
		
		var prev = {macAdressOwner : ''};
		//holds the sended data from the user(find request)
		var beaconData = req.body.beacons.split('#');
		//holds the sending data
		var sendData = "";
		//describes the offset a timestamp can have to now(in seconds)
		var offset = req.body.offset;
		//status of the user; 0 = unregistered; 1 = registered
		var registered = req.body.registered;
		if(debugMode){
			console.log("Registered: " + registered);
			console.log("Offset: " + offset);
		}
		//FUNCTIONS
		//counts how often which macAdress is found
		function countResults(result){
			for(var i=0; i<result.length; i++){
				if(result[i].macAdressOwner !== prev.macAdressOwner){
					sortedResult.push(result[i]);	
					countResult.push(1);
				}
				else{
					countResult[countResult.length-1]++;
				}
				prev = result[i];
			}
		}
		
		//Creates the data to send and also send it
		function createSearchData(result){
			//if macAdress counted = all beacons ask for => users see all beacons 
			for(var i=0; i<result.length; i++){
				if(countResult[i] === searchData.length){
					newSearchData.push( { 'macAdress' : sortedResult[i].macAdressOwner } );
				}
			}
		}
		
		function checkTimestamp(result){
			for(var i=0; i<result.length; i++){
				if(offset * 1000 >= (Date.now() - result[i].timestamp) || offset == 0 || offset == null || offset == ''){
					if(registered == result[i].registered || registered == null || registered == ''){
						if( sendData != '' && i<result.length){
							sendData += "#";
						}
						sendData += newSearchData[i].macAdress;
					}
				}
			}
			if(debugMode)
				console.log("sendData:" + sendData);
			
		}

		if(debugMode)
			console.log("------------Beginn eines Datensatzes---------");
		
		//creates the searchData
		for(var i=0; i<beaconData.length; i=i){
			if(!isNaN(beaconData[i+1])) {
				 if(!isNaN(beaconData[i+2])){
					searchData.push({ 'macAdressBeacon' : beaconData[i], 'rangeBeacon' : { $gt :  parseFloat(beaconData[i+1]), $lt :  parseFloat(beaconData[i+2]) } });
					i=i+3;
				 }
				 else{
					searchData.push({ 'macAdressBeacon' : beaconData[i], 'rangeBeacon' : parseFloat(beaconData[i+1]) });
				 	i=i+2;
				 }
				
			}
			else{
				searchData.push({ 'macAdressBeacon' : beaconData[i] });
				i++;
			}
		}		

		
		if(debugMode)
			console.log("SearchData:" + JSON.stringify(searchData));
			
		//searchs for macAdresses of the owners(phones)
		db.collection('beaconlist').find( { $or: searchData  } ).toArray(function (err, result) {
			if(result != null){
			
				if(debugMode)
					console.log("Result:" + JSON.stringify(result));
			
				countResults(result);
			
				if(debugMode){
					console.log("Sorted Result: " + JSON.stringify(sortedResult));
					console.log("Count results: " + JSON.stringify(countResult.toString()));
				}
				
				createSearchData(result);
			
				if(debugMode)
					console.log("newSearchData: " + JSON.stringify(newSearchData));
			
				db.collection('userlist').find( { $or: newSearchData } ).toArray(function (err, results){
				
					if(results != null){
						if(debugMode)
							console.log("Result: " + JSON.stringify(results));
				
						checkTimestamp(results);
					}
					res.send(sendData);
				});
			}
		});	 
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
	
	//FUNCTIONS
	function checkBeacons(){
	//check Beacons
	if(beacons != ''){
		splitBeacons = beacons.split("#");
		//rounds range to 2 decimal places
		for(var i = 0; i< splitBeacons.length-1; i=i+1){
			splitBeacons[i+1] = Math.round(parseFloat(splitBeacons[i+1])*100)/100;
		}
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
	}	
	
	
	//-----------CHECK POST----------
	//check if macAdress is real
	if(!checkMacAdress(dataMac)){
		res.send({ msg: 'Das ist keine echte MAC-Adresse' });
		return;
	}
	
	//check Beacons
	checkBeacons();
	//-----------CHECK POST----------
	
	if(debugMode){
		console.log("---------------Update Data---------");
		console.log(JSON.stringify(req.body));
	}
	
	
	//Updates or set the user
	db.collection('userlist').update({macAdress : dataMac},{ $set:{ macAdress : dataMac, timestamp : thisTimestamp } }, {upsert: true }, function(err, result){
        res.send((err === null) ? { msg: '' } : { msg: err });
    });
    
	//removes all beacons of this user(by macAdress)
    db.collection('beaconlist').remove( { macAdressOwner : dataMac }, function(err, result) {
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
   
});

/*
DELETE DATA
This functions deletes all datas of the user(including the beacons he sees)
 */
router.post('/delete', function(req, res) {
	//VARIABLES
    var db = req.db;
    var dataMacAdress = req.body.macAdress;
	
	if(debugMode){
		console.log("---------------Delete User---------");
		console.log(JSON.stringify(req.body));
	}
	
	//FUNCTIONS
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
	
	//FUNCTIONS
	//replace the whole entry with the new registered flag
	if(debugMode){
		console.log("---------------Register User---------");
		console.log(JSON.stringify(req.body));
	}
	
	db.collection('userlist').update({macAdress : dataMacAdress }, { $set: req.body}, function(err, result) {
            res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	});
});

router.post('/updateUser', function(req, res) {
	//VARIABLES
	var db = req.db;
	var dataMacAdress = req.body.macAdress;
	//FUNCTIONS
		if(debugMode){
		console.log("---------------Update User---------");
		console.log(JSON.stringify(req.body));
	}
	db.collection('userlist').update({macAdress : dataMacAdress }, { $set: req.body}, function(err, result) {
            res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
	});
});

//checks a macAdress if it's real
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

//check if a string is hex
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



module.exports = router;
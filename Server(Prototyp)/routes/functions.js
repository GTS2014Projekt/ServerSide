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
	
	//Gives back all user with macAdress, registered and timestamp back
	//POST : reqtyp : '0'
    if(reqtyp === '0'){
		//FUNCTION
		db.collection('userlist').find().toArray(function (err, result) {
			res.send(result);
		});
    }
	
	//Gives back all beacons that one user(by his macAdress) can see 
	//POST: reqtyp : '1', macAdress : 'macAdress'
    if(reqtyp ==='1'){
		//VARIABLES
		thisOwner = req.body.macAdress;
		
		//FUNCTION
		db.collection('beaconlist').find({ macAdressOwner : thisOwner }).toArray(function (err, result) {
			res.send(result);
		});
    }
    
	
    //Get macAdress of users, who sees this beacon(s)
	//POST: reqtyp : '2', beacons : 'macAdressBeacon1, macAdressBeacon2, ...'
    if(reqtyp ==='2'){
		//TO DO
	}
	 
	 //GET macAdress of users, who sees beacon(s) in a specific range
	 //POST: reqtyp : '3', beacons : 'macAdressBeacon1, minRage1, maxRange1, macAdressBeacon2, minRage2, maxRange2'
	 if(reqtyp === '3'){
		//TO DO
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
		splitBeacons = req.body.beacons.split("#");
		//puts in all beacons with range
		for(var i=0; i< splitBeacons.length; i=i+2){
				db.collection('beaconlist').update({macAdressdressBeacon : splitBeacons[i], macAdressOwner : dataMac }, { $set:{ macAdressOwner : dataMac, macAdressBeacon : splitBeacons[i], rangeBeacon : splitBeacons[i+1] } }, {upsert: true }, function(err, result){
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

module.exports = router;
// DOM READY
$(document).ready(function() {
    
	// Populate the user table on initial page load
    populateTable();
    
	// Link delete get clicked -> delete user and his beacons
    $('#list table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

	//Link status get clicked -> change status status
	$('#list table tbody').on('click', 'td a.linkstatus', status);
	
    // MAC-Adress get clicked -> show beacons of this user
    $('#list table tbody').on('click', 'td a.linkshowbeacons', showbeacons);
   
   	// Button "update username" -> updates the username  
	$('#btnUpdateUser').on('click', updateUser);
   
    // Button "update data" get clicked -> send data to database
	$('#btnUpdateData').on('click', update);
     
    // Button "get data" get clicked -> initiate the search
    $('#btnGetData').on('click', get);
	
});

// FUNCTIONS

// Fill table with data
function populateTable() {
	// Empty content string
    var tableContent = '';
    
     // Use AJAX for POST
    $.ajax({
		type: 'POST',
		url: '/functions/getUser'
    }).done(function( response ) {
            
		// If no data was found show a alert
		if (response === '') {
			alert('Es konnten keine Daten gefunden werden!');
        }
			
		// If data was found, place it in the HTML table
        else{  
			$.each(response, function(){
				tableContent += '<tr>';
			
				//MAC-Adress has the function to show all beacons seen by this macAdress, therefore it sends on clicking its macAdress
				tableContent += '<td><a href="#" class="linkshowbeacons" rel="' + this.macAdress + '" title="Zeigt Beacons vom Nutzer">' + this.macAdress + '</td>';

				tableContent += '<td>' + this.user + '</td>';
			
				// The status sends when clicked it's status and macAdress
				tableContent += '<td><a href="#" class="linkstatus" rel="' + this.macAdress + "#" + this.status + '">' + this.status + '</a></td>';
              
				tableContent += '<td>' + this.timestamp + '</td>';
			  
				//the delete function sends the macAdress when clicked
				tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this.macAdress + '">delete</a></td>';
				tableContent += '</tr>';
			});
			
            // Inject content string into HTML table
            $('#list table tbody').html(tableContent);
        }
    });
};

// Update Data
function update(event) {
	// Prevents default HTML functions
    event.preventDefault();

        // Requestbody with macAdress and beacons#range
        var reqBody = {
            'macAdress': $('#updateData fieldset input#inputMacAdress').val(),
            'beacons' : $('#updateData fieldset input#inputBeacons').val()
        }

        // Use AJAX to post
        $.ajax({
            type: 'POST',
            data: reqBody,
            url: '/functions/update'
        }).done(function( response ) {
		
            // Check for successful (blank) response
            if (response.msg === '') {
			
				// Clear the form inputs
                $('#updateData fieldset input#inputMacAdress').val('');
				$('#updateData fieldset input#inputBeacons').val('');
				
                // Update the table
                populateTable();
            }
			
			// If something goes wrong, alert the error message that the service returned
            else {
                alert('Error: ' + response.msg);
            }
        });
};

//Change the status of the user
function status(event){
	// Prevents default HTML functions
	event.preventDefault();
	
	//VARIABLES
	//Splits up the send data in macAdress and status
	var data = $(this).attr('rel').split('#');
	//new status of the user
	var status;
		
	//FUNCTION	
    // If status = 1 set it on 0 else set it on 1
	if(data[1] === '1'){
        status = 0;
    }
    else{
         status = 1;
    }
        
    //Fills requestbody with macAdress and status
	reqBody = {
        'macAdress': data[0],
        'status': status
    }
	
    // Use AJAX to post
    $.ajax({
        type: 'POST',
		data: reqBody,
        url: '/functions/status'
    }).done(function( response ) {
            
		// Check for successful (blank) response
		if (response.msg === '') {
			//update table
			populateTable();
		}
		
		// If something goes wrong, alert the error message that the service returned	
		else {
			alert('Error: ' + response.msg);
         }
    });
};

// Delete Data
function deleteUser(event) {
   // Prevents default HTML functions
	event.preventDefault();

    // Pop up a confirmation dialog
    var confirmation = confirm('Sind sie sicher, dass sie diesen Nutzer unwiederruflich löschen wollen? Sie können Ihn auch einfach auf nicht registrieriert setzen!');

    // Check and make sure the user confirmed
    if (confirmation === true) {
		// Fills the requestbody with macAdress
		var reqBody = {
            'macAdress': $(this).attr('rel')
        }
		
		// Use AJAX to post
        $.ajax({
            type: 'POST',
            data: reqBody,
            url: '/functions/delete'
        }).done(function( response ) {
			// Check for successful (blank) response
            if (response.msg === '') {
				//update table
				populateTable();
			}
			
            // If something goes wrong, alert the error message that the service returned			
			else {
                alert('Error: ' + response.msg);
            }
        });
    }
     
	// If they said no to the confirm, do nothing
	else {
        return false;
    }
};

// Show Beacons of the user
function showbeacons(event) {
    // Prevents default HTML functions
    event.preventDefault();
	
	$('#updateUser fieldset input#inputMacAdress').val($(this).attr('rel'));
	$('#updateData fieldset input#inputMacAdress').val($(this).attr('rel'));
    
    // Empty content string
    var tableContent = '';
		
    // Fills the requestbody with macAdress
	var reqBody = {
        'macAdress' : $(this).attr('rel')
	}
       
    // Use AJAX for POST
    $.ajax({
        type: 'POST',
        data: reqBody,
        url: '/functions/getBeacons'
    }).done(function( response ) {
		// If no data was found show a alert
		if (response.length === 0) {
            alert('Es konnten keine Daten gefunden werden!');
		}
		
		// If data was found, place it in the HTML table
		else{  	
			$.each(response, function(){
				tableContent += '<tr>';
				tableContent += '<td>' + this.macAdressOwner + '</td>';
				tableContent += '<td>' + this.macAdressBeacon + '</td>';
				tableContent += '<td>' + this.rangeBeacon + '</td>';
				tableContent += '<tr>';
			});
			$('#listInfo table tbody').html(tableContent);
		}
	});
};

//searchs for user that sees macAdress
function get(event){
	// Prevents default HTML functions
	event.preventDefault();
  
    var reqBody = {
        'beacons': $('#getData fieldset input#inputBeacons').val(),
        'offset': $('#getData fieldset input#inputOffset').val(),
		'status': $('#getData fieldset input#inputStatus').val()
    }
	
    // Use AJAX for POST
    $.ajax({
        type: 'POST',
        data: reqBody,
        url: '/functions/get'
    }).done(function( response ) {
		//show the result in a alert
		alert(response);
	});
}

//update the user name of a user
function updateUser(event){
	// Prevents default HTML functions
	event.preventDefault();
	
	var reqBody = {
		'macAdress' : $('#updateUser fieldset input#inputMacAdress').val(),
		'user' : $('#updateUser fieldset input#inputUser').val()
	}
	
    // Use AJAX for POST
    $.ajax({
        type: 'POST',
        data: reqBody,
		url: '/functions/updateUser'
	}).done(function( response ) {	
            // Check for successful (blank) response
            if (response.msg === '') {
			
				// Clear the form inputs
                $('#updateUser fieldset input#inputMacAdress').val('');
				$('#updateUser fieldset input#inputUser').val('');
                
				// Update the table
                populateTable();
            }
			
			// If something goes wrong, alert the error message that the service returned
            else {
                alert('Error: ' + response.msg);
            }
	});
}
// DOM READY
$(document).ready(function() {
    // Populate the user table on initial page load
    populateTable();
    
     // MAC-Adress get clicked -> Show Beacons
    $('#list table tbody').on('click', 'td a.linkshowbeacons', showbeacons);
   
     // Button Update Data get clicked -> Update Data
     $('#btnUpdateData').on('click', update);
     
     // Button Get Data get clicked -> et Data
     $('#btnGetData').on('click', get);
	 
	 $('#btnUpdateUser').on('click', updateUser);
      
    // Link delete get clicked -> delete User
    $('#list table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

	//Link register get clicked -> change register status
	$('#list table tbody').on('click', 'td a.linkregister', register);
	
	
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
			
			// If data was found, place it in the table
            else{  
            $.each(response, function(){
              tableContent += '<tr>';
			  //MAC-Adress has the function to show all beacons seen by this macAdress, therefore it sends on clicking its macAdress
              tableContent += '<td><a href="#" class="linkshowbeacons" rel="' + this.macAdress + '" title="Zeigt Beacons vom Nutzer">' + this.macAdress + '</td>';
			  tableContent += '<td>' + this.user + '</td>';
			  // The registerdata sends when clicked it's status and macAdress
              tableContent += '<td><a href="#" class="linkregister" rel="' + this.macAdress + "#" + this.registered + '">' + this.registered + '</a></td>';
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

        // Use AJAX to post the object to our add service
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
            else {
                // If something goes wrong, alert the error message that the service returned
                alert('Error: ' + response.msg);
            }
        });
};

//Change the status of registration
function register(event){
	// Prevents default HTML functions
	event.preventDefault();
	
	//VARIABLES
	//Splits up the send data in macAdress and registered
	var data = $(this).attr('rel').split('#');
	var registered;
		
	//FUNCTION	
    // If registered = 1 set it on 0 else set it on 1
	if(data[1] === '1'){
        registered = 0;
    }
    else{
         registered = 1;
    }
        
    //Fills requestbody with macAdress and registered
	reqBody = {
        'macAdress': data[0],
        'registered': registered
    }
	
    // Call the POST with our registration
    $.ajax({
        type: 'POST',
		data: reqBody,
        url: '/functions/register'
    }).done(function( response ) {
            
			// Check for successful (blank) response
      if (response.msg === '') {
        //update table
        populateTable();
			}
			else {
        // If something goes wrong, alert the error message that the service returned
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
		// Fills the requestbody with the macAdress
		var reqBody = {
            'macAdress': $(this).attr('rel')
        }
		
        // Call the POST with our newData
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
			else {
                // If something goes wrong, alert the error message that the service returned
                alert('Error: ' + response.msg);
            }
        });

    }
    else {
        // If they said no to the confirm, do nothing
        return false;
    }
};

// Show Beacons of the user send
function showbeacons(event) {
    // Prevents default HTML functions
    event.preventDefault();
    
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
		
		// If data was found, place it in the table
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

function get(event){
  // Prevents default HTML functions
  event.preventDefault();
  
    var reqBody = {
        'beacons': $('#getData fieldset input#inputBeacons').val(),
        'offset': $('#getData fieldset input#inputOffset').val(),
		'registered': $('#getData fieldset input#inputRegistered').val()
    }
	
    // Call the POST with our registration
    $.ajax({
        type: 'POST',
        data: reqBody,
        url: '/functions/get'
    }).done(function( response ) {
      //$('#getData fieldset input#inputReqTyp').val('');
      //$('#getData fieldset input#inputOffset').val('');
      alert(response);
	});
}

function updateUser(event){
	// Prevents default HTML functions
	event.preventDefault();
	
	var reqBody = {
		'macAdress' : $('#updateUser fieldset input#inputMacAdress').val(),
		'user' : $('#updateUser fieldset input#inputUser').val()
	}
	
    // Call the POST with our registration
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
            else {
                // If something goes wrong, alert the error message that the service returned
                alert('Error: ' + response.msg);
            }
	});
	
}


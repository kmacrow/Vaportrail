
function send_feedback(){
	var from = $('#feedback_email').val().trim();
	var text = $('#feedback_text').val().trim();
	if(!text){
		$('#feedback_form').addClass('error');
		return;	
	}
	
	
	function feedback_success(resp){
		$('#feedback_btn').button('reset');
		
		if(resp != '1'){
			feedback_error();
		}else{
			$('#feedback_alert').slideDown();
			setTimeout(function(){
				$('#feedback_alert').slideUp();
				$('#feedback_modal').modal('toggle');
				
			}, 2000);
			
		}
	}
	
	function feedback_error(){
		$('#feedback_btn').button('reset');
		$('#feedback_form').addClass('warning');
	}
	
	$('#feedback_btn').button('loading');
	
	$.ajax({
		url: '/feedback/',
		type: 'POST',
		data: {'message': text, 'email': from},
		success: feedback_success,
		error: feedback_error
	})
}


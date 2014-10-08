var loaded = false;
$(document).one('ready', function() {
	//$.mobile.changePage('#home');
});

$(document).on('pageinit', '#home', function(e){
	$('.ui-input-search').hide();
	Muziq.init("VK");
	Muziq.init("LastFm");	


});

$(document).on('pageinit', '#player', function(e){
	//Muziq.init("Player");
	
});


	
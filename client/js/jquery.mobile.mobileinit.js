$( document ).on( "mobileinit", function() {
	$.mobile.defaultPageTransition = 'none';
	$.mobile.linkBindingEnabled = false;
	$.mobile.allowCrossDomainPages = true;
    $.mobile.pushStateEnabled = false;

 // these two options fuck-up the photoswipe   
//   $.mobile.changePage.defaults.changeHash = false;
   $.mobile.hashListeningEnabled = false;
});
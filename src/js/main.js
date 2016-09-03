"use strict";

let head = document.getElementsByTagName('head')[0]
	,csses = [
		'https://fonts.googleapis.com/css?family=Roboto:400,900,900italic,300italic,300,400italic,500,500italic,700,700italic|Lora:400,400italic,700,700italic&amp;subset=latin,latin-ext'
		,'bootstrap/3.3.6/css/bootstrap.min'
		,'css/style.min'
	]

csses.forEach((css) => {
	let cssElm = document.createElement('link');
	cssElm.rel = 'stylesheet'
	cssElm.href = (css.startsWith('http://') || css.startsWith('https://')) ? css : window.url.ASSETS + css + '.css';
	head.appendChild(cssElm);
});

requirejs.config({
    baseUrl: window.url.JS
	,useMinified: true
    ,paths: {
		lf: window.url.JS + 'lovefield'
		,'datatables.net': window.url.ASSETS + 'datatables/DataTables-1.10.12/js/jquery.dataTables'
		,'datatables.net-responsive': window.url.ASSETS + 'datatables/Responsive-2.1.0/js/dataTables.responsive'
    }
	,shim: {
		'rpTabulator': {
			deps: ['jquery', 'anotherUtility', 'lf/lovefield']
            ,exports: 'rp'
		}
		,'anotherUtility': {
			deps: ['jquery']
			,exports: 'anotherUtility'
		}
		,'jquery.validate': {
			deps: ['jquery']
		}
		
	}

});

// Start the main app logic.
requirejs(['jquery', 'rpTabulator'], function ($, RPTabulator) {

	window.rp = new RPTabulator();

	let timeoutID  = setTimeout(attemptLoad, 10);

	$(window).on('rainkedPairs.dbConnected', () => {
		timeoutID = null;
		rp.load();
	});

	function attemptLoad() {
		if (!timeoutID) return;
		if (rp.loadedItems.lf === true) {
			timeoutID = null;
			rp.load();
		}
		else timeoutID = setTimeout(attemptLoad, 10);
	}
});
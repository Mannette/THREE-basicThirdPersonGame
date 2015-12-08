/*
 * Game UI
 *
 * A class for handling the user interface of the gaming providing DOM element management and some helpers
 */

window.game = window.game || {};

window.game.ui = function() {
	// variables for the timer
	var seconds = 0,
			minutes = 0,
			hours = 0;
	// var time = $('#timer');

	var _ui = {
		// Attributes
		elements: {
			// Properties for DOM elements are stored here
			infoboxIntro: null,
			time: null,
			t: null
		},

		// Methods
		init: function () {
			// Get DOM elements and bind events to them
			_ui.getElements();
			_ui.bindEvents();
		},
		destroy: function () {

		},
		getElements: function () {
			// Store the DOM elements in the elements object to make them accessible in addClass, removeClass and hasClass
			_ui.elements.infoboxIntro = document.querySelector("#infobox-intro");
			_ui.elements.time = document.querySelector("#timer");
		},
		bindEvents: function () {
			// Event bindings
		},
		fadeOut: function (element) {
			// Add a CSS class, fading is done via CSS3 transitions
			if (!_ui.hasClass(element, "fade-out")) {
				_ui.addClass(element, "fade-out");
			}
		},
		addClass: function (element, className, resetClassName) {
			// Adds a class to a specified element
			if (resetClassName && _ui.elements[element].getAttribute("data-classname")) {
				_ui.elements[element].className = resetClassName && _ui.elements[element].getAttribute("data-classname");
			}

			_ui.elements[element].className = _ui.elements[element].className + " " + className;
		},
		removeClass: function (element, className) {
			// Removes a class from a specified element
			var classNameRegEx = new RegExp("\\s\\b" + className + "\\b", "gi");
			_ui.elements[element].className = _ui.elements[element].className.replace(classNameRegEx, "");
		},
		hasClass: function (element, className) {
			// Checksif a specified element contains the given class name
			return _ui.elements[element].className.match(className);
		},
		addTime: function() {
			seconds++;
			if (seconds >= 60) {
				seconds = 0;
				minutes++;
				if (minutes >= 60) {
					minutes = 0;
					hours++;
				}
			}
			_ui.elements.time.textContent = (hours ? (hours > 9 ? hours : '0' + hours) : '00') + ':' + (minutes ? (minutes > 9 ? minutes : '0' + minutes) : '00') + ':' + (seconds > 9 ? seconds : '0' + seconds);

			_ui.timer();
		},
		timer: function() {
			_ui.elements.t = setTimeout(_ui.addTime, 1000);
		}
	};

	return _ui;
};

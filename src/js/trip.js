import $ from 'jquery';
import _ from 'lodash';
import tippy from 'tippy.js';
import ScrollMagic from 'scrollmagic';
import imagefill from 'imagefill';
import mediumZoom from 'medium-zoom';
import TripMap from './trip-map';
import NZMap from './nz-map';


var Trip = function (day) {
	this.day = day;
	this.controller = new ScrollMagic.Controller();
	this._setScenes();
	this._setImagesContainer();
	this._initZoom();
	this._initTooltips();
	this._initListeners();
	this._initTripMap();
	this._initNZMap();
};

_.extend(Trip.prototype, {
	_initListeners: function () {
		window.onresize = _.debounce(this._onResize.bind(this), 500);
	},

	_setImagesContainer: function () {
		$('.js-imageContainer').imagefill();
	},

	_initZoom: function () {
		mediumZoom(
			$('[data-zoom="zoom"]'),
			{
				background: 'rgba(255, 255, 255, 0.9)'
			}
		);
	},

	_setScenes: function () {
		var tripMapSelector = '.js-tripmap';

		new ScrollMagic.Scene({
				triggerElement: '.js-fakeNavigation',
				triggerHook: 'onLeave'
			})
			.setClassToggle('.js-navigation', 'is-fixed')
			.addTo(this.controller);

		$('em').each(function (i, el) {
			var self = this;
			new ScrollMagic.Scene({
				triggerElement: el,
				triggerHook: 'onEnter'
			})
			.on('start', function () {
				var pos = this.triggerElement().innerText;
				self._onScroll(pos);
			})
			.addTo(this.controller);
		}.bind(this));

		var windowWidth = $(window).outerWidth();
		var windowHeight = $(window).outerHeight();
		var mapHeight = $(tripMapSelector).outerHeight();
		var mapOffset = windowWidth > windowHeight || windowWidth > 920 ? -((windowHeight - mapHeight) / 2) : 0;

		this.mapScene = new ScrollMagic.Scene({
				triggerElement: '.js-content',
				triggerHook: 'onLeave',
				offset: mapOffset
			})
			.setPin(tripMapSelector)
			.addTo(this.controller);
	},

	_initTooltips: function () {
		tippy('.js-tippy');
	},

	_onResize: function () {
		this.mapScene && this.mapScene.update();
	},

	_onScroll: function (pos) {
		this.map && this.map.setScroll(pos);
	},

	_initTripMap: function () {
		this.map = new TripMap({
			day: this.day,
			el: '.js-tripmap'
		});
	},

	_initNZMap: function () {
		this.nzmap = new NZMap({
			day: this.day,
			el: '.js-nzmap'
		});
	}
});


var app = new Trip(window.day);
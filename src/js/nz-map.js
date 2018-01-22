import $ from 'jquery';
import * as d3 from 'd3';
import _ from 'lodash';

var Map = function (params) {
	this.day = params.day;
	this.el = params.el;

	this.width = $(this.el).innerWidth();
	this.height = $(this.el).innerHeight();

	this.svg = d3.select(this.el)
		.append('svg')
		.attr('class', 'svg');

	this.g = this.svg.append('g');

	this._setSize();

  this.projection = d3.geoMercator()
		.center([172, -42])
    .scale(1100)
    .translate([250,250]);

  this.path = d3.geoPath().projection(this.projection);

  this._fetchData();
};

_.extend(Map.prototype, {

	_setSize: function () {
		this.svg
			.attr('width', this.width)
	    .attr('height', this.height)
	},

	_fetchData: function () {
		var pathFeatures = new Promise((res, rej) => {
		  d3.json('/data/' + 'nz.geojson', function(err, data) {
		    err ? rej(err) : res(data);
		  });
		});

		pathFeatures.then((data) => {
		  this._renderPath(data);
		  d3.json('/data/' + this.day + '-path.geojson', this._renderBounds.bind(this));
		});
	},

	_renderBounds: function (error, data) {
    var bounds = this.path.bounds(data);

    var dx = bounds[1][0] - bounds[0][0];
	  var dy = bounds[1][1] - bounds[0][1];
	  var x = (bounds[0][0] + bounds[1][0]) / 2;
	  var y = (bounds[0][1] + bounds[1][1]) / 2;

    this.svg
	    .append('rect')
	    .attr('x', x - (dx/2))
			.attr('y', y - (dy/2))
			.attr('width', dx)
			.attr('height', dy)
			.attr('class', 'Trip-nzBounds');
	},

	_renderPath: function (data) {
  	this.svg.selectAll('path')
    	.data(data.features)
    	.enter()
			.append('path')
      .attr('d', this.path)
      .attr('class', 'Trip-nzLine');
	},

	_getStrokeDashoffset: function () {
		return (this.totalLength - ((this.totalLength * this.currentPos) / 100));
	}

});

module.exports = Map;
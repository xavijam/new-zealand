import $ from 'jquery';
import * as d3 from 'd3';
import _ from 'lodash';

var Map = function (params) {
	this.day = params.day;
	this.el = params.el;
	this.currentPos = 0;

	this.svg = d3.select(this.el)
		.append('svg')
		.attr('class', 'svg');

	this._setSize();

  this.projection = d3.geoMercator()
      .scale(1)
      .translate([0,0]);

  this.path = d3.geoPath().projection(this.projection);

  this._fetchData();
};

_.extend(Map.prototype, {

	_setSize: function () {
		this.width = $(this.el).innerWidth();
		this.height = $(this.el).innerHeight();
		this.svg
			.attr('width', this.width)
	    .attr('height', this.height)
	},

	_fetchData: function () {
		var pathFeatures = new Promise((res, rej) => {
		  d3.json('/data/' + this.day + '-path.geojson', function(err, data) {
		    err ? rej(err) : res(data);
		  });
		});

		pathFeatures.then((data) => {
		  this._renderPath(data);
		  d3.json('/data/' + this.day + '-places.json', this._renderPlaces.bind(this));
		});
	},

	_renderPlaces: function (error, data) {
		var projection = this.projection;

    var lakes = this.svg.selectAll('path')
      .data(data.features)
      .enter()
      .filter(d => d.type === 'lake');

    lakes
      .append('path')
      .attr('d', d => this.path(d.geojson))
      .attr('class', 'Trip-lakePath');

    lakes
    	.append('text')
    	.attr('class', 'Trip-lakeLabel')
      .attr('x', d => d.offset[0] + this.path.centroid(d.geojson)[0])
			.attr('y', d => d.offset[1] + this.path.centroid(d.geojson)[1])
			.style('text-anchor', d => d.anchor || 'start')
      .text(d => d.name);

    var places = this.svg.selectAll('circle')
      .data(data.features)
      .enter()
      .filter(d => d.type === 'place');

    places
      .append('circle')
      .attr('class', 'Trip-placePoint')
      .attr('transform', d => 'translate(' + projection(d.lngLat) + ')')
      .attr('r', '4px');

    places
    	.append('text')
    	.attr('class', 'Trip-placeLabel')
    	.attr('transform', d => 'translate(' + projection(d.lngLat) + ')')
      .style('text-anchor', d => d.anchor || 'start')
      .attr('x', d => (d.offset && d.offset[0]) || '0')
      .attr('y', d => (d.offset && d.offset[1]) || '0')
      .text(d => d.name);
	},

	_renderPath: function (data) {
		this._setBounds(data);

		var frame = this.svg.selectAll('path')
    	.data(data.features)
    	.enter();

		frame.append('path')
      .attr('d', this.path)
      .attr('class', 'Trip-backLine');

    this.lineP = frame.append('path')
      .attr('d', this.path)
      .attr('class', 'Trip-mainLine');

    this.totalLength = this.lineP.node().getTotalLength();

    this.lineP
      .attr('stroke-dasharray', this.totalLength + ' ' + this.totalLength)
      .attr('stroke-dashoffset', this._getStrokeDashoffset());
	},

	_setBounds: function (data) {
	  var b = this.path.bounds(data);
	  var s = .95 / Math.max((b[1][0] - b[0][0]) / this.width, (b[1][1] - b[0][1]) / this.height);
	  var t = [(this.width - s * (b[1][0] + b[0][0])) / 2, (this.height - s * (b[1][1] + b[0][1])) / 2];

	  this.projection
	    .scale(s)
	    .translate(t);
	},

	_getStrokeDashoffset: function () {
		return (this.totalLength - ((this.totalLength * this.currentPos) / 100));
	},

	setScroll: function (currentPos) {
		var oldPos = this.currentPos;
		this.currentPos = currentPos;

		if (this.lineP) {
			var diff = Math.abs(currentPos - oldPos);

	    this.lineP
	    	.transition()
	      .duration(diff * 10)
	      .ease(d3.easeLinear)
	      .attr('stroke-dashoffset', this._getStrokeDashoffset());
	  }
	}

});

module.exports = Map;
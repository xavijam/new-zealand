import $ from 'jquery';
import * as d3 from 'd3';
import _ from 'lodash';

var DEFAULT_MOUNTAIN_SIZE = 5;
var MAX_MOUNTAIN_SIZE = 10;

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
		if (error) {
			return true;
		}

		var projection = this.projection;
    var g0 = this.svg
      .append('g')
      .attr('class', 'mountains');

    var mountains = g0.selectAll('g.dataObject')
      .data(data.features)
      .enter()
      .filter(d => d.type === 'mountains');

    // Pattern
    var mountainsData = mountains.data(0)[0] || {};
    var $pattern = $('#triangle');
    mountainsData.size = mountainsData.size || DEFAULT_MOUNTAIN_SIZE;
    mountainsData.patternUnits = 'userSpaceOnUse';

    var mS = Math.min(mountainsData.size, MAX_MOUNTAIN_SIZE);

    $pattern
      .attr('width', mountainsData.size)
      .attr('height', mountainsData.size)
      .attr('patternContentUnits', mountainsData.patternUnits)
    $pattern.find('polyline')
      .attr('points', '0,' + mS + ' ' + mS/2 + ',' + ((mS/2)-1) + ' ' + mS + ',' + mS)

    mountains
      .selectAll('rect')
      .data(d => d.geojson.features)
      .enter()
      .append('rect')
      .attr('x', -(mountainsData.size/2))
      .attr('y', -(mountainsData.size/2))
      .attr('width', mountainsData.size)
      .attr('height', mountainsData.size)
      .attr('transform', d => 'translate(' + projection(d.geometry.coordinates) + ')')
      .style('fill', 'url(#triangle)');

    var g1 = this.svg
      .append('g')
      .attr('class', 'lakes');

    var lakes = g1.selectAll('path')
      .data(data.features)
      .enter()
      .filter(d => d.type === 'lake');

    lakes
      .append('path')
      .attr('d', d => this.path(d.geojson))
      .attr('class', d => 'Trip-' + d.type + 'Path');

    lakes
      .append('text')
      .attr('class', d => 'Trip-' + d.type + 'Label')
      .attr('x', d => d.offset[0] + this.path.centroid(d.geojson)[0])
      .attr('y', d => d.offset[1] + this.path.centroid(d.geojson)[1])
      .style('text-anchor', d => d.anchor || 'start')
      .text(d => d.name);

    var g2 = this.svg
      .append('g')
      .attr('class', 'places');

    var point = g2.selectAll('circle')
      .data(data.features)
      .enter()
      .filter(d => d.type === 'place' || d.type === 'city');

    point
      .append('circle')
      .attr('class', d => 'Trip-' + d.type + 'Point')
      .attr('transform', d => 'translate(' + projection(d.lngLat) + ')')
      .attr('r', '4px');

    point
    	.append('text')
    	.attr('class', d => 'Trip-' + d.type + 'Label')
    	.attr('transform', d => 'translate(' + projection(d.lngLat) + ')')
      .style('text-anchor', d => d.anchor || 'start')
      .attr('x', d => (d.offset && d.offset[0]) || '0')
      .attr('y', d => (d.offset && d.offset[1]) || '0')
      .attr('dx', 0)
      .attr('dy', 0)
      .text(d => d.name)
      .call(this._wrapText, 50, 11);
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
	},

	_wrapText: function (texts, width, lineHeight) {
		texts.each(function() {
      var text = d3.select(this);
      var words = text.text().split(/\s+/).reverse();

      var word = null;
      var line = [];
      var lineNumber = 0;

      var x = text.attr('x');
      var y = text.attr('y');

      var dx = parseFloat(text.attr('dx'));
      var dy = parseFloat(text.attr('dy'));

      var tspan = text.text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dx', dx + 'px')
        .attr('dy', dy + 'px');

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(' '));

        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];

          lineNumber += 1;

          tspan = text.append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dx', dx + 'px')
            .attr('dy', lineNumber * lineHeight)
            .attr('text-anchor', 'begin')
            .text(word);
        }
      }
    });
	}
});

module.exports = Map;
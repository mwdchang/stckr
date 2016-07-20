/**
 * Stckr is really simple single column grid with drag and drop
 * interactions
 *
 * TODO:
 * - max container (scroll)
 */
function Stacker(element) {
  this.element = element;
  this.stack = [];
  this.baseHeight = 0;
  this.enabled = false;
}

/**
 * Returns the container height
 */
Stacker.prototype.height = function() {
  return parseInt(this.element.style('height'), 10);
};

/**
 * Returns the container width
 */
Stacker.prototype.width = function() {
  return parseInt(this.element.style('width'), 10);
};


/*
Stacker.prototype.generate = function(numTracks) {
  this.stack = [];
  for (var i=0; i < numTracks; ++i) {
    this.stack.push({
      trackId: i,
      order: i,
      dy: 0,
      active: false,
      weight: 1.0
    });
  }
};
*/

/**
 * Recalulcate the next position
 */
Stacker.prototype.recalc = function() {
  var height = this.height();
  var totalWeight = this.stack
    .map(function(t) { return t.weight; })
    .reduce(function(a, b) { return a+b; });

  // Test
  this.baseHeight = height / Math.min(4, totalWeight);

  var start = 0;

  var start = 0;
  for (var i=0; i < this.stack.length; ++i) {
    var track = this.stack.filter(function(t) { return t.order === i; })[0];
    track.height = track.weight * this.baseHeight;
    if (track.active === false) {
      track.sy = start;
    }
    start += track.weight * this.baseHeight;
  }
};

Stacker.prototype.modifyTrackWeight = function(id, weight) {
  this.disable();
  var stack = this.stack.filter(function(d) { return d.trackId === id; })[0];
  console.log('s', stack);
  stack.weight = weight;
  this._bind();
  this.enable();
};

Stacker.prototype.addTrack = function(labelStr) {
  this.disable();
  var maxId = 0;
  for (var i=0; i < this.stack.length; i++) {
    if (this.stack[i].trackId > maxId) {
      maxId = this.stack[i].trackId;
    }
  }
  this.stack.push({
    trackId: ++maxId,
    order: this.stack.length,
    dy: 0,
    active: false,
    weight: 1.0
  });
  this.element.append('div').classed('track', true).text(labelStr || null);
  this._bind();
  this.enable();
};

Stacker.prototype.removeTrack = function(id) {
};


Stacker.prototype._bind = function() {
  var tracks = this.element.selectAll('.track');
  var width = this.width();
  this.recalc();
  tracks.data(this.stack)
    .style('top', function(d) { return d.sy; })
    .style('height', function(d) { return d.height; })
    .style('width', width + 'px');
}




Stacker.prototype.disable = function() {
  var tracks = this.element.selectAll('.track');
  var cancelFn = d3.behavior.drag()
    .on('dragstart', null)
    .on('drag', null)
    .on('dragend', null);
  tracks.call(cancelFn);
  this.enabled = false;
}

Stacker.prototype.enable = function() {
  var tracks = this.element.selectAll('.track');
  var _this = this;

  var drag = d3.behavior.drag()
    .on('dragstart', function(d) {
      d.active = true;
      d3.select(this).classed('active-track', true);
    })
    .on('drag', function(d) {
      var ey = d3.event.dy;
      d.dy += ey;
      d3.select(this).style('-webkit-transform', 'translate(' + 0 + 'px,' + d.dy + 'px)')
        .style('z-index', 10);
      _this.reorder();
    })
    .on('dragend', function(d) {
      d.dy = 0;
      d.active = false;
      d3.select(this).classed('active-track', false);
      d3.select(this).style('-webkit-transform', 'translate(' + 0 + 'px,' + d.dy + 'px)')
        .style('z-index', 1);

      _this.recalc();
      _this.element.selectAll('.track').style('top', function(d) { return d.sy; });
    })
  tracks.call(drag);
  this.enabled = true;
};


Stacker.prototype.reorder = function() {
  var active = this.element.select('.active-track').datum();
  var stack = this.stack;
  var _this = this;

  if (!active) return;

  function getByOrder(o) {
    return stack.filter(function(d) { return d.order === o; })[0];
  }

  function swap(current, target) {
    var tmp = current.order;
    current.order = target.order;
    target.order = tmp;
    _this.recalc();
    _this.element.selectAll('.track')
      .filter(function(d) { return d.trackId !== current.trackId; })
      .style('top', function(d) { return d.sy; });
  }


  if (active.dy < 0) { // Moving up
    var checkId = active.order - 1;
    if (checkId < 0) return;
    var target = getByOrder(checkId);
    var targetHeight = target.weight * _this.baseHeight;

    if (active.sy + active.dy > target.sy + 0.5*targetHeight) return;
    swap(active, target);
  } else { // Moving down
    var checkId = active.order + 1;
    if (checkId >= this.stack.length) return;
    var target = getByOrder(checkId);
    var targetHeight = target.weight * _this.baseHeight;

    if (active.sy + active.dy + 0.5*targetHeight < target.sy) return;
    swap(active, target);
  }


};

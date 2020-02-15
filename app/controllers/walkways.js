'use strict';

const Walkways = {
  home: {
    handler: function(request, h) {
      return h.view('home', { title: 'Make a Review' });
    }
  },
  report: {
    handler: function(request, h) {
      return h.view('report', { title: 'Walkways so far' });
    }
  },
  admin: {
    handler: function(request, h) {
      return h.view('admin', { title: 'Administrator Home' });
    }
  }
};

module.exports = Walkways;
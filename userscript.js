// ==UserScript==
// @name         Return YouTube Subscribers
// @namespace    ryts.mgcounts.com
// @version      4.4.1
// @description  See exact subscriber counts on YouTube again: on channel pages, under videos, and in search results.
// @author       @ok_aj
// @homepageURL  https://ryts.mgcounts.com
// @supportURL   https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/issues
// @match        *://*.youtube.com/*
// @icon         https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main/src/icons/icon-128.png
// @downloadURL  https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main/return-youtube-subscribers.user.js
// @updateURL    https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main/return-youtube-subscribers.user.js
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==
// Generated from Odometer, src/shared.js and src/main.js by scripts/build.mjs. Do not edit by hand.

// Odometer 0.4.8 by HubSpot, MIT licence: https://github.hubspot.com/odometer/
// Bundled by scripts/build.mjs from node_modules/odometer. Do not edit by hand.
(function () {
    var define, exports, module; // always a global
    // Builds Odometer's templates, which are nested <span class="...">text</span> only.
    function rytsSpans(html) {
        var root = document.createDocumentFragment(), cur = root;
        String(html).match(/<\/span>|<span(?: class="[^"]*")?>|[^<]+/g).forEach(function (tok) {
            if (tok === "</span>") cur = cur.parentNode || root;
            else if (tok.charAt(0) === "<") {
                var span = document.createElement("span"), cls = tok.match(/class="([^"]*)"/);
                if (cls) span.className = cls[1];
                cur.appendChild(span);
                cur = span;
            } else cur.appendChild(document.createTextNode(tok));
        });
        return root;
    }
(function() {
  var COUNT_FRAMERATE, COUNT_MS_PER_FRAME, DIGIT_FORMAT, DIGIT_HTML, DIGIT_SPEEDBOOST, DURATION, FORMAT_MARK_HTML, FORMAT_PARSER, FRAMERATE, FRAMES_PER_VALUE, MS_PER_FRAME, MutationObserver, Odometer, RIBBON_HTML, TRANSITION_END_EVENTS, TRANSITION_SUPPORT, VALUE_HTML, addClass, createFromHTML, fractionalPart, now, removeClass, requestAnimationFrame, round, transitionCheckStyles, trigger, truncate, wrapJQuery, _jQueryWrapped, _old, _ref, _ref1,
    __slice = [].slice;

  VALUE_HTML = '<span class="odometer-value"></span>';

  RIBBON_HTML = '<span class="odometer-ribbon"><span class="odometer-ribbon-inner">' + VALUE_HTML + '</span></span>';

  DIGIT_HTML = '<span class="odometer-digit"><span class="odometer-digit-spacer">8</span><span class="odometer-digit-inner">' + RIBBON_HTML + '</span></span>';

  FORMAT_MARK_HTML = '<span class="odometer-formatting-mark"></span>';

  DIGIT_FORMAT = '(,ddd).dd';

  FORMAT_PARSER = /^\(?([^)]*)\)?(?:(.)(d+))?$/;

  FRAMERATE = 30;

  DURATION = 2000;

  COUNT_FRAMERATE = 20;

  FRAMES_PER_VALUE = 2;

  DIGIT_SPEEDBOOST = .5;

  MS_PER_FRAME = 1000 / FRAMERATE;

  COUNT_MS_PER_FRAME = 1000 / COUNT_FRAMERATE;

  TRANSITION_END_EVENTS = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';

  transitionCheckStyles = document.createElement('div').style;

  TRANSITION_SUPPORT = (transitionCheckStyles.transition != null) || (transitionCheckStyles.webkitTransition != null) || (transitionCheckStyles.mozTransition != null) || (transitionCheckStyles.oTransition != null);

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

  createFromHTML = function(html) {
    var el;
    el = document.createElement('div');
    el.append(rytsSpans(html));
    return el.children[0];
  };

  removeClass = function(el, name) {
    return el.className = el.className.replace(new RegExp("(^| )" + (name.split(' ').join('|')) + "( |$)", 'gi'), ' ');
  };

  addClass = function(el, name) {
    removeClass(el, name);
    return el.className += " " + name;
  };

  trigger = function(el, name) {
    var evt;
    if (document.createEvent != null) {
      evt = document.createEvent('HTMLEvents');
      evt.initEvent(name, true, true);
      return el.dispatchEvent(evt);
    }
  };

  now = function() {
    var _ref, _ref1;
    return (_ref = (_ref1 = window.performance) != null ? typeof _ref1.now === "function" ? _ref1.now() : void 0 : void 0) != null ? _ref : +(new Date);
  };

  round = function(val, precision) {
    if (precision == null) {
      precision = 0;
    }
    if (!precision) {
      return Math.round(val);
    }
    val *= Math.pow(10, precision);
    val += 0.5;
    val = Math.floor(val);
    return val /= Math.pow(10, precision);
  };

  truncate = function(val) {
    if (val < 0) {
      return Math.ceil(val);
    } else {
      return Math.floor(val);
    }
  };

  fractionalPart = function(val) {
    return val - round(val);
  };

  _jQueryWrapped = false;

  (wrapJQuery = function() {
    var property, _i, _len, _ref, _results;
    if (_jQueryWrapped) {
      return;
    }
    if (window.jQuery != null) {
      _jQueryWrapped = true;
      _ref = ['html', 'text'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        _results.push((function(property) {
          var old;
          old = window.jQuery.fn[property];
          return window.jQuery.fn[property] = function(val) {
            var _ref1;
            if ((val == null) || (((_ref1 = this[0]) != null ? _ref1.odometer : void 0) == null)) {
              return old.apply(this, arguments);
            }
            return this[0].odometer.update(val);
          };
        })(property));
      }
      return _results;
    }
  })();

  setTimeout(wrapJQuery, 0);

  Odometer = (function() {
    function Odometer(options) {
      var e, k, property, v, _base, _i, _len, _ref, _ref1, _ref2,
        _this = this;
      this.options = options;
      this.el = this.options.el;
      if (this.el.odometer != null) {
        return this.el.odometer;
      }
      this.el.odometer = this;
      _ref = Odometer.options;
      for (k in _ref) {
        v = _ref[k];
        if (this.options[k] == null) {
          this.options[k] = v;
        }
      }
      if ((_base = this.options).duration == null) {
        _base.duration = DURATION;
      }
      this.MAX_VALUES = ((this.options.duration / MS_PER_FRAME) / FRAMES_PER_VALUE) | 0;
      this.resetFormat();
      this.value = this.cleanValue((_ref1 = this.options.value) != null ? _ref1 : '');
      this.renderInside();
      this.render();
      try {
        _ref2 = ['innerHTML', 'innerText', 'textContent'];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          property = _ref2[_i];
          if (this.el[property] != null) {
            (function(property) {
              return Object.defineProperty(_this.el, property, {
                get: function() {
                  var _ref3;
                  if (property === 'innerHTML') {
                    return _this.inside.outerHTML;
                  } else {
                    return (_ref3 = _this.inside.innerText) != null ? _ref3 : _this.inside.textContent;
                  }
                },
                set: function(val) {
                  return _this.update(val);
                }
              });
            })(property);
          }
        }
      } catch (_error) {
        e = _error;
        this.watchForMutations();
      }
      this;
    }

    Odometer.prototype.renderInside = function() {
      this.inside = document.createElement('div');
      this.inside.className = 'odometer-inside';
      this.el.textContent = '';
      return this.el.appendChild(this.inside);
    };

    Odometer.prototype.watchForMutations = function() {
      var e,
        _this = this;
      if (MutationObserver == null) {
        return;
      }
      try {
        if (this.observer == null) {
          this.observer = new MutationObserver(function(mutations) {
            var newVal;
            newVal = _this.el.innerText;
            _this.renderInside();
            _this.render(_this.value);
            return _this.update(newVal);
          });
        }
        this.watchMutations = true;
        return this.startWatchingMutations();
      } catch (_error) {
        e = _error;
      }
    };

    Odometer.prototype.startWatchingMutations = function() {
      if (this.watchMutations) {
        return this.observer.observe(this.el, {
          childList: true
        });
      }
    };

    Odometer.prototype.stopWatchingMutations = function() {
      var _ref;
      return (_ref = this.observer) != null ? _ref.disconnect() : void 0;
    };

    Odometer.prototype.cleanValue = function(val) {
      var _ref;
      if (typeof val === 'string') {
        val = val.replace((_ref = this.format.radix) != null ? _ref : '.', '<radix>');
        val = val.replace(/[.,]/g, '');
        val = val.replace('<radix>', '.');
        val = parseFloat(val, 10) || 0;
      }
      return round(val, this.format.precision);
    };

    Odometer.prototype.bindTransitionEnd = function() {
      var event, renderEnqueued, _i, _len, _ref, _results,
        _this = this;
      if (this.transitionEndBound) {
        return;
      }
      this.transitionEndBound = true;
      renderEnqueued = false;
      _ref = TRANSITION_END_EVENTS.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push(this.el.addEventListener(event, function() {
          if (renderEnqueued) {
            return true;
          }
          renderEnqueued = true;
          setTimeout(function() {
            _this.render();
            renderEnqueued = false;
            return trigger(_this.el, 'odometerdone');
          }, 0);
          return true;
        }, false));
      }
      return _results;
    };

    Odometer.prototype.resetFormat = function() {
      var format, fractional, parsed, precision, radix, repeating, _ref, _ref1;
      format = (_ref = this.options.format) != null ? _ref : DIGIT_FORMAT;
      format || (format = 'd');
      parsed = FORMAT_PARSER.exec(format);
      if (!parsed) {
        throw new Error("Odometer: Unparsable digit format");
      }
      _ref1 = parsed.slice(1, 4), repeating = _ref1[0], radix = _ref1[1], fractional = _ref1[2];
      precision = (fractional != null ? fractional.length : void 0) || 0;
      return this.format = {
        repeating: repeating,
        radix: radix,
        precision: precision
      };
    };

    Odometer.prototype.render = function(value) {
      var classes, cls, match, newClasses, theme, _i, _len;
      if (value == null) {
        value = this.value;
      }
      this.stopWatchingMutations();
      this.resetFormat();
      this.inside.textContent = '';
      theme = this.options.theme;
      classes = this.el.className.split(' ');
      newClasses = [];
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        cls = classes[_i];
        if (!cls.length) {
          continue;
        }
        if (match = /^odometer-theme-(.+)$/.exec(cls)) {
          theme = match[1];
          continue;
        }
        if (/^odometer(-|$)/.test(cls)) {
          continue;
        }
        newClasses.push(cls);
      }
      newClasses.push('odometer');
      if (!TRANSITION_SUPPORT) {
        newClasses.push('odometer-no-transitions');
      }
      if (theme) {
        newClasses.push("odometer-theme-" + theme);
      } else {
        newClasses.push("odometer-auto-theme");
      }
      this.el.className = newClasses.join(' ');
      this.ribbons = {};
      this.formatDigits(value);
      return this.startWatchingMutations();
    };

    Odometer.prototype.formatDigits = function(value) {
      var digit, valueDigit, valueString, wholePart, _i, _j, _len, _len1, _ref, _ref1;
      this.digits = [];
      if (this.options.formatFunction) {
        valueString = this.options.formatFunction(value);
        _ref = valueString.split('').reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          valueDigit = _ref[_i];
          if (valueDigit.match(/0-9/)) {
            digit = this.renderDigit();
            digit.querySelector('.odometer-value').textContent = valueDigit;
            this.digits.push(digit);
            this.insertDigit(digit);
          } else {
            this.addSpacer(valueDigit);
          }
        }
      } else {
        wholePart = !this.format.precision || !fractionalPart(value) || false;
        _ref1 = value.toString().split('').reverse();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          digit = _ref1[_j];
          if (digit === '.') {
            wholePart = true;
          }
          this.addDigit(digit, wholePart);
        }
      }
    };

    Odometer.prototype.update = function(newValue) {
      var diff,
        _this = this;
      newValue = this.cleanValue(newValue);
      if (!(diff = newValue - this.value)) {
        return;
      }
      removeClass(this.el, 'odometer-animating-up odometer-animating-down odometer-animating');
      if (diff > 0) {
        addClass(this.el, 'odometer-animating-up');
      } else {
        addClass(this.el, 'odometer-animating-down');
      }
      this.stopWatchingMutations();
      this.animate(newValue);
      this.startWatchingMutations();
      setTimeout(function() {
        _this.el.offsetHeight;
        return addClass(_this.el, 'odometer-animating');
      }, 0);
      return this.value = newValue;
    };

    Odometer.prototype.renderDigit = function() {
      return createFromHTML(DIGIT_HTML);
    };

    Odometer.prototype.insertDigit = function(digit, before) {
      if (before != null) {
        return this.inside.insertBefore(digit, before);
      } else if (!this.inside.children.length) {
        return this.inside.appendChild(digit);
      } else {
        return this.inside.insertBefore(digit, this.inside.children[0]);
      }
    };

    Odometer.prototype.addSpacer = function(chr, before, extraClasses) {
      var spacer;
      spacer = createFromHTML(FORMAT_MARK_HTML);
      spacer.textContent = chr;
      if (extraClasses) {
        addClass(spacer, extraClasses);
      }
      return this.insertDigit(spacer, before);
    };

    Odometer.prototype.addDigit = function(value, repeating) {
      var chr, digit, resetted, _ref;
      if (repeating == null) {
        repeating = true;
      }
      if (value === '-') {
        return this.addSpacer(value, null, 'odometer-negation-mark');
      }
      if (value === '.') {
        return this.addSpacer((_ref = this.format.radix) != null ? _ref : '.', null, 'odometer-radix-mark');
      }
      if (repeating) {
        resetted = false;
        while (true) {
          if (!this.format.repeating.length) {
            if (resetted) {
              throw new Error("Bad odometer format without digits");
            }
            this.resetFormat();
            resetted = true;
          }
          chr = this.format.repeating[this.format.repeating.length - 1];
          this.format.repeating = this.format.repeating.substring(0, this.format.repeating.length - 1);
          if (chr === 'd') {
            break;
          }
          this.addSpacer(chr);
        }
      }
      digit = this.renderDigit();
      digit.querySelector('.odometer-value').textContent = value;
      this.digits.push(digit);
      return this.insertDigit(digit);
    };

    Odometer.prototype.animate = function(newValue) {
      if (!TRANSITION_SUPPORT || this.options.animation === 'count') {
        return this.animateCount(newValue);
      } else {
        return this.animateSlide(newValue);
      }
    };

    Odometer.prototype.animateCount = function(newValue) {
      var cur, diff, last, start, tick,
        _this = this;
      if (!(diff = +newValue - this.value)) {
        return;
      }
      start = last = now();
      cur = this.value;
      return (tick = function() {
        var delta, dist, fraction;
        if ((now() - start) > _this.options.duration) {
          _this.value = newValue;
          _this.render();
          trigger(_this.el, 'odometerdone');
          return;
        }
        delta = now() - last;
        if (delta > COUNT_MS_PER_FRAME) {
          last = now();
          fraction = delta / _this.options.duration;
          dist = diff * fraction;
          cur += dist;
          _this.render(Math.round(cur));
        }
        if (requestAnimationFrame != null) {
          return requestAnimationFrame(tick);
        } else {
          return setTimeout(tick, COUNT_MS_PER_FRAME);
        }
      })();
    };

    Odometer.prototype.getDigitCount = function() {
      var i, max, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        values[i] = Math.abs(value);
      }
      max = Math.max.apply(Math, values);
      return Math.ceil(Math.log(max + 1) / Math.log(10));
    };

    Odometer.prototype.getFractionalDigitCount = function() {
      var i, parser, parts, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      parser = /^\-?\d*\.(\d*?)0*$/;
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        values[i] = value.toString();
        parts = parser.exec(values[i]);
        if (parts == null) {
          values[i] = 0;
        } else {
          values[i] = parts[1].length;
        }
      }
      return Math.max.apply(Math, values);
    };

    Odometer.prototype.resetDigits = function() {
      this.digits = [];
      this.ribbons = [];
      this.inside.textContent = '';
      return this.resetFormat();
    };

    Odometer.prototype.animateSlide = function(newValue) {
      var boosted, cur, diff, digitCount, digits, dist, end, fractionalCount, frame, frames, i, incr, j, mark, numEl, oldValue, start, _base, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _results;
      oldValue = this.value;
      fractionalCount = this.getFractionalDigitCount(oldValue, newValue);
      if (fractionalCount) {
        newValue = newValue * Math.pow(10, fractionalCount);
        oldValue = oldValue * Math.pow(10, fractionalCount);
      }
      if (!(diff = newValue - oldValue)) {
        return;
      }
      this.bindTransitionEnd();
      digitCount = this.getDigitCount(oldValue, newValue);
      digits = [];
      boosted = 0;
      for (i = _i = 0; 0 <= digitCount ? _i < digitCount : _i > digitCount; i = 0 <= digitCount ? ++_i : --_i) {
        start = truncate(oldValue / Math.pow(10, digitCount - i - 1));
        end = truncate(newValue / Math.pow(10, digitCount - i - 1));
        dist = end - start;
        if (Math.abs(dist) > this.MAX_VALUES) {
          frames = [];
          incr = dist / (this.MAX_VALUES + this.MAX_VALUES * boosted * DIGIT_SPEEDBOOST);
          cur = start;
          while ((dist > 0 && cur < end) || (dist < 0 && cur > end)) {
            frames.push(Math.round(cur));
            cur += incr;
          }
          if (frames[frames.length - 1] !== end) {
            frames.push(end);
          }
          boosted++;
        } else {
          frames = (function() {
            _results = [];
            for (var _j = start; start <= end ? _j <= end : _j >= end; start <= end ? _j++ : _j--){ _results.push(_j); }
            return _results;
          }).apply(this);
        }
        for (i = _k = 0, _len = frames.length; _k < _len; i = ++_k) {
          frame = frames[i];
          frames[i] = Math.abs(frame % 10);
        }
        digits.push(frames);
      }
      this.resetDigits();
      _ref = digits.reverse();
      for (i = _l = 0, _len1 = _ref.length; _l < _len1; i = ++_l) {
        frames = _ref[i];
        if (!this.digits[i]) {
          this.addDigit(' ', i >= fractionalCount);
        }
        if ((_base = this.ribbons)[i] == null) {
          _base[i] = this.digits[i].querySelector('.odometer-ribbon-inner');
        }
        this.ribbons[i].textContent = '';
        if (diff < 0) {
          frames = frames.reverse();
        }
        for (j = _m = 0, _len2 = frames.length; _m < _len2; j = ++_m) {
          frame = frames[j];
          numEl = document.createElement('div');
          numEl.className = 'odometer-value';
          numEl.textContent = frame;
          this.ribbons[i].appendChild(numEl);
          if (j === frames.length - 1) {
            addClass(numEl, 'odometer-last-value');
          }
          if (j === 0) {
            addClass(numEl, 'odometer-first-value');
          }
        }
      }
      if (start < 0) {
        this.addDigit('-');
      }
      mark = this.inside.querySelector('.odometer-radix-mark');
      if (mark != null) {
        mark.parent.removeChild(mark);
      }
      if (fractionalCount) {
        return this.addSpacer(this.format.radix, this.digits[fractionalCount - 1], 'odometer-radix-mark');
      }
    };

    return Odometer;

  })();

  Odometer.options = (_ref = window.odometerOptions) != null ? _ref : {};

  setTimeout(function() {
    var k, v, _base, _ref1, _results;
    if (window.odometerOptions) {
      _ref1 = window.odometerOptions;
      _results = [];
      for (k in _ref1) {
        v = _ref1[k];
        _results.push((_base = Odometer.options)[k] != null ? (_base = Odometer.options)[k] : _base[k] = v);
      }
      return _results;
    }
  }, 0);

  Odometer.init = function() {
    var el, elements, _i, _len, _ref1, _results;
    if (document.querySelectorAll == null) {
      return;
    }
    elements = document.querySelectorAll(Odometer.options.selector || '.odometer');
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      el = elements[_i];
      _results.push(el.odometer = new Odometer({
        el: el,
        value: (_ref1 = el.innerText) != null ? _ref1 : el.textContent
      }));
    }
    return _results;
  };

  if ((((_ref1 = document.documentElement) != null ? _ref1.doScroll : void 0) != null) && (document.createEventObject != null)) {
    _old = document.onreadystatechange;
    document.onreadystatechange = function() {
      if (document.readyState === 'complete' && Odometer.options.auto !== false) {
        Odometer.init();
      }
      return _old != null ? _old.apply(this, arguments) : void 0;
    };
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      if (Odometer.options.auto !== false) {
        return Odometer.init();
      }
    }, false);
  }

  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Odometer;
    });
  } else if (typeof exports !== "undefined" && exports !== null) {
    module.exports = Odometer;
  } else {
    window.Odometer = Odometer;
  }

}).call(this);

    window.Odometer.options.auto = false; // only elements we create
    window.Odometer.themeCSS = ".odometer.odometer-auto-theme, .odometer.odometer-theme-minimal {\n  display: inline-block;\n  vertical-align: middle;\n  position: relative;\n}\n.odometer.odometer-auto-theme .odometer-digit, .odometer.odometer-theme-minimal .odometer-digit {\n  display: inline-block;\n  vertical-align: middle;\n  position: relative;\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-digit-spacer, .odometer.odometer-theme-minimal .odometer-digit .odometer-digit-spacer {\n  display: inline-block;\n  vertical-align: middle;\n  visibility: hidden;\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner, .odometer.odometer-theme-minimal .odometer-digit .odometer-digit-inner {\n  text-align: left;\n  display: block;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  overflow: hidden;\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-ribbon, .odometer.odometer-theme-minimal .odometer-digit .odometer-ribbon {\n  display: block;\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-ribbon-inner, .odometer.odometer-theme-minimal .odometer-digit .odometer-ribbon-inner {\n  display: block;\n  -webkit-backface-visibility: hidden;\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-value, .odometer.odometer-theme-minimal .odometer-digit .odometer-value {\n  display: block;\n  -webkit-transform: translateZ(0);\n}\n.odometer.odometer-auto-theme .odometer-digit .odometer-value.odometer-last-value, .odometer.odometer-theme-minimal .odometer-digit .odometer-value.odometer-last-value {\n  position: absolute;\n}\n.odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-theme-minimal.odometer-animating-up .odometer-ribbon-inner {\n  -webkit-transition: -webkit-transform 2s;\n  -moz-transition: -moz-transform 2s;\n  -ms-transition: -ms-transform 2s;\n  -o-transition: -o-transform 2s;\n  transition: transform 2s;\n}\n.odometer.odometer-auto-theme.odometer-animating-up.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-minimal.odometer-animating-up.odometer-animating .odometer-ribbon-inner {\n  -webkit-transform: translateY(-100%);\n  -moz-transform: translateY(-100%);\n  -ms-transform: translateY(-100%);\n  -o-transform: translateY(-100%);\n  transform: translateY(-100%);\n}\n.odometer.odometer-auto-theme.odometer-animating-down .odometer-ribbon-inner, .odometer.odometer-theme-minimal.odometer-animating-down .odometer-ribbon-inner {\n  -webkit-transform: translateY(-100%);\n  -moz-transform: translateY(-100%);\n  -ms-transform: translateY(-100%);\n  -o-transform: translateY(-100%);\n  transform: translateY(-100%);\n}\n.odometer.odometer-auto-theme.odometer-animating-down.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-minimal.odometer-animating-down.odometer-animating .odometer-ribbon-inner {\n  -webkit-transition: -webkit-transform 2s;\n  -moz-transition: -moz-transform 2s;\n  -ms-transition: -ms-transform 2s;\n  -o-transition: -o-transform 2s;\n  transition: transform 2s;\n  -webkit-transform: translateY(0);\n  -moz-transform: translateY(0);\n  -ms-transform: translateY(0);\n  -o-transform: translateY(0);\n  transform: translateY(0);\n}\n";
}).call(globalThis);

// Shared helpers for the content script, the toolbar popup and the counter page.
// Plain script (no modules) so it also works as part of the userscript.

var RYTS = (() => {
    // Count sources, best first. NextCounts' Unabbreviated Project has the real count for
    // channels that connected YouTube Studio; everything else uses Mixerno's estimate.
    const MIXERNO = "https://backend.mixerno.space/api/youtube/estv3/";
    const NEXTCOUNTS_LIST = "https://api.nextcounts.com/api/youtube/studio/channels";
    const NEXTCOUNTS_V2 = "https://api-v2.nextcounts.com/api/youtube/channel/";
    const NEXTCOUNTS_REALTIME = (id) => `https://api.nextcounts.com/api/youtube/studio/channel/${encodeURIComponent(id)}/realtime`;
    const SOURCES = {
        nextcounts: {
            name: "NextCounts", exact: true,
            tooltip: "Real count from YouTube Studio, shared by the channel through NextCounts' Unabbreviated Project",
        },
        mixerno: { name: "Mixerno.space", exact: false, tooltip: "Estimated by Mixerno.space" },
    };
    const API = MIXERNO; // kept for older callers
    const SOURCE = SOURCES.mixerno.name;

    // Extension storage when running as an extension, localStorage in the userscript.
    const ext = globalThis.browser?.storage?.local ? globalThis.browser
        : globalThis.chrome?.storage?.local ? globalThis.chrome : null;

    const store = {
        async get(key, fallback) {
            try {
                if (ext) return (await ext.storage.local.get(key))[key] ?? fallback;
                const raw = localStorage.getItem("ryts:" + key);
                return raw ? JSON.parse(raw) : fallback;
            } catch {
                return fallback;
            }
        },
        async set(key, value) {
            try {
                if (ext) await ext.storage.local.set({ [key]: value });
                else localStorage.setItem("ryts:" + key, JSON.stringify(value));
            } catch { /* storage full or blocked: features degrade, counts still show */ }
        },
        onChange(key, callback) {
            ext?.storage?.onChanged?.addListener((changes, area) => {
                if (area === "local" && changes[key]) callback(changes[key].newValue);
            });
        },
    };

    // ---------- settings ----------

    const DEFAULT_SETTINGS = { format: "exact" };
    const getSettings = async () => ({ ...DEFAULT_SETTINGS, ...(await store.get("settings", {})) });
    const setSettings = async (patch) => store.set("settings", { ...(await getSettings()), ...patch });
    const onSettings = (callback) => store.onChange("settings", (s) => callback({ ...DEFAULT_SETTINGS, ...s }));

    // ---------- formatting ----------

    const exactFormat = new Intl.NumberFormat("en-US");
    // One more significant figure than YouTube's three: 452.3M, 1.284M, 34.01K.
    const compactFormat = new Intl.NumberFormat("en-US", {
        notation: "compact", maximumSignificantDigits: 4, roundingMode: "trunc",
    });
    const format = (n, mode = "exact") => (mode === "compact" && n >= 1000 ? compactFormat : exactFormat).format(n);
    const exact = (n) => exactFormat.format(n);
    const time = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    // ---------- counts ----------

    const cache = new Map(); // id -> { count, source, at, promise }
    const CACHE_MS = 60_000;
    const getJSON = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
    const toCount = (v) => {
        const n = typeof v === "number" ? v : parseInt(v, 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
    };

    // Channels in the Unabbreviated Project. Loaded at most once an hour, so lists of
    // channels (search, featured) never send NextCounts one request per channel.
    const LIST_MS = 60 * 60_000, LIST_RETRY_MS = 10 * 60_000;
    let studio = null; // { ids: Set | null, at }
    let studioLoading = null;
    async function studioChannels() {
        if (studio && Date.now() - studio.at < (studio.ids ? LIST_MS : LIST_RETRY_MS)) return studio.ids;
        if (!studioLoading) {
            studioLoading = (async () => {
                const saved = await store.get("nextcountsStudio", null);
                if (saved && Date.now() - saved.at < LIST_MS) return { ids: new Set(saved.ids), at: saved.at };
                try {
                    const body = await getJSON(NEXTCOUNTS_LIST);
                    const ids = (Array.isArray(body?.data) ? body.data : []).map((c) => c?.id).filter((id) => /^UC[\w-]{22}$/.test(id || ""));
                    if (!ids.length) throw new Error("empty list");
                    await store.set("nextcountsStudio", { ids, at: Date.now() });
                    return { ids: new Set(ids), at: Date.now() };
                } catch {
                    return { ids: null, at: Date.now() }; // unknown: try again in 10 minutes
                }
            })().finally(() => { studioLoading = null; });
        }
        studio = await studioLoading;
        return studio.ids;
    }

    // The verified Studio count, or null when the channel isn't in the project.
    async function nextcountsCount(id) {
        try {
            const v2 = await getJSON(NEXTCOUNTS_V2 + encodeURIComponent(id));
            if (v2?.verifiedSubCount === false) return null;
            if (v2?.verifiedSubCount === true && toCount(v2.subcount) !== null) return toCount(v2.subcount);
        } catch { /* fall through to the older endpoint */ }
        try {
            const old = await getJSON(NEXTCOUNTS_REALTIME(id));
            return old?.success === true ? toCount(old.data?.subscribers) : null;
        } catch {
            return null;
        }
    }

    async function mixernoCount(id) {
        try {
            return toCount((await getJSON(MIXERNO + encodeURIComponent(id)))?.items?.[0]?.statistics?.subscriberCount);
        } catch {
            return null;
        }
    }

    // `bulk` marks lookups for lists of channels: those only ask NextCounts when the
    // participant list confirms the channel is in the project.
    async function lookup(id, bulk) {
        const ids = await studioChannels();
        if (ids ? ids.has(id) : !bulk) {
            const count = await nextcountsCount(id);
            if (count !== null) return { count, source: "nextcounts" };
        }
        const count = await mixernoCount(id);
        return count === null ? null : { count, source: "mixerno" };
    }

    async function fetchCount(id, { fresh = false, bulk = false } = {}) {
        const hit = cache.get(id);
        if (hit?.promise) return hit.promise;
        if (!fresh && hit?.at && Date.now() - hit.at < CACHE_MS) return hit.count;
        const promise = lookup(id, bulk).then((result) => {
            if (result) cache.set(id, { ...result, at: Date.now() });
            else cache.delete(id);
            return result?.count ?? null;
        });
        cache.set(id, { ...hit, promise });
        return promise;
    }

    // Which source the latest count for `id` came from: SOURCES.nextcounts or SOURCES.mixerno.
    const sourceOf = (id) => SOURCES[cache.get(id)?.source] || SOURCES.mixerno;

    const updatedAt = (id) => cache.get(id)?.at ?? Date.now();

    // ---------- history (local only; powers growth, projections and the popup) ----------

    const MAX_POINTS = 240;
    const MIN_GAP_MS = 5 * 60_000;
    let historyWrite = Promise.resolve();

    function observe(id, count, meta = {}) {
        historyWrite = historyWrite.then(async () => {
            const history = await store.get("history", {});
            const entry = history[id] || { points: [] };
            if (meta.name) entry.name = meta.name;
            if (meta.handle) entry.handle = meta.handle;
            const now = Date.now();
            const last = entry.points[entry.points.length - 1];
            // Keep one point per five minutes; within that window just update the latest value.
            if (last && now - last[0] < MIN_GAP_MS && entry.points.length > 1) entry.points[entry.points.length - 1] = [now, count];
            else entry.points.push([now, count]);
            entry.points = entry.points.slice(-MAX_POINTS);
            entry.seen = now;
            history[id] = entry;
            await store.set("history", history);
        });
        return historyWrite;
    }

    const getHistory = () => store.get("history", {});

    // Subscribers per day across the stored points; needs at least 30 minutes of data.
    function growthPerDay(points = []) {
        if (points.length < 2) return null;
        const [t0, c0] = points[0];
        const [t1, c1] = points[points.length - 1];
        const days = (t1 - t0) / 86_400_000;
        return days >= 1 / 48 ? (c1 - c0) / days : null;
    }

    // Next "round" milestone two significant figures up: 34,010 -> 35,000; 452,318,906 -> 460,000,000.
    function nextMilestone(n) {
        const step = 10 ** Math.max(2, String(Math.floor(n)).length - 2);
        return (Math.floor(n / step) + 1) * step;
    }

    // ---------- digit roll (HubSpot's Odometer, bundled as odometer.js) ----------

    // Renders `text` into `el` with the leading number as an Odometer, so a new count rolls
    // from the old one. The rest of the text ("subscribers", "M") stays plain. A visually
    // hidden copy is what screen readers read and what gets copied.
    const canRoll = () => typeof Odometer === "function";
    const ODO_CSS = `
        .ryts-roll { white-space: pre; font-variant-numeric: tabular-nums; }
        .ryts-roll .odometer.odometer-auto-theme { vertical-align: top; line-height: inherit; }
        .ryts-roll .odometer .odometer-digit { vertical-align: top; }
        .ryts-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
        @media (prefers-reduced-motion: reduce) { .ryts-roll .odometer .odometer-ribbon-inner { transition: none !important; } }`;
    // Odometer's theme plus the rules above, added once to the document `el` belongs to.
    function rollStyles(doc) {
        if (doc.__rytsOdometerCss) return;
        doc.__rytsOdometerCss = true;
        const style = doc.createElement("style");
        style.textContent = Odometer.themeCSS + ODO_CSS;
        (doc.head || doc.documentElement).append(style);
    }
    const NUMBER = /^(\d{1,3}(?:,\d{3})*)([^]*)$/; // "452,318,906 subscribers", "452.3M subscribers"
    const reduceMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    function roll(el, text, prevText = "", animate = false) {
        const m = text.match(NUMBER);
        if (!m) return void (el.textContent = text);
        rollStyles(el.ownerDocument);
        const value = +m[1].replaceAll(",", "");
        let wrap = el.querySelector(":scope > .ryts-roll");
        const od = wrap?.__odometer;
        if (od && animate && !reduceMotion()) {
            od.update(value);
            wrap.lastChild.data = m[2];
        } else {
            wrap = document.createElement("span");
            wrap.className = "ryts-roll";
            wrap.setAttribute("aria-hidden", "true");
            const odo = document.createElement("span");
            wrap.append(odo, m[2]);
            wrap.__odometer = new Odometer({ el: odo, value, format: "(,ddd)" });
            const sr = document.createElement("span");
            sr.className = "ryts-sr";
            el.replaceChildren(wrap, sr);
        }
        el.querySelector(":scope > .ryts-sr").textContent = text;
    }

    // ---------- extension pages ----------

    const pageUrl = (page, params) => {
        const getURL = (globalThis.browser || globalThis.chrome)?.runtime?.getURL;
        if (!getURL || !ext) return null; // userscript: no extension pages
        return getURL(page) + "?" + new URLSearchParams(params);
    };

    return {
        API, SOURCE, SOURCES, store, getSettings, setSettings, onSettings,
        format, exact, time, canRoll, roll, fetchCount, sourceOf, updatedAt, observe, getHistory, growthPerDay, nextMilestone, pageUrl,
    };
})();

// Return YouTube Subscribers content script. Needs shared.js loaded first.

(() => {
    const R = RYTS;
    const SEL = {
        owner: "#owner-sub-count",
        header: "#page-header > yt-page-header-renderer > yt-page-header-view-model > div > div.ytPageHeaderViewModelHeadline > div > yt-content-metadata-view-model > div:nth-child(3) > span:nth-child(1)",
        headerRoot: "#page-header",
        about: "#additional-info-container > table > tbody > tr:nth-child(6) > td:nth-child(2)",
        channelRenderer: "ytd-channel-renderer",
    };
    const ROUNDED = /^\s*[\d.,]+\s*[KMB]?\s+subscribers?\s*$/i;
    const CHANNEL_HREF = /\/(?:channel\/(UC[\w-]{22})|(@[^/?#]+))/;
    const LIVE_REFRESH_MS = 10_000;
    const log = (...a) => console.log("[RYTS]", ...a);

    let settings = { format: "exact" };
    let page = null; // { url, id, name, handle, count, live }
    const states = new Map(); // element -> { id, count, rounded, at, roll, live, prevText }

    // ---------- styles (YouTube's own colour variables, so light/dark/ambient all match) ----------

    const style = document.createElement("style");
    style.textContent = `
        .ryts-live::before { content: ""; display: inline-block; width: .5em; height: .5em; margin-right: .4em; border-radius: 50%;
            background: #ff0033; vertical-align: .1em; animation: ryts-pulse 1.6s ease-in-out infinite; }
        @keyframes ryts-pulse { 50% { opacity: .35; } }
        .ryts-open { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; margin-left: 6px;
            border-radius: 50%; vertical-align: middle; color: var(--yt-spec-text-secondary, #606060); text-decoration: none; }
        .ryts-open:hover { background: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, .1)); color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-open svg { width: 16px; height: 16px; fill: currentColor; }
        .ryts-chip { font: 500 14px/36px Roboto, Arial, sans-serif; height: 36px; padding: 0 16px; border: 0; border-radius: 18px;
            cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            color: var(--yt-spec-text-primary, #0f0f0f); background: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, .05)); }
        .ryts-chip:hover { background: var(--yt-spec-button-chip-background-hover, rgba(0, 0, 0, .1)); }
        .ryts-chip[aria-pressed="true"] { color: var(--yt-spec-text-primary-inverse, #fff); background: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-chip:focus-visible, .ryts-open:focus-visible { outline: 2px solid var(--yt-spec-call-to-action, #065fd4); outline-offset: 2px; }
        .ryts-bar { display: flex; align-items: center; gap: 12px; margin: 12px 0 4px; font: 400 12px/18px Roboto, Arial, sans-serif;
            color: var(--yt-spec-text-secondary, #606060); }
        .ryts-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 32px; margin: 16px 0 8px; padding: 16px 20px;
            border-radius: 12px; font: 400 14px/20px Roboto, Arial, sans-serif; color: var(--yt-spec-text-secondary, #606060);
            background: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, .05)); }
        .ryts-panel b { display: block; font-size: 16px; line-height: 22px; font-weight: 500; color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-panel strong { display: block; font-size: 20px; line-height: 28px; font-weight: 700; color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-panel .ryts-chip:first-of-type { margin-left: auto; }
        .ryts-tip { position: fixed; z-index: 9999; max-width: 280px; padding: 8px 10px; border-radius: 4px; pointer-events: none;
            font: 400 12px/16px Roboto, Arial, sans-serif; color: #fff; background: rgba(97, 97, 97, .95); }
        @media (prefers-reduced-motion: reduce) { .ryts-live::before { animation: none; } }
    `;
    // Added in start(): at document-start (userscripts) <html> may not exist yet.

    // Tiny DOM builder: h("div", { className: "x" }, child, "text", ...)
    const h = (tag, props = {}, ...children) => {
        const el = Object.assign(document.createElement(tag), props);
        el.append(...children.filter((c) => c != null));
        return el;
    };

    // ---------- rendering ----------

    const label = (s) => R.format(s.count, settings.format) + " subscribers";
    const tooltip = (s) =>
        `${R.sourceOf(s.id).tooltip}, updated ${R.time(s.at)}.` +
        (s.rounded ? ` YouTube shows ${s.rounded.trim()}.` : "") +
        (s.live ? " Live: refreshes every 10 seconds." : "");

    function paint(el, s, animate = false) {
        const text = label(s);
        el.dataset.rytsTip = tooltip(s);
        el.setAttribute("aria-description", el.dataset.rytsTip);
        el.classList.toggle("ryts-live", !!s.live);
        el.dataset.rytsValue = text;
        el.removeAttribute("is-empty");
        if (s.roll && R.canRoll()) R.roll(el, text, s.prevText, animate);
        else if (el.textContent !== text) el.textContent = text;
        s.prevText = text;
    }

    function intact(el, s) {
        if (el.dataset.rytsValue !== label(s)) return false;
        return s.roll && R.canRoll() ? !!el.querySelector(":scope > .ryts-roll") : el.textContent === label(s);
    }

    // Shows a count in `el` and keeps it there when YouTube re-renders the element.
    function show(el, s) {
        const old = states.get(el);
        const state = { rounded: old?.rounded ?? el.textContent, prevText: old?.prevText, ...s, at: R.updatedAt(s.id) };
        states.set(el, state);
        paint(el, state, !!old && old.count !== state.count);
        if (!el.__rytsObserver) {
            el.__rytsObserver = new MutationObserver(() => {
                const st = states.get(el);
                if (st && !intact(el, st)) paint(el, st);
            });
            el.__rytsObserver.observe(el, { childList: true, characterData: true, subtree: true });
        }
        return state;
    }

    function forget(el) {
        el.__rytsObserver?.disconnect();
        delete el.__rytsObserver;
        states.delete(el);
    }

    // One tooltip, styled like YouTube's, explaining where a count comes from.
    const tip = h("div", { className: "ryts-tip", hidden: true });
    tip.setAttribute("role", "tooltip");
    document.addEventListener("mouseover", (e) => {
        const el = e.target instanceof Element && e.target.closest("[data-ryts-tip]");
        if (!el) return void (tip.hidden = true);
        if (!tip.isConnected) document.documentElement.append(tip);
        tip.textContent = el.dataset.rytsTip;
        tip.hidden = false;
        const box = el.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(box.left, innerWidth - tip.offsetWidth - 8)) + "px";
        tip.style.top = (box.bottom + 8 + tip.offsetHeight > innerHeight ? box.top - tip.offsetHeight - 8 : box.bottom + 8) + "px";
    }, { passive: true });

    // ---------- channel IDs ----------

    const idByUrl = new Map();

    function extractChannelId(html) {
        const external = html.match(/"externalId":"(.*?)"/)?.[1];
        const browse = html.match(/"browse_id":"(.*?)"/)?.[1];
        const channel = html.match(/"channelId":"(.*?)"/)?.[1];
        return external || browse || channel || null;
    }

    function idForUrl(url) {
        if (!idByUrl.has(url)) {
            idByUrl.set(url, fetch(url, { credentials: "include" })
                .then((r) => r.text())
                .then(extractChannelId)
                .catch(() => null));
        }
        return idByUrl.get(url);
    }

    async function idForHref(href) {
        const m = href?.match(CHANNEL_HREF);
        if (!m) return null;
        if (m[1]) return m[1];
        return idForUrl("https://www.youtube.com/" + m[2]);
    }

    // At most four lookups at a time for lists (search results, featured channels).
    let active = 0;
    const waiting = [];
    function limited(task) {
        return new Promise((resolve) => {
            const run = async () => {
                active++;
                try { resolve(await task()); } catch { resolve(null); } finally {
                    active--;
                    waiting.shift()?.();
                }
            };
            active < 4 ? run() : waiting.push(run);
        });
    }

    // ---------- channel and watch pages ----------

    const waitFor = (find, ms = 15000) => new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            const el = find();
            if (el || Date.now() - start > ms) resolve(el || null);
            else setTimeout(tick, 150);
        };
        tick();
    });

    function pageMeta(isChannel) {
        if (isChannel) {
            const name = document.querySelector(`${SEL.headerRoot} h1`)?.textContent.trim();
            return { name, handle: location.pathname.match(/@[^/]+/)?.[0] };
        }
        const link = document.querySelector("#owner #channel-name a, ytd-video-owner-renderer #channel-name a");
        return { name: link?.textContent.trim(), handle: decodeURIComponent(link?.getAttribute("href")?.match(/@[^/?#]+/)?.[0] || "") || undefined };
    }

    async function handlePage() {
        const url = location.href;
        stopLive();
        for (const el of [...states.keys()]) if (!el.closest(SEL.channelRenderer)) forget(el);
        document.querySelectorAll(".ryts-panel, .ryts-open").forEach((n) => n.remove());
        page = null;
        if (!/\/(channel\/|c\/|user\/|watch\?|@)/.test(url)) return;

        // YouTube keeps the previous page in the DOM, hidden, after in-app navigation, so only
        // count elements that are on screen, and only the kind this URL shows: a channel
        // header from a channel page visited earlier must not stand in for a video's owner count.
        const shown = (sel) => [...document.querySelectorAll(sel)].find((el) => el.getClientRects().length) || null;
        const kind = /\/watch\?/.test(url) ? "watch" : /\/live(?:[/?#]|$)/.test(url) ? "live" : "channel";
        const target = await waitFor(() => kind === "channel" ? shown(SEL.header)
            : kind === "watch" ? shown(SEL.owner) : shown(SEL.owner) || shown(SEL.header));
        if (!target || url !== location.href) return;
        const isChannel = target.matches(SEL.header);
        const id = await idForUrl(url);
        if (!id || url !== location.href) return;
        const count = await R.fetchCount(id);
        if (count === null || url !== location.href) return;

        page = { url, id, count, isChannel, ...pageMeta(isChannel) };
        log(isChannel ? "Channel page" : "Watch page", id, count);
        R.observe(id, count, page);
        show(target, { id, count, roll: true });
        if (isChannel) {
            addCounterLink(target); // inline in the header's stats row; watch pages have no inline spot
            ownChannelPanel();
        } else startLiveIfLive(target);
        decorate();
    }

    function addCounterLink(el) {
        const href = page && R.pageUrl("counter.html", { c: page.id, n: page.name || page.handle || "" });
        if (!href || el.nextElementSibling?.classList.contains("ryts-open")) return;
        const a = document.createElement("a");
        a.className = "ryts-open";
        a.href = href;
        a.target = "_blank";
        a.title = "Open the live counter";
        a.setAttribute("aria-label", "Open the live counter");
        const NS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", "M5 5h6v2H7v4H5V5zm8 0h6v6h-2V7h-4V5zM5 13h2v4h4v2H5v-6zm12 0h2v6h-6v-2h4v-4z");
        svg.append(path);
        a.append(svg);
        el.after(a);
    }

    // ---------- live streams: refresh the count while the stream is on ----------

    let liveTimer = null;
    const isLive = () =>
        !!document.querySelector("#movie_player.ytp-live, .html5-video-player.ytp-live") ||
        (!!document.querySelector('meta[itemprop="isLiveBroadcast"][content="True"]') && !document.querySelector('meta[itemprop="endDate"]'));

    function startLiveIfLive(el) {
        if (!isLive()) return;
        const url = location.href;
        const s = states.get(el);
        s.live = true;
        paint(el, s);
        liveTimer = setInterval(async () => {
            if (location.href !== url || !page) return stopLive();
            const count = await R.fetchCount(page.id, { fresh: true });
            if (count === null || location.href !== url) return;
            page.count = count;
            R.observe(page.id, count, page);
            show(el, { id: page.id, count, roll: true, live: true });
        }, LIVE_REFRESH_MS);
    }

    function stopLive() {
        clearInterval(liveTimer);
        liveTimer = null;
    }

    // ---------- your own channel: milestone panel ----------

    async function ownChannelPanel() {
        const root = document.querySelector(SEL.headerRoot);
        if (!page?.isChannel || !root || !root.querySelector('a[href*="studio.youtube.com"]')) return;
        const history = (await R.getHistory())[page.id];
        const perDay = R.growthPerDay(history?.points);
        const goal = R.nextMilestone(page.count);
        const togo = goal - page.count;
        const eta = perDay > 0 ? new Date(Date.now() + (togo / perDay) * 86_400_000) : null;
        if (!page?.isChannel || document.querySelector(".ryts-panel")) return;

        const panel = document.createElement("section");
        panel.className = "ryts-panel";
        panel.setAttribute("aria-label", "Your channel");
        const cell = (big, small) => h("div", {}, h("strong", { textContent: big }), small);
        const verified = R.sourceOf(page.id).exact;
        panel.append(h("div", {}, h("b", { textContent: verified ? "Your channel: real Studio count" : "Your channel" }), `Next milestone: ${R.exact(goal)}`), cell(R.exact(togo), "to go"));
        if (perDay !== null) {
            panel.append(
                cell(`${perDay >= 0 ? "+" : "−"}${R.exact(Math.round(Math.abs(perDay)))}`, "per day, recently"),
                cell(eta ? eta.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Not growing", "projected milestone date"),
            );
        } else {
            panel.append(h("div", { textContent: "Growth and a projected date appear after you've visited a few times." }));
        }
        if (!verified) {
            // Not in the Unabbreviated Project yet: viewers see an estimate. Offer the real thing.
            panel.append(h("a", {
                className: "ryts-chip", href: "https://nextcounts.com/unabbreviate/", target: "_blank", rel: "noopener",
                textContent: "Show your exact count",
                title: "Viewers see an estimate. Connect YouTube Studio through NextCounts' Unabbreviated Project to show your real count.",
            }));
        }
        const href = R.pageUrl("counter.html", { c: page.id, n: page.name || "" });
        if (href) {
            const open = document.createElement("a");
            Object.assign(open, { className: "ryts-chip", href, target: "_blank", textContent: "Open live counter" });
            panel.append(open);
        }
        root.after(panel);
    }

    // ---------- lists: search results, featured channels, About dialog ----------

    function decorate() {
        // Search results (existing behaviour: the count lives in #video-count).
        if (location.href.includes("/results?")) {
            for (const renderer of document.querySelectorAll(SEL.channelRenderer)) {
                const target = renderer.querySelector("#video-count");
                const href = renderer.querySelector("#main-link")?.href;
                if (!target || !href || renderer.__ryts) continue;
                renderer.__ryts = limited(async () => {
                    const id = await idForHref(href);
                    const count = id && await R.fetchCount(id, { bulk: true });
                    if (count == null) return null;
                    R.observe(id, count, { name: renderer.querySelector("#channel-title #text, #text")?.textContent.trim(), handle: href.match(/@[^/?#]+/)?.[0] });
                    show(target, { id, count });
                    renderer.dataset.rytsCount = count;
                    return count;
                });
            }
            sortButton();
        }

        // Featured channels and channel lists: any "123K subscribers" text near a channel link.
        const walker = document.createTreeWalker(document.querySelector("ytd-page-manager") || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (ROUNDED.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
        });
        const found = [];
        while (walker.nextNode()) found.push(walker.currentNode.parentElement);
        for (const el of found) {
            if (!el || el.__ryts || states.has(el) || el.matches(SEL.owner) || el.closest(`${SEL.channelRenderer}, ${SEL.headerRoot}, #owner`)) continue;
            const card = el.closest("ytd-grid-channel-renderer, ytd-mini-channel-renderer, ytd-channel-renderer, yt-lockup-view-model, ytd-rich-item-renderer")
                || el.parentElement?.closest(":has(a[href*='/@'], a[href*='/channel/UC'])");
            const href = card?.querySelector("a[href*='/@'], a[href*='/channel/UC']")?.getAttribute("href");
            if (!href) continue;
            el.__ryts = limited(async () => {
                const id = await idForHref(href);
                const count = id && await R.fetchCount(id, { bulk: true });
                if (count == null) return;
                show(el, { id, count });
            });
        }

        // The About dialog's table row.
        const about = page?.isChannel && document.querySelector(SEL.about);
        if (about && !states.has(about)) show(about, { id: page.id, count: page.count });
    }

    function sortButton() {
        const renderers = [...document.querySelectorAll(SEL.channelRenderer)];
        if (renderers.length < 2 || document.querySelector(".ryts-bar")) return;
        const bar = document.createElement("div");
        bar.className = "ryts-bar";
        const button = h("button", { type: "button", className: "ryts-chip", textContent: "Sort channels by subscribers" });
        button.setAttribute("aria-pressed", "false");
        bar.append(button, h("span", { textContent: "Exact counts by Return YouTube Subscribers" }));
        renderers[0].before(bar);
        button.addEventListener("click", async () => {
            button.textContent = "Sorting…";
            const list = [...document.querySelectorAll(SEL.channelRenderer)];
            await Promise.all(list.map((r) => r.__ryts));
            const marker = document.createComment("ryts");
            bar.after(marker);
            list.sort((a, b) => (+b.dataset.rytsCount || 0) - (+a.dataset.rytsCount || 0))
                .forEach((r) => marker.before(r));
            marker.remove();
            button.textContent = "Sorted by subscribers";
            button.setAttribute("aria-pressed", "true");
        });
    }

    // ---------- wiring ----------

    let scheduled = null;
    const pageObserver = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = setTimeout(() => {
            scheduled = null;
            decorate();
        }, 400);
    });

    let lastUrl = null;
    const onNavigate = () => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        log("URL changed:", lastUrl);
        handlePage();
        decorate();
    };
    document.addEventListener("yt-navigate-finish", onNavigate);
    setInterval(() => document.body && onNavigate(), 1000); // fallback if YouTube renames its navigation event

    R.getSettings().then((s) => { settings = s; });
    R.onSettings((s) => {
        settings = s;
        for (const [el, st] of states) paint(el, st);
    });

    const start = () => {
        (document.head || document.documentElement).append(style);
        pageObserver.observe(document.documentElement, { childList: true, subtree: true });
        onNavigate();
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();
})();

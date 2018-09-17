!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.reactMixin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var mixin = require('smart-mixin');
var assign = require('object-assign');

var mixinProto = mixin({
  // lifecycle stuff is as you'd expect
  componentDidMount: mixin.MANY,
  componentWillMount: mixin.MANY,
  componentWillReceiveProps: mixin.MANY,
  shouldComponentUpdate: mixin.ONCE,
  componentWillUpdate: mixin.MANY,
  componentDidUpdate: mixin.MANY,
  componentWillUnmount: mixin.MANY,
  getChildContext: mixin.MANY_MERGED
});

function setDefaultProps(reactMixin) {
  var getDefaultProps = reactMixin.getDefaultProps;

  if (getDefaultProps) {
    reactMixin.defaultProps = getDefaultProps();

    delete reactMixin.getDefaultProps;
  }
}

function setInitialState(reactMixin) {
  var getInitialState = reactMixin.getInitialState;
  var componentWillMount = reactMixin.componentWillMount;

  function applyInitialState(instance) {
    var state = instance.state || {};
    assign(state, getInitialState.call(instance));
    instance.state = state;
  }

  if (getInitialState) {
    if (!componentWillMount) {
      reactMixin.componentWillMount = function() {
        applyInitialState(this);
      };
    } else {
      reactMixin.componentWillMount = function() {
        applyInitialState(this);
        componentWillMount.call(this);
      };
    }

    delete reactMixin.getInitialState;
  }
}

function mixinClass(reactClass, reactMixin) {
  setDefaultProps(reactMixin);
  setInitialState(reactMixin);

  var prototypeMethods = {};
  var staticProps = {};

  Object.keys(reactMixin).forEach(function(key) {
    if (key === 'mixins') {
      return; // Handled below to ensure proper order regardless of property iteration order
    }
    if (key === 'statics') {
      return; // gets special handling
    } else if (typeof reactMixin[key] === 'function') {
      prototypeMethods[key] = reactMixin[key];
    } else {
      staticProps[key] = reactMixin[key];
    }
  });

  mixinProto(reactClass.prototype, prototypeMethods);

  var mergePropTypes = function(left, right, key) {
    if (!left) return right;
    if (!right) return left;

    var result = {};
    Object.keys(left).forEach(function(leftKey) {
      if (!right[leftKey]) {
        result[leftKey] = left[leftKey];
      }
    });

    Object.keys(right).forEach(function(rightKey) {
      if (left[rightKey]) {
        result[rightKey] = function checkBothContextTypes() {
          return right[rightKey].apply(this, arguments) && left[rightKey].apply(this, arguments);
        };
      } else {
        result[rightKey] = right[rightKey];
      }
    });

    return result;
  };

  mixin({
    childContextTypes: mergePropTypes,
    contextTypes: mergePropTypes,
    propTypes: mixin.MANY_MERGED_LOOSE,
    defaultProps: mixin.MANY_MERGED_LOOSE
  })(reactClass, staticProps);

  // statics is a special case because it merges directly onto the class
  if (reactMixin.statics) {
    Object.getOwnPropertyNames(reactMixin.statics).forEach(function(key) {
      var left = reactClass[key];
      var right = reactMixin.statics[key];

      if (left !== undefined && right !== undefined) {
        throw new TypeError('Cannot mixin statics because statics.' + key + ' and Component.' + key + ' are defined.');
      }

      reactClass[key] = left !== undefined ? left : right;
    });
  }

  // If more mixins are defined, they need to run. This emulate's react's behavior.
  // See behavior in code at:
  // https://github.com/facebook/react/blob/41aa3496aa632634f650edbe10d617799922d265/src/isomorphic/classic/class/ReactClass.js#L468
  // Note the .reverse(). In React, a fresh constructor is created, then all mixins are mixed in recursively,
  // then the actual spec is mixed in last.
  //
  // With ES6 classes, the properties are already there, so smart-mixin mixes functions (a, b) -> b()a(), which is
  // the opposite of how React does it. If we reverse this array, we basically do the whole logic in reverse,
  // which makes the result the same. See the test for more.
  // See also:
  // https://github.com/facebook/react/blob/41aa3496aa632634f650edbe10d617799922d265/src/isomorphic/classic/class/ReactClass.js#L853
  if (reactMixin.mixins) {
    reactMixin.mixins.reverse().forEach(mixinClass.bind(null, reactClass));
  }

  return reactClass;
}

module.exports = (function() {
  var reactMixin = mixinProto;

  reactMixin.onClass = function(reactClass, mixin) {
    var mixinClone = assign({}, mixin);
    return mixinClass(reactClass, mixinClone);
  };

  reactMixin.decorate = function(mixin) {
    return function(reactClass) {
      // Clone the incoming class
      var newClass = function(props) {
        reactClass.apply(this, arguments);
      };
      // Collect static properties
      var statics = {};
      for (var key in reactClass) {
        // Ordinarily, you'd use reactClass.hasOwnProperty(key) here
        // But we want to catch ALL static properties
        if (!Function.prototype[key]) {
          statics[key] = reactClass[key];
        }
      }
      assign(newClass, statics);
      newClass.prototype = Object.create(reactClass.prototype, {
          constructor: {
              value: newClass,
              enumerable: false,
              writable: true,
              configurable: true
          }
      });
      return reactMixin.onClass(newClass, mixin);
    };
  };

  return reactMixin;
})();

},{"object-assign":2,"smart-mixin":3}],2:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],3:[function(require,module,exports){
var objToStr = function(x){ return Object.prototype.toString.call(x); };

var thrower = function(error){
    throw error;
};

var mixins = module.exports = function makeMixinFunction(rules, _opts){
    var opts = _opts || {};
    if (!opts.unknownFunction) {
        opts.unknownFunction = mixins.ONCE;
    }

    if (!opts.nonFunctionProperty) {
        opts.nonFunctionProperty = function(left, right, key){
            if (left !== undefined && right !== undefined) {
                var getTypeName = function(obj){
                    if (obj && obj.constructor && obj.constructor.name) {
                        return obj.constructor.name;
                    }
                    else {
                        return objToStr(obj).slice(8, -1);
                    }
                };
                throw new TypeError('Cannot mixin key ' + key + ' because it is provided by multiple sources, '
                        + 'and the types are ' + getTypeName(left) + ' and ' + getTypeName(right));
            }
            return left === undefined ? right : left;
        };
    }

    function setNonEnumerable(target, key, value){
        if (key in target){
            target[key] = value;
        }
        else {
            Object.defineProperty(target, key, {
                value: value,
                writable: true,
                configurable: true
            });
        }
    }

    return function applyMixin(source, mixin){
        Object.keys(mixin).forEach(function(key){
            var left = source[key], right = mixin[key], rule = rules[key];

            // this is just a weird case where the key was defined, but there's no value
            // behave like the key wasn't defined
            if (left === undefined && right === undefined) return;

            var wrapIfFunction = function(thing){
                return typeof thing !== "function" ? thing
                : function(){
                    return thing.call(this, arguments);
                };
            };

            // do we have a rule for this key?
            if (rule) {
                // may throw here
                var fn = rule(left, right, key);
                setNonEnumerable(source, key, wrapIfFunction(fn));
                return;
            }

            var leftIsFn = typeof left === "function";
            var rightIsFn = typeof right === "function";

            // check to see if they're some combination of functions or undefined
            // we already know there's no rule, so use the unknown function behavior
            if (leftIsFn && right === undefined
             || rightIsFn && left === undefined
             || leftIsFn && rightIsFn) {
                // may throw, the default is ONCE so if both are functions
                // the default is to throw
                setNonEnumerable(source, key, wrapIfFunction(opts.unknownFunction(left, right, key)));
                return;
            }

            // we have no rule for them, one may be a function but one or both aren't
            // our default is MANY_MERGED_LOOSE which will merge objects, concat arrays
            // and throw if there's a type mismatch or both are primitives (how do you merge 3, and "foo"?)
            source[key] = opts.nonFunctionProperty(left, right, key);
        });
    };
};

mixins._mergeObjects = function(obj1, obj2) {
    var assertObject = function(obj, obj2){
        var type = objToStr(obj);
        if (type !== '[object Object]') {
            var displayType = obj.constructor ? obj.constructor.name : 'Unknown';
            var displayType2 = obj2.constructor ? obj2.constructor.name : 'Unknown';
            thrower('cannot merge returned value of type ' + displayType + ' with an ' + displayType2);
        }
    };

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        return obj1.concat(obj2);
    }

    assertObject(obj1, obj2);
    assertObject(obj2, obj1);

    var result = {};
    Object.keys(obj1).forEach(function(k){
        if (Object.prototype.hasOwnProperty.call(obj2, k)) {
            thrower('cannot merge returns because both have the ' + JSON.stringify(k) + ' key');
        }
        result[k] = obj1[k];
    });

    Object.keys(obj2).forEach(function(k){
        // we can skip the conflict check because all conflicts would already be found
        result[k] = obj2[k];
    });
    return result;

}

// define our built-in mixin types
mixins.ONCE = function(left, right, key){
    if (left && right) {
        throw new TypeError('Cannot mixin ' + key + ' because it has a unique constraint.');
    }

    var fn = left || right;

    return function(args){
        return fn.apply(this, args);
    };
};

mixins.MANY = function(left, right, key){
    return function(args){
        if (right) right.apply(this, args);
        return left ? left.apply(this, args) : undefined;
    };
};

mixins.MANY_MERGED_LOOSE = function(left, right, key) {
    if(left && right) {
        return mixins._mergeObjects(left, right);
    }

    return left || right;
}

mixins.MANY_MERGED = function(left, right, key){
    return function(args){
        var res1 = right && right.apply(this, args);
        var res2 = left && left.apply(this, args);
        if (res1 && res2) {
            return mixins._mergeObjects(res1, res2)
        }
        return res2 || res1;
    };
};


mixins.REDUCE_LEFT = function(_left, _right, key){
    var left = _left || function(x){ return x };
    var right = _right || function(x){ return x };
    return function(args){
        return right.call(this, left.apply(this, args));
    };
};

mixins.REDUCE_RIGHT = function(_left, _right, key){
    var left = _left || function(x){ return x };
    var right = _right || function(x){ return x };
    return function(args){
        return left.call(this, right.apply(this, args));
    };
};


},{}]},{},[1])(1)
});

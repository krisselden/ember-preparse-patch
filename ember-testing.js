;(function() {
/*!
 * @overview  Ember - JavaScript Application Framework
 * @copyright Copyright 2011-2016 Tilde Inc. and contributors
 *            Portions Copyright 2006-2011 Strobe Inc.
 *            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
 * @license   Licensed under MIT license
 *            See https://raw.github.com/emberjs/ember.js/master/LICENSE
 * @version   2.6.1+b65bac07
 */

var enifed, requireModule, require, Ember;
var mainContext = this;

(function() {
  var isNode = typeof window === 'undefined' &&
    typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

  if (!isNode) {
    Ember = this.Ember = this.Ember || {};
  }

  if (typeof Ember === 'undefined') { Ember = {}; }

  if (typeof Ember.__loader === 'undefined') {
    var registry = {};
    var seen = {};

    enifed = function(name, deps, callback) {
      var value = { };

      if (!callback) {
        value.deps = [];
        value.callback = deps;
      } else {
        value.deps = deps;
        value.callback = callback;
      }

      registry[name] = value;
    };

    require = requireModule = function(name) {
      return internalRequire(name, null);
    };

    // setup `require` module
    require['default'] = require;

    require.has = function registryHas(moduleName) {
      return !!registry[moduleName] || !!registry[moduleName + '/index'];
    };

    function missingModule(name, referrerName) {
      if (referrerName) {
        throw new Error('Could not find module ' + name + ' required by: ' + referrerName);
      } else {
        throw new Error('Could not find module ' + name);
      }
    }

    function internalRequire(_name, referrerName) {
      var name = _name;
      var mod = registry[name];

      if (!mod) {
        name = name + '/index';
        mod = registry[name];
      }

      var exports = seen[name];

      if (exports !== undefined) {
        return exports;
      }

      exports = seen[name] = {};

      if (!mod) {
        missingModule(_name, referrerName);
      }

      var deps = mod.deps;
      var callback = mod.callback;
      var length = deps.length;
      var reified = new Array(length);

      for (var i = 0; i < length; i++) {
        if (deps[i] === 'exports') {
          reified[i] = exports;
        } else if (deps[i] === 'require') {
          reified[i] = require;
        } else {
          reified[i] = internalRequire(deps[i], name);
        }
      }

      callback.apply(this, reified);

      return exports;
    }

    requireModule._eak_seen = registry;

    Ember.__loader = {
      define: enifed,
      require: require,
      registry: registry
    };
  } else {
    enifed = Ember.__loader.define;
    require = requireModule = Ember.__loader.require;
  }
})();

enifed('ember-debug/deprecate', ['exports', 'ember-metal/core', 'ember-metal/error', 'ember-metal/logger', 'ember-debug/handlers'], function (exports, _emberMetalCore, _emberMetalError, _emberMetalLogger, _emberDebugHandlers) {
  /*global __fail__*/

  'use strict';

  var _slice = Array.prototype.slice;
  exports.registerHandler = registerHandler;
  exports.default = deprecate;

  function registerHandler(handler) {
    _emberDebugHandlers.registerHandler('deprecate', handler);
  }

  function formatMessage(_message, options) {
    var message = _message;

    if (options && options.id) {
      message = message + (' [deprecation id: ' + options.id + ']');
    }

    if (options && options.url) {
      message += ' See ' + options.url + ' for more details.';
    }

    return message;
  }

  registerHandler(function logDeprecationToConsole(message, options) {
    var updatedMessage = formatMessage(message, options);

    _emberMetalLogger.default.warn('DEPRECATION: ' + updatedMessage);
  });

  var captureErrorForStack = undefined;

  if (new Error().stack) {
    captureErrorForStack = function () {
      return new Error();
    };
  } else {
    captureErrorForStack = function () {
      try {
        __fail__.fail();
      } catch (e) {
        return e;
      }
    };
  }

  registerHandler(function logDeprecationStackTrace(message, options, next) {
    if (_emberMetalCore.default.LOG_STACKTRACE_ON_DEPRECATION) {
      var stackStr = '';
      var error = captureErrorForStack();
      var stack = undefined;

      if (error.stack) {
        if (error['arguments']) {
          // Chrome
          stack = error.stack.replace(/^\s+at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm, '{anonymous}($1)$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}($1)').split('\n');
          stack.shift();
        } else {
          // Firefox
          stack = error.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
        }

        stackStr = '\n    ' + stack.slice(2).join('\n    ');
      }

      var updatedMessage = formatMessage(message, options);

      _emberMetalLogger.default.warn('DEPRECATION: ' + updatedMessage + stackStr);
    } else {
      next.apply(undefined, arguments);
    }
  });

  registerHandler(function raiseOnDeprecation(message, options, next) {
    if (_emberMetalCore.default.ENV.RAISE_ON_DEPRECATION) {
      var updatedMessage = formatMessage(message);

      throw new _emberMetalError.default(updatedMessage);
    } else {
      next.apply(undefined, arguments);
    }
  });

  var missingOptionsDeprecation = 'When calling `Ember.deprecate` you ' + 'must provide an `options` hash as the third parameter.  ' + '`options` should include `id` and `until` properties.';
  exports.missingOptionsDeprecation = missingOptionsDeprecation;
  var missingOptionsIdDeprecation = 'When calling `Ember.deprecate` you must provide `id` in options.';
  exports.missingOptionsIdDeprecation = missingOptionsIdDeprecation;
  var missingOptionsUntilDeprecation = 'When calling `Ember.deprecate` you must provide `until` in options.';

  exports.missingOptionsUntilDeprecation = missingOptionsUntilDeprecation;
  /**
  @module ember
  @submodule ember-debug
  */

  /**
    Display a deprecation warning with the provided message and a stack trace
    (Chrome and Firefox only).
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    @method deprecate
    @param {String} message A description of the deprecation.
    @param {Boolean} test A boolean. If falsy, the deprecation
      will be displayed.
    @param {Object} options An object that can be used to pass
      in a `url` to the transition guide on the emberjs.com website, and a unique
      `id` for this deprecation. The `id` can be used by Ember debugging tools
      to change the behavior (raise, log or silence) for that specific deprecation.
      The `id` should be namespaced by dots, e.g. "view.helper.select".
    @for Ember
    @public
  */

  function deprecate(message, test, options) {
    if (!options || !options.id && !options.until) {
      deprecate(missingOptionsDeprecation, false, {
        id: 'ember-debug.deprecate-options-missing',
        until: '3.0.0',
        url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-debug-function-options'
      });
    }

    if (options && !options.id) {
      deprecate(missingOptionsIdDeprecation, false, {
        id: 'ember-debug.deprecate-id-missing',
        until: '3.0.0',
        url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-debug-function-options'
      });
    }

    if (options && !options.until) {
      deprecate(missingOptionsUntilDeprecation, options && options.until, {
        id: 'ember-debug.deprecate-until-missing',
        until: '3.0.0',
        url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-debug-function-options'
      });
    }

    _emberDebugHandlers.invoke.apply(undefined, ['deprecate'].concat(_slice.call(arguments)));
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLWRlYnVnL2RlcHJlY2F0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O29CQWtId0IsU0FBUzs7QUExRzFCLFdBQVMsZUFBZSxDQUFDLE9BQU8sRUFBRTtBQUN2Qyx3QkFITyxlQUFlLENBR0MsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzlDOztBQUVELFdBQVMsYUFBYSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUU7QUFDeEMsUUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDOztBQUV2QixRQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ3pCLGFBQU8sR0FBRyxPQUFPLDJCQUF3QixPQUFPLENBQUMsRUFBRSxPQUFHLENBQUM7S0FDeEQ7O0FBRUQsUUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUMxQixhQUFPLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsb0JBQW9CLENBQUM7S0FDekQ7O0FBRUQsV0FBTyxPQUFPLENBQUM7R0FDaEI7O0FBRUQsaUJBQWUsQ0FBQyxTQUFTLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUU7QUFDakUsUUFBSSxjQUFjLEdBQUcsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFckQsOEJBQU8sSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQztHQUMvQyxDQUFDLENBQUM7O0FBRUgsTUFBSSxvQkFBb0IsWUFBQSxDQUFDOztBQUV6QixNQUFJLElBQUksS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFO0FBQ3JCLHdCQUFvQixHQUFHLFlBQVc7QUFDaEMsYUFBTyxJQUFJLEtBQUssRUFBRSxDQUFDO0tBQ3BCLENBQUM7R0FDSCxNQUFNO0FBQ0wsd0JBQW9CLEdBQUcsWUFBVztBQUNoQyxVQUFJO0FBQUUsZ0JBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztPQUFFLENBQUMsT0FBTSxDQUFDLEVBQUU7QUFBRSxlQUFPLENBQUMsQ0FBQztPQUFFO0tBQ2hELENBQUM7R0FDSDs7QUFFRCxpQkFBZSxDQUFDLFNBQVMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDeEUsUUFBSSx3QkFBTSw2QkFBNkIsRUFBRTtBQUN2QyxVQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbEIsVUFBSSxLQUFLLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztBQUNuQyxVQUFJLEtBQUssWUFBQSxDQUFDOztBQUVWLFVBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtBQUNmLFlBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFOztBQUV0QixlQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUM1QyxPQUFPLENBQUMscUJBQXFCLEVBQUUsbUJBQW1CLENBQUMsQ0FDbkQsT0FBTyxDQUFDLHNDQUFzQyxFQUFFLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pGLGVBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNmLE1BQU07O0FBRUwsZUFBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUNoRCxPQUFPLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRDs7QUFFRCxnQkFBUSxHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUNyRDs7QUFFRCxVQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDOztBQUVyRCxnQ0FBTyxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsR0FBRyxRQUFRLENBQUMsQ0FBQztLQUMxRCxNQUFNO0FBQ0wsVUFBSSxrQkFBSSxTQUFTLENBQUMsQ0FBQztLQUNwQjtHQUNGLENBQUMsQ0FBQzs7QUFFSCxpQkFBZSxDQUFDLFNBQVMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDbEUsUUFBSSx3QkFBTSxHQUFHLENBQUMsb0JBQW9CLEVBQUU7QUFDbEMsVUFBSSxjQUFjLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUU1QyxZQUFNLDZCQUFlLGNBQWMsQ0FBQyxDQUFDO0tBQ3RDLE1BQU07QUFDTCxVQUFJLGtCQUFJLFNBQVMsQ0FBQyxDQUFDO0tBQ3BCO0dBQ0YsQ0FBQyxDQUFDOztBQUVJLE1BQUkseUJBQXlCLEdBQUcscUNBQXFDLEdBQzFFLDBEQUEwRCxHQUMxRCx1REFBdUQsQ0FBQzs7QUFDbkQsTUFBSSwyQkFBMkIsR0FBRyxrRUFBa0UsQ0FBQzs7QUFDckcsTUFBSSw4QkFBOEIsR0FBRyxxRUFBcUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCbkcsV0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDeEQsUUFBSSxDQUFDLE9BQU8sSUFBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxBQUFDLEVBQUU7QUFDL0MsZUFBUyxDQUNQLHlCQUF5QixFQUN6QixLQUFLLEVBQ0w7QUFDRSxVQUFFLEVBQUUsdUNBQXVDO0FBQzNDLGFBQUssRUFBRSxPQUFPO0FBQ2QsV0FBRyxFQUFFLHdFQUF3RTtPQUM5RSxDQUNGLENBQUM7S0FDSDs7QUFFRCxRQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDMUIsZUFBUyxDQUNQLDJCQUEyQixFQUMzQixLQUFLLEVBQ0w7QUFDRSxVQUFFLEVBQUUsa0NBQWtDO0FBQ3RDLGFBQUssRUFBRSxPQUFPO0FBQ2QsV0FBRyxFQUFFLHdFQUF3RTtPQUM5RSxDQUNGLENBQUM7S0FDSDs7QUFFRCxRQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDN0IsZUFBUyxDQUNQLDhCQUE4QixFQUM5QixPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFDeEI7QUFDRSxVQUFFLEVBQUUscUNBQXFDO0FBQ3pDLGFBQUssRUFBRSxPQUFPO0FBQ2QsV0FBRyxFQUFFLHdFQUF3RTtPQUM5RSxDQUNGLENBQUM7S0FDSDs7QUFFRCx3QkFqSmtELE1BQU0sbUJBaUpqRCxXQUFXLHFCQUFLLFNBQVMsR0FBQyxDQUFDO0dBQ25DIiwiZmlsZSI6ImVtYmVyLWRlYnVnL2RlcHJlY2F0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIF9fZmFpbF9fKi9cblxuaW1wb3J0IEVtYmVyIGZyb20gJ2VtYmVyLW1ldGFsL2NvcmUnO1xuaW1wb3J0IEVtYmVyRXJyb3IgZnJvbSAnZW1iZXItbWV0YWwvZXJyb3InO1xuaW1wb3J0IExvZ2dlciBmcm9tICdlbWJlci1tZXRhbC9sb2dnZXInO1xuXG5pbXBvcnQgeyByZWdpc3RlckhhbmRsZXIgYXMgZ2VuZXJpY1JlZ2lzdGVySGFuZGxlciwgaW52b2tlIH0gZnJvbSAnZW1iZXItZGVidWcvaGFuZGxlcnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJIYW5kbGVyKGhhbmRsZXIpIHtcbiAgZ2VuZXJpY1JlZ2lzdGVySGFuZGxlcignZGVwcmVjYXRlJywgaGFuZGxlcik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1lc3NhZ2UoX21lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgbGV0IG1lc3NhZ2UgPSBfbWVzc2FnZTtcblxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmlkKSB7XG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyBgIFtkZXByZWNhdGlvbiBpZDogJHtvcHRpb25zLmlkfV1gO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51cmwpIHtcbiAgICBtZXNzYWdlICs9ICcgU2VlICcgKyBvcHRpb25zLnVybCArICcgZm9yIG1vcmUgZGV0YWlscy4nO1xuICB9XG5cbiAgcmV0dXJuIG1lc3NhZ2U7XG59XG5cbnJlZ2lzdGVySGFuZGxlcihmdW5jdGlvbiBsb2dEZXByZWNhdGlvblRvQ29uc29sZShtZXNzYWdlLCBvcHRpb25zKSB7XG4gIGxldCB1cGRhdGVkTWVzc2FnZSA9IGZvcm1hdE1lc3NhZ2UobWVzc2FnZSwgb3B0aW9ucyk7XG5cbiAgTG9nZ2VyLndhcm4oJ0RFUFJFQ0FUSU9OOiAnICsgdXBkYXRlZE1lc3NhZ2UpO1xufSk7XG5cbmxldCBjYXB0dXJlRXJyb3JGb3JTdGFjaztcblxuaWYgKG5ldyBFcnJvcigpLnN0YWNrKSB7XG4gIGNhcHR1cmVFcnJvckZvclN0YWNrID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcigpO1xuICB9O1xufSBlbHNlIHtcbiAgY2FwdHVyZUVycm9yRm9yU3RhY2sgPSBmdW5jdGlvbigpIHtcbiAgICB0cnkgeyBfX2ZhaWxfXy5mYWlsKCk7IH0gY2F0Y2goZSkgeyByZXR1cm4gZTsgfVxuICB9O1xufVxuXG5yZWdpc3RlckhhbmRsZXIoZnVuY3Rpb24gbG9nRGVwcmVjYXRpb25TdGFja1RyYWNlKG1lc3NhZ2UsIG9wdGlvbnMsIG5leHQpIHtcbiAgaWYgKEVtYmVyLkxPR19TVEFDS1RSQUNFX09OX0RFUFJFQ0FUSU9OKSB7XG4gICAgbGV0IHN0YWNrU3RyID0gJyc7XG4gICAgbGV0IGVycm9yID0gY2FwdHVyZUVycm9yRm9yU3RhY2soKTtcbiAgICBsZXQgc3RhY2s7XG5cbiAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgIGlmIChlcnJvclsnYXJndW1lbnRzJ10pIHtcbiAgICAgICAgLy8gQ2hyb21lXG4gICAgICAgIHN0YWNrID0gZXJyb3Iuc3RhY2sucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKS5cbiAgICAgICAgICByZXBsYWNlKC9eKFteXFwoXSs/KShbXFxuJF0pL2dtLCAne2Fub255bW91c30oJDEpJDInKS5cbiAgICAgICAgICByZXBsYWNlKC9eT2JqZWN0Ljxhbm9ueW1vdXM+XFxzKlxcKChbXlxcKV0rKVxcKS9nbSwgJ3thbm9ueW1vdXN9KCQxKScpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZpcmVmb3hcbiAgICAgICAgc3RhY2sgPSBlcnJvci5zdGFjay5yZXBsYWNlKC8oPzpcXG5AOjApP1xccyskL20sICcnKS5cbiAgICAgICAgICByZXBsYWNlKC9eXFwoL2dtLCAne2Fub255bW91c30oJykuc3BsaXQoJ1xcbicpO1xuICAgICAgfVxuXG4gICAgICBzdGFja1N0ciA9ICdcXG4gICAgJyArIHN0YWNrLnNsaWNlKDIpLmpvaW4oJ1xcbiAgICAnKTtcbiAgICB9XG5cbiAgICBsZXQgdXBkYXRlZE1lc3NhZ2UgPSBmb3JtYXRNZXNzYWdlKG1lc3NhZ2UsIG9wdGlvbnMpO1xuXG4gICAgTG9nZ2VyLndhcm4oJ0RFUFJFQ0FUSU9OOiAnICsgdXBkYXRlZE1lc3NhZ2UgKyBzdGFja1N0cik7XG4gIH0gZWxzZSB7XG4gICAgbmV4dCguLi5hcmd1bWVudHMpO1xuICB9XG59KTtcblxucmVnaXN0ZXJIYW5kbGVyKGZ1bmN0aW9uIHJhaXNlT25EZXByZWNhdGlvbihtZXNzYWdlLCBvcHRpb25zLCBuZXh0KSB7XG4gIGlmIChFbWJlci5FTlYuUkFJU0VfT05fREVQUkVDQVRJT04pIHtcbiAgICBsZXQgdXBkYXRlZE1lc3NhZ2UgPSBmb3JtYXRNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgdGhyb3cgbmV3IEVtYmVyRXJyb3IodXBkYXRlZE1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIG5leHQoLi4uYXJndW1lbnRzKTtcbiAgfVxufSk7XG5cbmV4cG9ydCBsZXQgbWlzc2luZ09wdGlvbnNEZXByZWNhdGlvbiA9ICdXaGVuIGNhbGxpbmcgYEVtYmVyLmRlcHJlY2F0ZWAgeW91ICcgK1xuICAnbXVzdCBwcm92aWRlIGFuIGBvcHRpb25zYCBoYXNoIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIuICAnICtcbiAgJ2BvcHRpb25zYCBzaG91bGQgaW5jbHVkZSBgaWRgIGFuZCBgdW50aWxgIHByb3BlcnRpZXMuJztcbmV4cG9ydCBsZXQgbWlzc2luZ09wdGlvbnNJZERlcHJlY2F0aW9uID0gJ1doZW4gY2FsbGluZyBgRW1iZXIuZGVwcmVjYXRlYCB5b3UgbXVzdCBwcm92aWRlIGBpZGAgaW4gb3B0aW9ucy4nO1xuZXhwb3J0IGxldCBtaXNzaW5nT3B0aW9uc1VudGlsRGVwcmVjYXRpb24gPSAnV2hlbiBjYWxsaW5nIGBFbWJlci5kZXByZWNhdGVgIHlvdSBtdXN0IHByb3ZpZGUgYHVudGlsYCBpbiBvcHRpb25zLic7XG5cbi8qKlxuQG1vZHVsZSBlbWJlclxuQHN1Ym1vZHVsZSBlbWJlci1kZWJ1Z1xuKi9cblxuLyoqXG4gIERpc3BsYXkgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdpdGggdGhlIHByb3ZpZGVkIG1lc3NhZ2UgYW5kIGEgc3RhY2sgdHJhY2VcbiAgKENocm9tZSBhbmQgRmlyZWZveCBvbmx5KS5cblxuICAqIEluIGEgcHJvZHVjdGlvbiBidWlsZCwgdGhpcyBtZXRob2QgaXMgZGVmaW5lZCBhcyBhbiBlbXB0eSBmdW5jdGlvbiAoTk9QKS5cbiAgVXNlcyBvZiB0aGlzIG1ldGhvZCBpbiBFbWJlciBpdHNlbGYgYXJlIHN0cmlwcGVkIGZyb20gdGhlIGVtYmVyLnByb2QuanMgYnVpbGQuXG5cbiAgQG1ldGhvZCBkZXByZWNhdGVcbiAgQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgQSBkZXNjcmlwdGlvbiBvZiB0aGUgZGVwcmVjYXRpb24uXG4gIEBwYXJhbSB7Qm9vbGVhbn0gdGVzdCBBIGJvb2xlYW4uIElmIGZhbHN5LCB0aGUgZGVwcmVjYXRpb25cbiAgICB3aWxsIGJlIGRpc3BsYXllZC5cbiAgQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQW4gb2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gcGFzc1xuICAgIGluIGEgYHVybGAgdG8gdGhlIHRyYW5zaXRpb24gZ3VpZGUgb24gdGhlIGVtYmVyanMuY29tIHdlYnNpdGUsIGFuZCBhIHVuaXF1ZVxuICAgIGBpZGAgZm9yIHRoaXMgZGVwcmVjYXRpb24uIFRoZSBgaWRgIGNhbiBiZSB1c2VkIGJ5IEVtYmVyIGRlYnVnZ2luZyB0b29sc1xuICAgIHRvIGNoYW5nZSB0aGUgYmVoYXZpb3IgKHJhaXNlLCBsb2cgb3Igc2lsZW5jZSkgZm9yIHRoYXQgc3BlY2lmaWMgZGVwcmVjYXRpb24uXG4gICAgVGhlIGBpZGAgc2hvdWxkIGJlIG5hbWVzcGFjZWQgYnkgZG90cywgZS5nLiBcInZpZXcuaGVscGVyLnNlbGVjdFwiLlxuICBAZm9yIEVtYmVyXG4gIEBwdWJsaWNcbiovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZXByZWNhdGUobWVzc2FnZSwgdGVzdCwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLmlkICYmICFvcHRpb25zLnVudGlsKSkge1xuICAgIGRlcHJlY2F0ZShcbiAgICAgIG1pc3NpbmdPcHRpb25zRGVwcmVjYXRpb24sXG4gICAgICBmYWxzZSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdlbWJlci1kZWJ1Zy5kZXByZWNhdGUtb3B0aW9ucy1taXNzaW5nJyxcbiAgICAgICAgdW50aWw6ICczLjAuMCcsXG4gICAgICAgIHVybDogJ2h0dHA6Ly9lbWJlcmpzLmNvbS9kZXByZWNhdGlvbnMvdjIueC8jdG9jX2VtYmVyLWRlYnVnLWZ1bmN0aW9uLW9wdGlvbnMnXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zICYmICFvcHRpb25zLmlkKSB7XG4gICAgZGVwcmVjYXRlKFxuICAgICAgbWlzc2luZ09wdGlvbnNJZERlcHJlY2F0aW9uLFxuICAgICAgZmFsc2UsXG4gICAgICB7XG4gICAgICAgIGlkOiAnZW1iZXItZGVidWcuZGVwcmVjYXRlLWlkLW1pc3NpbmcnLFxuICAgICAgICB1bnRpbDogJzMuMC4wJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2VtYmVyanMuY29tL2RlcHJlY2F0aW9ucy92Mi54LyN0b2NfZW1iZXItZGVidWctZnVuY3Rpb24tb3B0aW9ucydcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMgJiYgIW9wdGlvbnMudW50aWwpIHtcbiAgICBkZXByZWNhdGUoXG4gICAgICBtaXNzaW5nT3B0aW9uc1VudGlsRGVwcmVjYXRpb24sXG4gICAgICBvcHRpb25zICYmIG9wdGlvbnMudW50aWwsXG4gICAgICB7XG4gICAgICAgIGlkOiAnZW1iZXItZGVidWcuZGVwcmVjYXRlLXVudGlsLW1pc3NpbmcnLFxuICAgICAgICB1bnRpbDogJzMuMC4wJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2VtYmVyanMuY29tL2RlcHJlY2F0aW9ucy92Mi54LyN0b2NfZW1iZXItZGVidWctZnVuY3Rpb24tb3B0aW9ucydcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaW52b2tlKCdkZXByZWNhdGUnLCAuLi5hcmd1bWVudHMpO1xufVxuIl19
enifed("ember-debug/handlers", ["exports"], function (exports) {
  "use strict";

  exports.registerHandler = registerHandler;
  exports.invoke = invoke;
  var HANDLERS = {};

  exports.HANDLERS = HANDLERS;

  function registerHandler(type, callback) {
    var nextHandler = HANDLERS[type] || function () {};

    HANDLERS[type] = function (message, options) {
      callback(message, options, nextHandler);
    };
  }

  function invoke(type, message, test, options) {
    if (test) {
      return;
    }

    var handlerForType = HANDLERS[type];

    if (!handlerForType) {
      return;
    }

    if (handlerForType) {
      handlerForType(message, options);
    }
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLWRlYnVnL2hhbmRsZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQU8sTUFBSSxRQUFRLEdBQUcsRUFBRyxDQUFDOzs7O0FBRW5CLFdBQVMsZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDOUMsUUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVcsRUFBRyxDQUFDOztBQUVuRCxZQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQzFDLGNBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3pDLENBQUM7R0FDSDs7QUFFTSxXQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDbkQsUUFBSSxJQUFJLEVBQUU7QUFBRSxhQUFPO0tBQUU7O0FBRXJCLFFBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFcEMsUUFBSSxDQUFDLGNBQWMsRUFBRTtBQUFFLGFBQU87S0FBRTs7QUFFaEMsUUFBSSxjQUFjLEVBQUU7QUFDbEIsb0JBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEM7R0FDRiIsImZpbGUiOiJlbWJlci1kZWJ1Zy9oYW5kbGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBsZXQgSEFORExFUlMgPSB7IH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIodHlwZSwgY2FsbGJhY2spIHtcbiAgbGV0IG5leHRIYW5kbGVyID0gSEFORExFUlNbdHlwZV0gfHwgZnVuY3Rpb24oKSB7IH07XG5cbiAgSEFORExFUlNbdHlwZV0gPSBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgY2FsbGJhY2sobWVzc2FnZSwgb3B0aW9ucywgbmV4dEhhbmRsZXIpO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlKHR5cGUsIG1lc3NhZ2UsIHRlc3QsIG9wdGlvbnMpIHtcbiAgaWYgKHRlc3QpIHsgcmV0dXJuOyB9XG5cbiAgbGV0IGhhbmRsZXJGb3JUeXBlID0gSEFORExFUlNbdHlwZV07XG5cbiAgaWYgKCFoYW5kbGVyRm9yVHlwZSkgeyByZXR1cm47IH1cblxuICBpZiAoaGFuZGxlckZvclR5cGUpIHtcbiAgICBoYW5kbGVyRm9yVHlwZShtZXNzYWdlLCBvcHRpb25zKTtcbiAgfVxufVxuIl19
enifed('ember-debug/index', ['exports', 'ember-metal/core', 'ember-metal/debug', 'ember-metal/features', 'ember-metal/error', 'ember-metal/logger', 'ember-metal/environment', 'ember-debug/deprecate', 'ember-debug/warn'], function (exports, _emberMetalCore, _emberMetalDebug, _emberMetalFeatures, _emberMetalError, _emberMetalLogger, _emberMetalEnvironment, _emberDebugDeprecate, _emberDebugWarn) {
  'use strict';

  exports._warnIfUsingStrippedFeatureFlags = _warnIfUsingStrippedFeatureFlags;

  /**
  @module ember
  @submodule ember-debug
  */

  /**
  @class Ember
  @public
  */

  /**
    Define an assertion that will throw an exception if the condition is not met.
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    ```javascript
    // Test for truthiness
    Ember.assert('Must pass a valid object', obj);
  
    // Fail unconditionally
    Ember.assert('This code path should never be run');
    ```
  
    @method assert
    @param {String} desc A description of the assertion. This will become
      the text of the Error thrown if the assertion fails.
    @param {Boolean} test Must be truthy for the assertion to pass. If
      falsy, an exception will be thrown.
    @public
  */
  _emberMetalDebug.setDebugFunction('assert', function assert(desc, test) {
    if (!test) {
      throw new _emberMetalError.default('Assertion Failed: ' + desc);
    }
  });

  /**
    Display a debug notice.
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    ```javascript
    Ember.debug('I\'m a debug notice!');
    ```
  
    @method debug
    @param {String} message A debug message to display.
    @public
  */
  _emberMetalDebug.setDebugFunction('debug', function debug(message) {
    _emberMetalLogger.default.debug('DEBUG: ' + message);
  });

  /**
    Display an info notice.
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    @method info
    @private
  */
  _emberMetalDebug.setDebugFunction('info', function info() {
    _emberMetalLogger.default.info.apply(undefined, arguments);
  });

  /**
    Alias an old, deprecated method with its new counterpart.
  
    Display a deprecation warning with the provided message and a stack trace
    (Chrome and Firefox only) when the assigned method is called.
  
    * In a production build, this method is defined as an empty function (NOP).
  
    ```javascript
    Ember.oldMethod = Ember.deprecateFunc('Please use the new, updated method', Ember.newMethod);
    ```
  
    @method deprecateFunc
    @param {String} message A description of the deprecation.
    @param {Object} [options] The options object for Ember.deprecate.
    @param {Function} func The new function called to replace its deprecated counterpart.
    @return {Function} A new function that wraps the original function with a deprecation warning
    @private
  */
  _emberMetalDebug.setDebugFunction('deprecateFunc', function deprecateFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (args.length === 3) {
      var _ret = (function () {
        var message = args[0];
        var options = args[1];
        var func = args[2];

        return {
          v: function () {
            _emberMetalDebug.deprecate(message, false, options);
            return func.apply(this, arguments);
          }
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } else {
      var _ret2 = (function () {
        var message = args[0];
        var func = args[1];

        return {
          v: function () {
            _emberMetalDebug.deprecate(message);
            return func.apply(this, arguments);
          }
        };
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    }
  });

  /**
    Run a function meant for debugging.
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    ```javascript
    Ember.runInDebug(() => {
      Ember.Component.reopen({
        didInsertElement() {
          console.log("I'm happy");
        }
      });
    });
    ```
  
    @method runInDebug
    @param {Function} func The function to be executed.
    @since 1.5.0
    @public
  */
  _emberMetalDebug.setDebugFunction('runInDebug', function runInDebug(func) {
    func();
  });

  _emberMetalDebug.setDebugFunction('debugSeal', function debugSeal(obj) {
    Object.seal(obj);
  });

  _emberMetalDebug.setDebugFunction('deprecate', _emberDebugDeprecate.default);

  _emberMetalDebug.setDebugFunction('warn', _emberDebugWarn.default);

  /**
    Will call `Ember.warn()` if ENABLE_OPTIONAL_FEATURES or
    any specific FEATURES flag is truthy.
  
    This method is called automatically in debug canary builds.
  
    @private
    @method _warnIfUsingStrippedFeatureFlags
    @return {void}
  */

  function _warnIfUsingStrippedFeatureFlags(FEATURES, knownFeatures, featuresWereStripped) {
    if (featuresWereStripped) {
      _emberMetalDebug.warn('Ember.ENV.ENABLE_OPTIONAL_FEATURES is only available in canary builds.', !_emberMetalCore.default.ENV.ENABLE_OPTIONAL_FEATURES, { id: 'ember-debug.feature-flag-with-features-stripped' });

      var keys = Object.keys(FEATURES || {});
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key === 'isEnabled' || !(key in knownFeatures)) {
          continue;
        }

        _emberMetalDebug.warn('FEATURE["' + key + '"] is set as enabled, but FEATURE flags are only available in canary builds.', !FEATURES[key], { id: 'ember-debug.feature-flag-with-features-stripped' });
      }
    }
  }

  if (!_emberMetalCore.default.testing) {
    // Complain if they're using FEATURE flags in builds other than canary
    _emberMetalFeatures.FEATURES['features-stripped-test'] = true;
    var featuresWereStripped = true;

    delete _emberMetalFeatures.FEATURES['features-stripped-test'];
    _warnIfUsingStrippedFeatureFlags(_emberMetalCore.default.ENV.FEATURES, _emberMetalFeatures.KNOWN_FEATURES, featuresWereStripped);

    // Inform the developer about the Ember Inspector if not installed.
    var isFirefox = _emberMetalEnvironment.default.isFirefox;
    var isChrome = _emberMetalEnvironment.default.isChrome;

    if (typeof window !== 'undefined' && (isFirefox || isChrome) && window.addEventListener) {
      window.addEventListener('load', function () {
        if (document.documentElement && document.documentElement.dataset && !document.documentElement.dataset.emberExtension) {
          var downloadURL;

          if (isChrome) {
            downloadURL = 'https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi';
          } else if (isFirefox) {
            downloadURL = 'https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/';
          }

          _emberMetalDebug.debug('For more advanced debugging, install the Ember Inspector from ' + downloadURL);
        }
      }, false);
    }
  }
  /**
    @public
    @class Ember.Debug
  */
  _emberMetalCore.default.Debug = {};

  /**
    Allows for runtime registration of handler functions that override the default deprecation behavior.
    Deprecations are invoked by calls to [Ember.deprecate](http://emberjs.com/api/classes/Ember.html#method_deprecate).
    The following example demonstrates its usage by registering a handler that throws an error if the
    message contains the word "should", otherwise defers to the default handler.
  
    ```javascript
    Ember.Debug.registerDeprecationHandler((message, options, next) => {
      if (message.indexOf('should') !== -1) {
        throw new Error(`Deprecation message with should: ${message}`);
      } else {
        // defer to whatever handler was registered before this one
        next(message, options);
      }
    }
    ```
  
    The handler function takes the following arguments:
  
    <ul>
      <li> <code>message</code> - The message received from the deprecation call.</li>
      <li> <code>options</code> - An object passed in with the deprecation call containing additional information including:</li>
        <ul>
          <li> <code>id</code> - An id of the deprecation in the form of <code>package-name.specific-deprecation</code>.</li>
          <li> <code>until</code> - The Ember version number the feature and deprecation will be removed in.</li>
        </ul>
      <li> <code>next</code> - A function that calls into the previously registered handler.</li>
    </ul>
  
    @public
    @static
    @method registerDeprecationHandler
    @param handler {Function} A function to handle deprecation calls.
    @since 2.1.0
  */
  _emberMetalCore.default.Debug.registerDeprecationHandler = _emberDebugDeprecate.registerHandler;
  /**
    Allows for runtime registration of handler functions that override the default warning behavior.
    Warnings are invoked by calls made to [Ember.warn](http://emberjs.com/api/classes/Ember.html#method_warn).
    The following example demonstrates its usage by registering a handler that does nothing overriding Ember's
    default warning behavior.
  
    ```javascript
    // next is not called, so no warnings get the default behavior
    Ember.Debug.registerWarnHandler(() => {});
    ```
  
    The handler function takes the following arguments:
  
    <ul>
      <li> <code>message</code> - The message received from the warn call. </li>
      <li> <code>options</code> - An object passed in with the warn call containing additional information including:</li>
        <ul>
          <li> <code>id</code> - An id of the warning in the form of <code>package-name.specific-warning</code>.</li>
        </ul>
      <li> <code>next</code> - A function that calls into the previously registered handler.</li>
    </ul>
  
    @public
    @static
    @method registerWarnHandler
    @param handler {Function} A function to handle warnings.
    @since 2.1.0
  */
  _emberMetalCore.default.Debug.registerWarnHandler = _emberDebugWarn.registerHandler;

  /*
    We are transitioning away from `ember.js` to `ember.debug.js` to make
    it much clearer that it is only for local development purposes.
  
    This flag value is changed by the tooling (by a simple string replacement)
    so that if `ember.js` (which must be output for backwards compat reasons) is
    used a nice helpful warning message will be printed out.
  */
  var runningNonEmberDebugJS = false;
  exports.runningNonEmberDebugJS = runningNonEmberDebugJS;
  if (runningNonEmberDebugJS) {
    _emberMetalDebug.warn('Please use `ember.debug.js` instead of `ember.js` for development and debugging.');
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLWRlYnVnL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtEQSxtQkE3Q0UsZ0JBQWdCLENBNkNELFFBQVEsRUFBRSxTQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3JELFFBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxZQUFNLDZCQUFlLG9CQUFvQixHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ25EO0dBQ0YsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JILG1CQWpFRSxnQkFBZ0IsQ0FpRUQsT0FBTyxFQUFFLFNBQVMsS0FBSyxDQUFDLE9BQU8sRUFBRTtBQUNoRCw4QkFBTyxLQUFLLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0dBQ25DLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7QUFXSCxtQkE5RUUsZ0JBQWdCLENBOEVELE1BQU0sRUFBRSxTQUFTLElBQUksR0FBRztBQUN2Qyw4QkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztHQUN6QyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCSCxtQkFyR0UsZ0JBQWdCLENBcUdELGVBQWUsRUFBRSxTQUFTLGFBQWEsR0FBVTtzQ0FBTixJQUFJO0FBQUosVUFBSTs7O0FBQzlELFFBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7O1lBQ2hCLE9BQU8sR0FBbUIsSUFBSTtZQUFyQixPQUFPLEdBQVUsSUFBSTtZQUFaLElBQUksR0FBSSxJQUFJOztBQUNuQzthQUFPLFlBQVc7QUFDaEIsNkJBM0dKLFNBQVMsQ0EyR0ssT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuQyxtQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztXQUNwQztVQUFDOzs7O0tBQ0gsTUFBTTs7WUFD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V0FDakY7O0FBRUQsMkJBN01OLEtBQUssQ0E2TU8sZ0VBQWdFLEdBQUcsV0FBVyxDQUFDLENBQUM7U0FDdkY7T0FDRixFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ1g7R0FDRjs7Ozs7QUFLRCwwQkFBTSxLQUFLLEdBQUcsRUFBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUNsQiwwQkFBTSxLQUFLLENBQUMsMEJBQTBCLHdCQW5QcEMsZUFBZSxBQW1Qa0QsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QnBFLDBCQUFNLEtBQUssQ0FBQyxtQkFBbUIsbUJBN1E3QixlQUFlLEFBNlFvQyxDQUFDOzs7Ozs7Ozs7O0FBVS9DLE1BQUksc0JBQXNCLEdBQUcsS0FBSyxDQUFDOztBQUMxQyxNQUFJLHNCQUFzQixFQUFFO0FBQzFCLHFCQXRTQSxJQUFJLENBc1NDLGtGQUFrRixDQUFDLENBQUM7R0FDMUYiLCJmaWxlIjoiZW1iZXItZGVidWcvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW1iZXIgZnJvbSAnZW1iZXItbWV0YWwvY29yZSc7XG5pbXBvcnQge1xuICB3YXJuLFxuICBkZXByZWNhdGUsXG4gIGRlYnVnLFxuICBzZXREZWJ1Z0Z1bmN0aW9uXG59IGZyb20gJ2VtYmVyLW1ldGFsL2RlYnVnJztcbmltcG9ydCBpc0VuYWJsZWQsIHsgRkVBVFVSRVMsIEtOT1dOX0ZFQVRVUkVTIH0gZnJvbSAnZW1iZXItbWV0YWwvZmVhdHVyZXMnO1xuaW1wb3J0IEVtYmVyRXJyb3IgZnJvbSAnZW1iZXItbWV0YWwvZXJyb3InO1xuaW1wb3J0IExvZ2dlciBmcm9tICdlbWJlci1tZXRhbC9sb2dnZXInO1xuaW1wb3J0IGVudmlyb25tZW50IGZyb20gJ2VtYmVyLW1ldGFsL2Vudmlyb25tZW50JztcbmltcG9ydCBfZGVwcmVjYXRlLCB7XG4gIHJlZ2lzdGVySGFuZGxlciBhcyByZWdpc3RlckRlcHJlY2F0aW9uSGFuZGxlclxufSBmcm9tICdlbWJlci1kZWJ1Zy9kZXByZWNhdGUnO1xuaW1wb3J0IF93YXJuLCB7XG4gIHJlZ2lzdGVySGFuZGxlciBhcyByZWdpc3Rlcldhcm5IYW5kbGVyXG59IGZyb20gJ2VtYmVyLWRlYnVnL3dhcm4nO1xuXG4vKipcbkBtb2R1bGUgZW1iZXJcbkBzdWJtb2R1bGUgZW1iZXItZGVidWdcbiovXG5cbi8qKlxuQGNsYXNzIEVtYmVyXG5AcHVibGljXG4qL1xuXG5cbi8qKlxuICBEZWZpbmUgYW4gYXNzZXJ0aW9uIHRoYXQgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LlxuXG4gICogSW4gYSBwcm9kdWN0aW9uIGJ1aWxkLCB0aGlzIG1ldGhvZCBpcyBkZWZpbmVkIGFzIGFuIGVtcHR5IGZ1bmN0aW9uIChOT1ApLlxuICBVc2VzIG9mIHRoaXMgbWV0aG9kIGluIEVtYmVyIGl0c2VsZiBhcmUgc3RyaXBwZWQgZnJvbSB0aGUgZW1iZXIucHJvZC5qcyBidWlsZC5cblxuICBgYGBqYXZhc2NyaXB0XG4gIC8vIFRlc3QgZm9yIHRydXRoaW5lc3NcbiAgRW1iZXIuYXNzZXJ0KCdNdXN0IHBhc3MgYSB2YWxpZCBvYmplY3QnLCBvYmopO1xuXG4gIC8vIEZhaWwgdW5jb25kaXRpb25hbGx5XG4gIEVtYmVyLmFzc2VydCgnVGhpcyBjb2RlIHBhdGggc2hvdWxkIG5ldmVyIGJlIHJ1bicpO1xuICBgYGBcblxuICBAbWV0aG9kIGFzc2VydFxuICBAcGFyYW0ge1N0cmluZ30gZGVzYyBBIGRlc2NyaXB0aW9uIG9mIHRoZSBhc3NlcnRpb24uIFRoaXMgd2lsbCBiZWNvbWVcbiAgICB0aGUgdGV4dCBvZiB0aGUgRXJyb3IgdGhyb3duIGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gIEBwYXJhbSB7Qm9vbGVhbn0gdGVzdCBNdXN0IGJlIHRydXRoeSBmb3IgdGhlIGFzc2VydGlvbiB0byBwYXNzLiBJZlxuICAgIGZhbHN5LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG4gIEBwdWJsaWNcbiovXG5zZXREZWJ1Z0Z1bmN0aW9uKCdhc3NlcnQnLCBmdW5jdGlvbiBhc3NlcnQoZGVzYywgdGVzdCkge1xuICBpZiAoIXRlc3QpIHtcbiAgICB0aHJvdyBuZXcgRW1iZXJFcnJvcignQXNzZXJ0aW9uIEZhaWxlZDogJyArIGRlc2MpO1xuICB9XG59KTtcblxuLyoqXG4gIERpc3BsYXkgYSBkZWJ1ZyBub3RpY2UuXG5cbiAgKiBJbiBhIHByb2R1Y3Rpb24gYnVpbGQsIHRoaXMgbWV0aG9kIGlzIGRlZmluZWQgYXMgYW4gZW1wdHkgZnVuY3Rpb24gKE5PUCkuXG4gIFVzZXMgb2YgdGhpcyBtZXRob2QgaW4gRW1iZXIgaXRzZWxmIGFyZSBzdHJpcHBlZCBmcm9tIHRoZSBlbWJlci5wcm9kLmpzIGJ1aWxkLlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgRW1iZXIuZGVidWcoJ0lcXCdtIGEgZGVidWcgbm90aWNlIScpO1xuICBgYGBcblxuICBAbWV0aG9kIGRlYnVnXG4gIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIEEgZGVidWcgbWVzc2FnZSB0byBkaXNwbGF5LlxuICBAcHVibGljXG4qL1xuc2V0RGVidWdGdW5jdGlvbignZGVidWcnLCBmdW5jdGlvbiBkZWJ1ZyhtZXNzYWdlKSB7XG4gIExvZ2dlci5kZWJ1ZygnREVCVUc6ICcgKyBtZXNzYWdlKTtcbn0pO1xuXG4vKipcbiAgRGlzcGxheSBhbiBpbmZvIG5vdGljZS5cblxuICAqIEluIGEgcHJvZHVjdGlvbiBidWlsZCwgdGhpcyBtZXRob2QgaXMgZGVmaW5lZCBhcyBhbiBlbXB0eSBmdW5jdGlvbiAoTk9QKS5cbiAgVXNlcyBvZiB0aGlzIG1ldGhvZCBpbiBFbWJlciBpdHNlbGYgYXJlIHN0cmlwcGVkIGZyb20gdGhlIGVtYmVyLnByb2QuanMgYnVpbGQuXG5cbiAgQG1ldGhvZCBpbmZvXG4gIEBwcml2YXRlXG4qL1xuc2V0RGVidWdGdW5jdGlvbignaW5mbycsIGZ1bmN0aW9uIGluZm8oKSB7XG4gIExvZ2dlci5pbmZvLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn0pO1xuXG4vKipcbiAgQWxpYXMgYW4gb2xkLCBkZXByZWNhdGVkIG1ldGhvZCB3aXRoIGl0cyBuZXcgY291bnRlcnBhcnQuXG5cbiAgRGlzcGxheSBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgd2l0aCB0aGUgcHJvdmlkZWQgbWVzc2FnZSBhbmQgYSBzdGFjayB0cmFjZVxuICAoQ2hyb21lIGFuZCBGaXJlZm94IG9ubHkpIHdoZW4gdGhlIGFzc2lnbmVkIG1ldGhvZCBpcyBjYWxsZWQuXG5cbiAgKiBJbiBhIHByb2R1Y3Rpb24gYnVpbGQsIHRoaXMgbWV0aG9kIGlzIGRlZmluZWQgYXMgYW4gZW1wdHkgZnVuY3Rpb24gKE5PUCkuXG5cbiAgYGBgamF2YXNjcmlwdFxuICBFbWJlci5vbGRNZXRob2QgPSBFbWJlci5kZXByZWNhdGVGdW5jKCdQbGVhc2UgdXNlIHRoZSBuZXcsIHVwZGF0ZWQgbWV0aG9kJywgRW1iZXIubmV3TWV0aG9kKTtcbiAgYGBgXG5cbiAgQG1ldGhvZCBkZXByZWNhdGVGdW5jXG4gIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIEEgZGVzY3JpcHRpb24gb2YgdGhlIGRlcHJlY2F0aW9uLlxuICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdCBmb3IgRW1iZXIuZGVwcmVjYXRlLlxuICBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBuZXcgZnVuY3Rpb24gY2FsbGVkIHRvIHJlcGxhY2UgaXRzIGRlcHJlY2F0ZWQgY291bnRlcnBhcnQuXG4gIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB0aGF0IHdyYXBzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3aXRoIGEgZGVwcmVjYXRpb24gd2FybmluZ1xuICBAcHJpdmF0ZVxuKi9cbnNldERlYnVnRnVuY3Rpb24oJ2RlcHJlY2F0ZUZ1bmMnLCBmdW5jdGlvbiBkZXByZWNhdGVGdW5jKC4uLmFyZ3MpIHtcbiAgaWYgKGFyZ3MubGVuZ3RoID09PSAzKSB7XG4gICAgbGV0IFttZXNzYWdlLCBvcHRpb25zLCBmdW5jXSA9IGFyZ3M7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgZGVwcmVjYXRlKG1lc3NhZ2UsIGZhbHNlLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgW21lc3NhZ2UsIGZ1bmNdID0gYXJncztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBkZXByZWNhdGUobWVzc2FnZSk7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cbn0pO1xuXG5cbi8qKlxuICBSdW4gYSBmdW5jdGlvbiBtZWFudCBmb3IgZGVidWdnaW5nLlxuXG4gICogSW4gYSBwcm9kdWN0aW9uIGJ1aWxkLCB0aGlzIG1ldGhvZCBpcyBkZWZpbmVkIGFzIGFuIGVtcHR5IGZ1bmN0aW9uIChOT1ApLlxuICBVc2VzIG9mIHRoaXMgbWV0aG9kIGluIEVtYmVyIGl0c2VsZiBhcmUgc3RyaXBwZWQgZnJvbSB0aGUgZW1iZXIucHJvZC5qcyBidWlsZC5cblxuICBgYGBqYXZhc2NyaXB0XG4gIEVtYmVyLnJ1bkluRGVidWcoKCkgPT4ge1xuICAgIEVtYmVyLkNvbXBvbmVudC5yZW9wZW4oe1xuICAgICAgZGlkSW5zZXJ0RWxlbWVudCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJJJ20gaGFwcHlcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJ1bkluRGVidWdcbiAgQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQuXG4gIEBzaW5jZSAxLjUuMFxuICBAcHVibGljXG4qL1xuc2V0RGVidWdGdW5jdGlvbigncnVuSW5EZWJ1ZycsIGZ1bmN0aW9uIHJ1bkluRGVidWcoZnVuYykge1xuICBmdW5jKCk7XG59KTtcblxuc2V0RGVidWdGdW5jdGlvbignZGVidWdTZWFsJywgZnVuY3Rpb24gZGVidWdTZWFsKG9iaikge1xuICBPYmplY3Quc2VhbChvYmopO1xufSk7XG5cbnNldERlYnVnRnVuY3Rpb24oJ2RlcHJlY2F0ZScsIF9kZXByZWNhdGUpO1xuXG5zZXREZWJ1Z0Z1bmN0aW9uKCd3YXJuJywgX3dhcm4pO1xuXG4vKipcbiAgV2lsbCBjYWxsIGBFbWJlci53YXJuKClgIGlmIEVOQUJMRV9PUFRJT05BTF9GRUFUVVJFUyBvclxuICBhbnkgc3BlY2lmaWMgRkVBVFVSRVMgZmxhZyBpcyB0cnV0aHkuXG5cbiAgVGhpcyBtZXRob2QgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHkgaW4gZGVidWcgY2FuYXJ5IGJ1aWxkcy5cblxuICBAcHJpdmF0ZVxuICBAbWV0aG9kIF93YXJuSWZVc2luZ1N0cmlwcGVkRmVhdHVyZUZsYWdzXG4gIEByZXR1cm4ge3ZvaWR9XG4qL1xuZXhwb3J0IGZ1bmN0aW9uIF93YXJuSWZVc2luZ1N0cmlwcGVkRmVhdHVyZUZsYWdzKEZFQVRVUkVTLCBrbm93bkZlYXR1cmVzLCBmZWF0dXJlc1dlcmVTdHJpcHBlZCkge1xuICBpZiAoZmVhdHVyZXNXZXJlU3RyaXBwZWQpIHtcbiAgICB3YXJuKCdFbWJlci5FTlYuRU5BQkxFX09QVElPTkFMX0ZFQVRVUkVTIGlzIG9ubHkgYXZhaWxhYmxlIGluIGNhbmFyeSBidWlsZHMuJywgIUVtYmVyLkVOVi5FTkFCTEVfT1BUSU9OQUxfRkVBVFVSRVMsIHsgaWQ6ICdlbWJlci1kZWJ1Zy5mZWF0dXJlLWZsYWctd2l0aC1mZWF0dXJlcy1zdHJpcHBlZCcgfSk7XG5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKEZFQVRVUkVTIHx8IHt9KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGtleSA9PT0gJ2lzRW5hYmxlZCcgfHwgIShrZXkgaW4ga25vd25GZWF0dXJlcykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHdhcm4oJ0ZFQVRVUkVbXCInICsga2V5ICsgJ1wiXSBpcyBzZXQgYXMgZW5hYmxlZCwgYnV0IEZFQVRVUkUgZmxhZ3MgYXJlIG9ubHkgYXZhaWxhYmxlIGluIGNhbmFyeSBidWlsZHMuJywgIUZFQVRVUkVTW2tleV0sIHsgaWQ6ICdlbWJlci1kZWJ1Zy5mZWF0dXJlLWZsYWctd2l0aC1mZWF0dXJlcy1zdHJpcHBlZCcgfSk7XG4gICAgfVxuICB9XG59XG5cbmlmICghRW1iZXIudGVzdGluZykge1xuICAvLyBDb21wbGFpbiBpZiB0aGV5J3JlIHVzaW5nIEZFQVRVUkUgZmxhZ3MgaW4gYnVpbGRzIG90aGVyIHRoYW4gY2FuYXJ5XG4gIEZFQVRVUkVTWydmZWF0dXJlcy1zdHJpcHBlZC10ZXN0J10gPSB0cnVlO1xuICB2YXIgZmVhdHVyZXNXZXJlU3RyaXBwZWQgPSB0cnVlO1xuXG4gIGlmIChpc0VuYWJsZWQoJ2ZlYXR1cmVzLXN0cmlwcGVkLXRlc3QnKSkge1xuICAgIGZlYXR1cmVzV2VyZVN0cmlwcGVkID0gZmFsc2U7XG4gIH1cblxuICBkZWxldGUgRkVBVFVSRVNbJ2ZlYXR1cmVzLXN0cmlwcGVkLXRlc3QnXTtcbiAgX3dhcm5JZlVzaW5nU3RyaXBwZWRGZWF0dXJlRmxhZ3MoRW1iZXIuRU5WLkZFQVRVUkVTLCBLTk9XTl9GRUFUVVJFUywgZmVhdHVyZXNXZXJlU3RyaXBwZWQpO1xuXG4gIC8vIEluZm9ybSB0aGUgZGV2ZWxvcGVyIGFib3V0IHRoZSBFbWJlciBJbnNwZWN0b3IgaWYgbm90IGluc3RhbGxlZC5cbiAgdmFyIGlzRmlyZWZveCA9IGVudmlyb25tZW50LmlzRmlyZWZveDtcbiAgdmFyIGlzQ2hyb21lID0gZW52aXJvbm1lbnQuaXNDaHJvbWU7XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIChpc0ZpcmVmb3ggfHwgaXNDaHJvbWUpICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQgJiYgIWRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmVtYmVyRXh0ZW5zaW9uKSB7XG4gICAgICAgIHZhciBkb3dubG9hZFVSTDtcblxuICAgICAgICBpZiAoaXNDaHJvbWUpIHtcbiAgICAgICAgICBkb3dubG9hZFVSTCA9ICdodHRwczovL2Nocm9tZS5nb29nbGUuY29tL3dlYnN0b3JlL2RldGFpbC9lbWJlci1pbnNwZWN0b3IvYm1kYmxuY2Vna2Vua2FjaWVpaGZocGpmcHBvY29uaGknO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRmlyZWZveCkge1xuICAgICAgICAgIGRvd25sb2FkVVJMID0gJ2h0dHBzOi8vYWRkb25zLm1vemlsbGEub3JnL2VuLVVTL2ZpcmVmb3gvYWRkb24vZW1iZXItaW5zcGVjdG9yLyc7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1ZygnRm9yIG1vcmUgYWR2YW5jZWQgZGVidWdnaW5nLCBpbnN0YWxsIHRoZSBFbWJlciBJbnNwZWN0b3IgZnJvbSAnICsgZG93bmxvYWRVUkwpO1xuICAgICAgfVxuICAgIH0sIGZhbHNlKTtcbiAgfVxufVxuLyoqXG4gIEBwdWJsaWNcbiAgQGNsYXNzIEVtYmVyLkRlYnVnXG4qL1xuRW1iZXIuRGVidWcgPSB7IH07XG5cbi8qKlxuICBBbGxvd3MgZm9yIHJ1bnRpbWUgcmVnaXN0cmF0aW9uIG9mIGhhbmRsZXIgZnVuY3Rpb25zIHRoYXQgb3ZlcnJpZGUgdGhlIGRlZmF1bHQgZGVwcmVjYXRpb24gYmVoYXZpb3IuXG4gIERlcHJlY2F0aW9ucyBhcmUgaW52b2tlZCBieSBjYWxscyB0byBbRW1iZXIuZGVwcmVjYXRlXShodHRwOi8vZW1iZXJqcy5jb20vYXBpL2NsYXNzZXMvRW1iZXIuaHRtbCNtZXRob2RfZGVwcmVjYXRlKS5cbiAgVGhlIGZvbGxvd2luZyBleGFtcGxlIGRlbW9uc3RyYXRlcyBpdHMgdXNhZ2UgYnkgcmVnaXN0ZXJpbmcgYSBoYW5kbGVyIHRoYXQgdGhyb3dzIGFuIGVycm9yIGlmIHRoZVxuICBtZXNzYWdlIGNvbnRhaW5zIHRoZSB3b3JkIFwic2hvdWxkXCIsIG90aGVyd2lzZSBkZWZlcnMgdG8gdGhlIGRlZmF1bHQgaGFuZGxlci5cblxuICBgYGBqYXZhc2NyaXB0XG4gIEVtYmVyLkRlYnVnLnJlZ2lzdGVyRGVwcmVjYXRpb25IYW5kbGVyKChtZXNzYWdlLCBvcHRpb25zLCBuZXh0KSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UuaW5kZXhPZignc2hvdWxkJykgIT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERlcHJlY2F0aW9uIG1lc3NhZ2Ugd2l0aCBzaG91bGQ6ICR7bWVzc2FnZX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZGVmZXIgdG8gd2hhdGV2ZXIgaGFuZGxlciB3YXMgcmVnaXN0ZXJlZCBiZWZvcmUgdGhpcyBvbmVcbiAgICAgIG5leHQobWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG4gIGBgYFxuXG4gIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHRha2VzIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuXG4gIDx1bD5cbiAgICA8bGk+IDxjb2RlPm1lc3NhZ2U8L2NvZGU+IC0gVGhlIG1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSB0aGUgZGVwcmVjYXRpb24gY2FsbC48L2xpPlxuICAgIDxsaT4gPGNvZGU+b3B0aW9uczwvY29kZT4gLSBBbiBvYmplY3QgcGFzc2VkIGluIHdpdGggdGhlIGRlcHJlY2F0aW9uIGNhbGwgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluY2x1ZGluZzo8L2xpPlxuICAgICAgPHVsPlxuICAgICAgICA8bGk+IDxjb2RlPmlkPC9jb2RlPiAtIEFuIGlkIG9mIHRoZSBkZXByZWNhdGlvbiBpbiB0aGUgZm9ybSBvZiA8Y29kZT5wYWNrYWdlLW5hbWUuc3BlY2lmaWMtZGVwcmVjYXRpb248L2NvZGU+LjwvbGk+XG4gICAgICAgIDxsaT4gPGNvZGU+dW50aWw8L2NvZGU+IC0gVGhlIEVtYmVyIHZlcnNpb24gbnVtYmVyIHRoZSBmZWF0dXJlIGFuZCBkZXByZWNhdGlvbiB3aWxsIGJlIHJlbW92ZWQgaW4uPC9saT5cbiAgICAgIDwvdWw+XG4gICAgPGxpPiA8Y29kZT5uZXh0PC9jb2RlPiAtIEEgZnVuY3Rpb24gdGhhdCBjYWxscyBpbnRvIHRoZSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgaGFuZGxlci48L2xpPlxuICA8L3VsPlxuXG4gIEBwdWJsaWNcbiAgQHN0YXRpY1xuICBAbWV0aG9kIHJlZ2lzdGVyRGVwcmVjYXRpb25IYW5kbGVyXG4gIEBwYXJhbSBoYW5kbGVyIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0byBoYW5kbGUgZGVwcmVjYXRpb24gY2FsbHMuXG4gIEBzaW5jZSAyLjEuMFxuKi9cbkVtYmVyLkRlYnVnLnJlZ2lzdGVyRGVwcmVjYXRpb25IYW5kbGVyID0gcmVnaXN0ZXJEZXByZWNhdGlvbkhhbmRsZXI7XG4vKipcbiAgQWxsb3dzIGZvciBydW50aW1lIHJlZ2lzdHJhdGlvbiBvZiBoYW5kbGVyIGZ1bmN0aW9ucyB0aGF0IG92ZXJyaWRlIHRoZSBkZWZhdWx0IHdhcm5pbmcgYmVoYXZpb3IuXG4gIFdhcm5pbmdzIGFyZSBpbnZva2VkIGJ5IGNhbGxzIG1hZGUgdG8gW0VtYmVyLndhcm5dKGh0dHA6Ly9lbWJlcmpzLmNvbS9hcGkvY2xhc3Nlcy9FbWJlci5odG1sI21ldGhvZF93YXJuKS5cbiAgVGhlIGZvbGxvd2luZyBleGFtcGxlIGRlbW9uc3RyYXRlcyBpdHMgdXNhZ2UgYnkgcmVnaXN0ZXJpbmcgYSBoYW5kbGVyIHRoYXQgZG9lcyBub3RoaW5nIG92ZXJyaWRpbmcgRW1iZXInc1xuICBkZWZhdWx0IHdhcm5pbmcgYmVoYXZpb3IuXG5cbiAgYGBgamF2YXNjcmlwdFxuICAvLyBuZXh0IGlzIG5vdCBjYWxsZWQsIHNvIG5vIHdhcm5pbmdzIGdldCB0aGUgZGVmYXVsdCBiZWhhdmlvclxuICBFbWJlci5EZWJ1Zy5yZWdpc3Rlcldhcm5IYW5kbGVyKCgpID0+IHt9KTtcbiAgYGBgXG5cbiAgVGhlIGhhbmRsZXIgZnVuY3Rpb24gdGFrZXMgdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG5cbiAgPHVsPlxuICAgIDxsaT4gPGNvZGU+bWVzc2FnZTwvY29kZT4gLSBUaGUgbWVzc2FnZSByZWNlaXZlZCBmcm9tIHRoZSB3YXJuIGNhbGwuIDwvbGk+XG4gICAgPGxpPiA8Y29kZT5vcHRpb25zPC9jb2RlPiAtIEFuIG9iamVjdCBwYXNzZWQgaW4gd2l0aCB0aGUgd2FybiBjYWxsIGNvbnRhaW5pbmcgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbmNsdWRpbmc6PC9saT5cbiAgICAgIDx1bD5cbiAgICAgICAgPGxpPiA8Y29kZT5pZDwvY29kZT4gLSBBbiBpZCBvZiB0aGUgd2FybmluZyBpbiB0aGUgZm9ybSBvZiA8Y29kZT5wYWNrYWdlLW5hbWUuc3BlY2lmaWMtd2FybmluZzwvY29kZT4uPC9saT5cbiAgICAgIDwvdWw+XG4gICAgPGxpPiA8Y29kZT5uZXh0PC9jb2RlPiAtIEEgZnVuY3Rpb24gdGhhdCBjYWxscyBpbnRvIHRoZSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgaGFuZGxlci48L2xpPlxuICA8L3VsPlxuXG4gIEBwdWJsaWNcbiAgQHN0YXRpY1xuICBAbWV0aG9kIHJlZ2lzdGVyV2FybkhhbmRsZXJcbiAgQHBhcmFtIGhhbmRsZXIge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRvIGhhbmRsZSB3YXJuaW5ncy5cbiAgQHNpbmNlIDIuMS4wXG4qL1xuRW1iZXIuRGVidWcucmVnaXN0ZXJXYXJuSGFuZGxlciA9IHJlZ2lzdGVyV2FybkhhbmRsZXI7XG5cbi8qXG4gIFdlIGFyZSB0cmFuc2l0aW9uaW5nIGF3YXkgZnJvbSBgZW1iZXIuanNgIHRvIGBlbWJlci5kZWJ1Zy5qc2AgdG8gbWFrZVxuICBpdCBtdWNoIGNsZWFyZXIgdGhhdCBpdCBpcyBvbmx5IGZvciBsb2NhbCBkZXZlbG9wbWVudCBwdXJwb3Nlcy5cblxuICBUaGlzIGZsYWcgdmFsdWUgaXMgY2hhbmdlZCBieSB0aGUgdG9vbGluZyAoYnkgYSBzaW1wbGUgc3RyaW5nIHJlcGxhY2VtZW50KVxuICBzbyB0aGF0IGlmIGBlbWJlci5qc2AgKHdoaWNoIG11c3QgYmUgb3V0cHV0IGZvciBiYWNrd2FyZHMgY29tcGF0IHJlYXNvbnMpIGlzXG4gIHVzZWQgYSBuaWNlIGhlbHBmdWwgd2FybmluZyBtZXNzYWdlIHdpbGwgYmUgcHJpbnRlZCBvdXQuXG4qL1xuZXhwb3J0IHZhciBydW5uaW5nTm9uRW1iZXJEZWJ1Z0pTID0gZmFsc2U7XG5pZiAocnVubmluZ05vbkVtYmVyRGVidWdKUykge1xuICB3YXJuKCdQbGVhc2UgdXNlIGBlbWJlci5kZWJ1Zy5qc2AgaW5zdGVhZCBvZiBgZW1iZXIuanNgIGZvciBkZXZlbG9wbWVudCBhbmQgZGVidWdnaW5nLicpO1xufVxuIl19
enifed('ember-debug/warn', ['exports', 'ember-metal/logger', 'ember-metal/debug', 'ember-debug/handlers'], function (exports, _emberMetalLogger, _emberMetalDebug, _emberDebugHandlers) {
  'use strict';

  var _slice = Array.prototype.slice;
  exports.registerHandler = registerHandler;
  exports.default = warn;

  function registerHandler(handler) {
    _emberDebugHandlers.registerHandler('warn', handler);
  }

  registerHandler(function logWarning(message, options) {
    _emberMetalLogger.default.warn('WARNING: ' + message);
    if ('trace' in _emberMetalLogger.default) {
      _emberMetalLogger.default.trace();
    }
  });

  var missingOptionsDeprecation = 'When calling `Ember.warn` you ' + 'must provide an `options` hash as the third parameter.  ' + '`options` should include an `id` property.';
  exports.missingOptionsDeprecation = missingOptionsDeprecation;
  var missingOptionsIdDeprecation = 'When calling `Ember.warn` you must provide `id` in options.';

  exports.missingOptionsIdDeprecation = missingOptionsIdDeprecation;
  /**
  @module ember
  @submodule ember-debug
  */

  /**
    Display a warning with the provided message.
  
    * In a production build, this method is defined as an empty function (NOP).
    Uses of this method in Ember itself are stripped from the ember.prod.js build.
  
    @method warn
    @param {String} message A warning to display.
    @param {Boolean} test An optional boolean. If falsy, the warning
      will be displayed.
    @param {Object} options An object that can be used to pass a unique
      `id` for this warning.  The `id` can be used by Ember debugging tools
      to change the behavior (raise, log, or silence) for that specific warning.
      The `id` should be namespaced by dots, e.g. "ember-debug.feature-flag-with-features-stripped"
    @for Ember
    @public
  */

  function warn(message, test, options) {
    if (!options) {
      _emberMetalDebug.deprecate(missingOptionsDeprecation, false, {
        id: 'ember-debug.warn-options-missing',
        until: '3.0.0',
        url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-debug-function-options'
      });
    }

    if (options && !options.id) {
      _emberMetalDebug.deprecate(missingOptionsIdDeprecation, false, {
        id: 'ember-debug.warn-id-missing',
        until: '3.0.0',
        url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-debug-function-options'
      });
    }

    _emberDebugHandlers.invoke.apply(undefined, ['warn'].concat(_slice.call(arguments)));
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLWRlYnVnL3dhcm4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7b0JBMEN3QixJQUFJOztBQXRDckIsV0FBUyxlQUFlLENBQUMsT0FBTyxFQUFFO0FBQ3ZDLHdCQUhPLGVBQWUsQ0FHQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDekM7O0FBRUQsaUJBQWUsQ0FBQyxTQUFTLFVBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ3BELDhCQUFPLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFDbkMsUUFBSSxPQUFPLDZCQUFVLEVBQUU7QUFDckIsZ0NBQU8sS0FBSyxFQUFFLENBQUM7S0FDaEI7R0FDRixDQUFDLENBQUM7O0FBRUksTUFBSSx5QkFBeUIsR0FBRyxnQ0FBZ0MsR0FDckUsMERBQTBELEdBQzFELDRDQUE0QyxDQUFDOztBQUN4QyxNQUFJLDJCQUEyQixHQUFHLDZEQUE2RCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCeEYsV0FBUyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDbkQsUUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLHVCQTNDSyxTQUFTLENBNENaLHlCQUF5QixFQUN6QixLQUFLLEVBQ0w7QUFDRSxVQUFFLEVBQUUsa0NBQWtDO0FBQ3RDLGFBQUssRUFBRSxPQUFPO0FBQ2QsV0FBRyxFQUFFLHdFQUF3RTtPQUM5RSxDQUNGLENBQUM7S0FDSDs7QUFFRCxRQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDMUIsdUJBdkRLLFNBQVMsQ0F3RFosMkJBQTJCLEVBQzNCLEtBQUssRUFDTDtBQUNFLFVBQUUsRUFBRSw2QkFBNkI7QUFDakMsYUFBSyxFQUFFLE9BQU87QUFDZCxXQUFHLEVBQUUsd0VBQXdFO09BQzlFLENBQ0YsQ0FBQztLQUNIOztBQUVELHdCQWpFa0QsTUFBTSxtQkFpRWpELE1BQU0scUJBQUssU0FBUyxHQUFDLENBQUM7R0FDOUIiLCJmaWxlIjoiZW1iZXItZGVidWcvd2Fybi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBMb2dnZXIgZnJvbSAnZW1iZXItbWV0YWwvbG9nZ2VyJztcbmltcG9ydCB7IGRlcHJlY2F0ZSB9IGZyb20gJ2VtYmVyLW1ldGFsL2RlYnVnJztcbmltcG9ydCB7IHJlZ2lzdGVySGFuZGxlciBhcyBnZW5lcmljUmVnaXN0ZXJIYW5kbGVyLCBpbnZva2UgfSBmcm9tICdlbWJlci1kZWJ1Zy9oYW5kbGVycyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoaGFuZGxlcikge1xuICBnZW5lcmljUmVnaXN0ZXJIYW5kbGVyKCd3YXJuJywgaGFuZGxlcik7XG59XG5cbnJlZ2lzdGVySGFuZGxlcihmdW5jdGlvbiBsb2dXYXJuaW5nKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgTG9nZ2VyLndhcm4oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlKTtcbiAgaWYgKCd0cmFjZScgaW4gTG9nZ2VyKSB7XG4gICAgTG9nZ2VyLnRyYWNlKCk7XG4gIH1cbn0pO1xuXG5leHBvcnQgbGV0IG1pc3NpbmdPcHRpb25zRGVwcmVjYXRpb24gPSAnV2hlbiBjYWxsaW5nIGBFbWJlci53YXJuYCB5b3UgJyArXG4gICdtdXN0IHByb3ZpZGUgYW4gYG9wdGlvbnNgIGhhc2ggYXMgdGhlIHRoaXJkIHBhcmFtZXRlci4gICcgK1xuICAnYG9wdGlvbnNgIHNob3VsZCBpbmNsdWRlIGFuIGBpZGAgcHJvcGVydHkuJztcbmV4cG9ydCBsZXQgbWlzc2luZ09wdGlvbnNJZERlcHJlY2F0aW9uID0gJ1doZW4gY2FsbGluZyBgRW1iZXIud2FybmAgeW91IG11c3QgcHJvdmlkZSBgaWRgIGluIG9wdGlvbnMuJztcblxuLyoqXG5AbW9kdWxlIGVtYmVyXG5Ac3VibW9kdWxlIGVtYmVyLWRlYnVnXG4qL1xuXG4vKipcbiAgRGlzcGxheSBhIHdhcm5pbmcgd2l0aCB0aGUgcHJvdmlkZWQgbWVzc2FnZS5cblxuICAqIEluIGEgcHJvZHVjdGlvbiBidWlsZCwgdGhpcyBtZXRob2QgaXMgZGVmaW5lZCBhcyBhbiBlbXB0eSBmdW5jdGlvbiAoTk9QKS5cbiAgVXNlcyBvZiB0aGlzIG1ldGhvZCBpbiBFbWJlciBpdHNlbGYgYXJlIHN0cmlwcGVkIGZyb20gdGhlIGVtYmVyLnByb2QuanMgYnVpbGQuXG5cbiAgQG1ldGhvZCB3YXJuXG4gIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIEEgd2FybmluZyB0byBkaXNwbGF5LlxuICBAcGFyYW0ge0Jvb2xlYW59IHRlc3QgQW4gb3B0aW9uYWwgYm9vbGVhbi4gSWYgZmFsc3ksIHRoZSB3YXJuaW5nXG4gICAgd2lsbCBiZSBkaXNwbGF5ZWQuXG4gIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIEFuIG9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIHBhc3MgYSB1bmlxdWVcbiAgICBgaWRgIGZvciB0aGlzIHdhcm5pbmcuICBUaGUgYGlkYCBjYW4gYmUgdXNlZCBieSBFbWJlciBkZWJ1Z2dpbmcgdG9vbHNcbiAgICB0byBjaGFuZ2UgdGhlIGJlaGF2aW9yIChyYWlzZSwgbG9nLCBvciBzaWxlbmNlKSBmb3IgdGhhdCBzcGVjaWZpYyB3YXJuaW5nLlxuICAgIFRoZSBgaWRgIHNob3VsZCBiZSBuYW1lc3BhY2VkIGJ5IGRvdHMsIGUuZy4gXCJlbWJlci1kZWJ1Zy5mZWF0dXJlLWZsYWctd2l0aC1mZWF0dXJlcy1zdHJpcHBlZFwiXG4gIEBmb3IgRW1iZXJcbiAgQHB1YmxpY1xuKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdhcm4obWVzc2FnZSwgdGVzdCwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBkZXByZWNhdGUoXG4gICAgICBtaXNzaW5nT3B0aW9uc0RlcHJlY2F0aW9uLFxuICAgICAgZmFsc2UsXG4gICAgICB7XG4gICAgICAgIGlkOiAnZW1iZXItZGVidWcud2Fybi1vcHRpb25zLW1pc3NpbmcnLFxuICAgICAgICB1bnRpbDogJzMuMC4wJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2VtYmVyanMuY29tL2RlcHJlY2F0aW9ucy92Mi54LyN0b2NfZW1iZXItZGVidWctZnVuY3Rpb24tb3B0aW9ucydcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMgJiYgIW9wdGlvbnMuaWQpIHtcbiAgICBkZXByZWNhdGUoXG4gICAgICBtaXNzaW5nT3B0aW9uc0lkRGVwcmVjYXRpb24sXG4gICAgICBmYWxzZSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdlbWJlci1kZWJ1Zy53YXJuLWlkLW1pc3NpbmcnLFxuICAgICAgICB1bnRpbDogJzMuMC4wJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2VtYmVyanMuY29tL2RlcHJlY2F0aW9ucy92Mi54LyN0b2NfZW1iZXItZGVidWctZnVuY3Rpb24tb3B0aW9ucydcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaW52b2tlKCd3YXJuJywgLi4uYXJndW1lbnRzKTtcbn1cbiJdfQ==
enifed('ember-testing/adapters/adapter', ['exports', 'ember-runtime/system/object'], function (exports, _emberRuntimeSystemObject) {
  'use strict';

  function K() {
    return this;
  }

  /**
   @module ember
   @submodule ember-testing
  */

  /**
    The primary purpose of this class is to create hooks that can be implemented
    by an adapter for various test frameworks.
  
    @class Adapter
    @namespace Ember.Test
    @public
  */
  var Adapter = _emberRuntimeSystemObject.default.extend({
    /**
      This callback will be called whenever an async operation is about to start.
       Override this to call your framework's methods that handle async
      operations.
       @public
      @method asyncStart
    */
    asyncStart: K,

    /**
      This callback will be called whenever an async operation has completed.
       @public
      @method asyncEnd
    */
    asyncEnd: K,

    /**
      Override this method with your testing framework's false assertion.
      This function is called whenever an exception occurs causing the testing
      promise to fail.
       QUnit example:
       ```javascript
        exception: function(error) {
          ok(false, error);
        };
      ```
       @public
      @method exception
      @param {String} error The exception to be raised.
    */
    exception: function (error) {
      throw error;
    }
  });

  exports.default = Adapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3RpbmcvYWRhcHRlcnMvYWRhcHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxXQUFTLENBQUMsR0FBRztBQUFFLFdBQU8sSUFBSSxDQUFDO0dBQUU7Ozs7Ozs7Ozs7Ozs7OztBQWU3QixNQUFJLE9BQU8sR0FBRyxrQ0FBWSxNQUFNLENBQUM7Ozs7Ozs7O0FBVS9CLGNBQVUsRUFBRSxDQUFDOzs7Ozs7O0FBUWIsWUFBUSxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQlgsYUFBUyxFQUFBLFVBQUMsS0FBSyxFQUFFO0FBQ2YsWUFBTSxLQUFLLENBQUM7S0FDYjtHQUNGLENBQUMsQ0FBQzs7b0JBRVksT0FBTyIsImZpbGUiOiJlbWJlci10ZXN0aW5nL2FkYXB0ZXJzL2FkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW1iZXJPYmplY3QgZnJvbSAnZW1iZXItcnVudGltZS9zeXN0ZW0vb2JqZWN0JztcblxuZnVuY3Rpb24gSygpIHsgcmV0dXJuIHRoaXM7IH1cblxuLyoqXG4gQG1vZHVsZSBlbWJlclxuIEBzdWJtb2R1bGUgZW1iZXItdGVzdGluZ1xuKi9cblxuLyoqXG4gIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBjbGFzcyBpcyB0byBjcmVhdGUgaG9va3MgdGhhdCBjYW4gYmUgaW1wbGVtZW50ZWRcbiAgYnkgYW4gYWRhcHRlciBmb3IgdmFyaW91cyB0ZXN0IGZyYW1ld29ya3MuXG5cbiAgQGNsYXNzIEFkYXB0ZXJcbiAgQG5hbWVzcGFjZSBFbWJlci5UZXN0XG4gIEBwdWJsaWNcbiovXG52YXIgQWRhcHRlciA9IEVtYmVyT2JqZWN0LmV4dGVuZCh7XG4gIC8qKlxuICAgIFRoaXMgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYW4gYXN5bmMgb3BlcmF0aW9uIGlzIGFib3V0IHRvIHN0YXJ0LlxuXG4gICAgT3ZlcnJpZGUgdGhpcyB0byBjYWxsIHlvdXIgZnJhbWV3b3JrJ3MgbWV0aG9kcyB0aGF0IGhhbmRsZSBhc3luY1xuICAgIG9wZXJhdGlvbnMuXG5cbiAgICBAcHVibGljXG4gICAgQG1ldGhvZCBhc3luY1N0YXJ0XG4gICovXG4gIGFzeW5jU3RhcnQ6IEssXG5cbiAgLyoqXG4gICAgVGhpcyBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhbiBhc3luYyBvcGVyYXRpb24gaGFzIGNvbXBsZXRlZC5cblxuICAgIEBwdWJsaWNcbiAgICBAbWV0aG9kIGFzeW5jRW5kXG4gICovXG4gIGFzeW5jRW5kOiBLLFxuXG4gIC8qKlxuICAgIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHdpdGggeW91ciB0ZXN0aW5nIGZyYW1ld29yaydzIGZhbHNlIGFzc2VydGlvbi5cbiAgICBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuZXZlciBhbiBleGNlcHRpb24gb2NjdXJzIGNhdXNpbmcgdGhlIHRlc3RpbmdcbiAgICBwcm9taXNlIHRvIGZhaWwuXG5cbiAgICBRVW5pdCBleGFtcGxlOlxuXG4gICAgYGBgamF2YXNjcmlwdFxuICAgICAgZXhjZXB0aW9uOiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBvayhmYWxzZSwgZXJyb3IpO1xuICAgICAgfTtcbiAgICBgYGBcblxuICAgIEBwdWJsaWNcbiAgICBAbWV0aG9kIGV4Y2VwdGlvblxuICAgIEBwYXJhbSB7U3RyaW5nfSBlcnJvciBUaGUgZXhjZXB0aW9uIHRvIGJlIHJhaXNlZC5cbiAgKi9cbiAgZXhjZXB0aW9uKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBBZGFwdGVyO1xuIl19
enifed('ember-testing/adapters/qunit', ['exports', 'ember-testing/adapters/adapter', 'ember-metal/utils'], function (exports, _emberTestingAdaptersAdapter, _emberMetalUtils) {
  'use strict';

  /**
    This class implements the methods defined by Ember.Test.Adapter for the
    QUnit testing framework.
  
    @class QUnitAdapter
    @namespace Ember.Test
    @extends Ember.Test.Adapter
    @public
  */
  exports.default = _emberTestingAdaptersAdapter.default.extend({
    asyncStart: function () {
      QUnit.stop();
    },
    asyncEnd: function () {
      QUnit.start();
    },
    exception: function (error) {
      ok(false, _emberMetalUtils.inspect(error));
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3RpbmcvYWRhcHRlcnMvcXVuaXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O29CQVllLHFDQUFRLE1BQU0sQ0FBQztBQUM1QixjQUFVLEVBQUEsWUFBRztBQUNYLFdBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNkO0FBQ0QsWUFBUSxFQUFBLFlBQUc7QUFDVCxXQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDZjtBQUNELGFBQVMsRUFBQSxVQUFDLEtBQUssRUFBRTtBQUNmLFFBQUUsQ0FBQyxLQUFLLEVBQUUsaUJBbkJMLE9BQU8sQ0FtQk0sS0FBSyxDQUFDLENBQUMsQ0FBQztLQUMzQjtHQUNGLENBQUMiLCJmaWxlIjoiZW1iZXItdGVzdGluZy9hZGFwdGVycy9xdW5pdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBZGFwdGVyIGZyb20gJ2VtYmVyLXRlc3RpbmcvYWRhcHRlcnMvYWRhcHRlcic7XG5pbXBvcnQgeyBpbnNwZWN0IH0gZnJvbSAnZW1iZXItbWV0YWwvdXRpbHMnO1xuXG4vKipcbiAgVGhpcyBjbGFzcyBpbXBsZW1lbnRzIHRoZSBtZXRob2RzIGRlZmluZWQgYnkgRW1iZXIuVGVzdC5BZGFwdGVyIGZvciB0aGVcbiAgUVVuaXQgdGVzdGluZyBmcmFtZXdvcmsuXG5cbiAgQGNsYXNzIFFVbml0QWRhcHRlclxuICBAbmFtZXNwYWNlIEVtYmVyLlRlc3RcbiAgQGV4dGVuZHMgRW1iZXIuVGVzdC5BZGFwdGVyXG4gIEBwdWJsaWNcbiovXG5leHBvcnQgZGVmYXVsdCBBZGFwdGVyLmV4dGVuZCh7XG4gIGFzeW5jU3RhcnQoKSB7XG4gICAgUVVuaXQuc3RvcCgpO1xuICB9LFxuICBhc3luY0VuZCgpIHtcbiAgICBRVW5pdC5zdGFydCgpO1xuICB9LFxuICBleGNlcHRpb24oZXJyb3IpIHtcbiAgICBvayhmYWxzZSwgaW5zcGVjdChlcnJvcikpO1xuICB9XG59KTtcbiJdfQ==
enifed('ember-testing/helpers', ['exports', 'ember-metal/property_get', 'ember-metal/error', 'ember-metal/run_loop', 'ember-views/system/jquery', 'ember-testing/test', 'ember-runtime/ext/rsvp', 'ember-metal/features'], function (exports, _emberMetalProperty_get, _emberMetalError, _emberMetalRun_loop, _emberViewsSystemJquery, _emberTestingTest, _emberRuntimeExtRsvp, _emberMetalFeatures) {
  'use strict';

  /**
  @module ember
  @submodule ember-testing
  */

  var helper = _emberTestingTest.default.registerHelper;
  var asyncHelper = _emberTestingTest.default.registerAsyncHelper;

  var keyboardEventTypes, mouseEventTypes, buildKeyboardEvent, buildMouseEvent, buildBasicEvent, fireEvent, focus;

  var defaultEventOptions = { canBubble: true, cancelable: true };
  keyboardEventTypes = ['keydown', 'keypress', 'keyup'];
  mouseEventTypes = ['click', 'mousedown', 'mouseup', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover'];

  buildKeyboardEvent = function buildKeyboardEvent(type) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var event = undefined;
    try {
      event = document.createEvent('KeyEvents');
      var eventOpts = _emberViewsSystemJquery.default.extend({}, defaultEventOptions, options);
      event.initKeyEvent(type, eventOpts.canBubble, eventOpts.cancelable, window, eventOpts.ctrlKey, eventOpts.altKey, eventOpts.shiftKey, eventOpts.metaKey, eventOpts.keyCode, eventOpts.charCode);
    } catch (e) {
      event = buildBasicEvent(type, options);
    }
    return event;
  };

  buildMouseEvent = function buildMouseEvent(type) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var event = undefined;
    try {
      event = document.createEvent('MouseEvents');
      var eventOpts = _emberViewsSystemJquery.default.extend({}, defaultEventOptions, options);
      event.initMouseEvent(type, eventOpts.canBubble, eventOpts.cancelable, window, eventOpts.detail, eventOpts.screenX, eventOpts.screenY, eventOpts.clientX, eventOpts.clientY, eventOpts.ctrlKey, eventOpts.altKey, eventOpts.shiftKey, eventOpts.metaKey, eventOpts.button, eventOpts.relatedTarget);
    } catch (e) {
      event = buildBasicEvent(type, options);
    }
    return event;
  };

  buildBasicEvent = function buildBasicEvent(type) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var event = document.createEvent('Events');
    event.initEvent(type, true, true);
    _emberViewsSystemJquery.default.extend(event, options);
    return event;
  };

  fireEvent = function fireEvent(element, type) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    if (!element) {
      return;
    }
    var event = undefined;
    if (keyboardEventTypes.indexOf(type) > -1) {
      event = buildKeyboardEvent(type, options);
    } else if (mouseEventTypes.indexOf(type) > -1) {
      var rect = element.getBoundingClientRect();
      var x = rect.left + 1;
      var y = rect.top + 1;
      var simulatedCoordinates = {
        screenX: x + 5,
        screenY: y + 95,
        clientX: x,
        clientY: y
      };
      event = buildMouseEvent(type, _emberViewsSystemJquery.default.extend(simulatedCoordinates, options));
    } else {
      event = buildBasicEvent(type, options);
    }
    element.dispatchEvent(event);
  };

  focus = function focus(el) {
    if (!el) {
      return;
    }
    var $el = _emberViewsSystemJquery.default(el);
    if ($el.is(':input, [contenteditable=true]')) {
      var type = $el.prop('type');
      if (type !== 'checkbox' && type !== 'radio' && type !== 'hidden') {
        _emberMetalRun_loop.default(null, function () {
          // Firefox does not trigger the `focusin` event if the window
          // does not have focus. If the document doesn't have focus just
          // use trigger('focusin') instead.

          if (!document.hasFocus || document.hasFocus()) {
            el.focus();
          } else {
            $el.trigger('focusin');
          }
        });
      }
    }
  };

  function currentRouteName(app) {
    var routingService = app.__container__.lookup('service:-routing');

    return _emberMetalProperty_get.get(routingService, 'currentRouteName');
  }

  function currentPath(app) {
    var routingService = app.__container__.lookup('service:-routing');

    return _emberMetalProperty_get.get(routingService, 'currentPath');
  }

  function currentURL(app) {
    var router = app.__container__.lookup('router:main');

    return _emberMetalProperty_get.get(router, 'location').getURL();
  }

  function pauseTest() {
    _emberTestingTest.default.adapter.asyncStart();
    return new _emberRuntimeExtRsvp.default.Promise(function () {}, 'TestAdapter paused promise');
  }

  function visit(app, url) {
    var router = app.__container__.lookup('router:main');
    var shouldHandleURL = false;

    app.boot().then(function () {
      router.location.setURL(url);

      if (shouldHandleURL) {
        _emberMetalRun_loop.default(app.__deprecatedInstance__, 'handleURL', url);
      }
    });

    if (app._readinessDeferrals > 0) {
      router['initialURL'] = url;
      _emberMetalRun_loop.default(app, 'advanceReadiness');
      delete router['initialURL'];
    } else {
      shouldHandleURL = true;
    }

    return app.testHelpers.wait();
  }

  function click(app, selector, context) {
    var $el = app.testHelpers.findWithAssert(selector, context);
    var el = $el[0];

    _emberMetalRun_loop.default(null, fireEvent, el, 'mousedown');

    focus(el);

    _emberMetalRun_loop.default(null, fireEvent, el, 'mouseup');
    _emberMetalRun_loop.default(null, fireEvent, el, 'click');

    return app.testHelpers.wait();
  }

  function triggerEvent(app, selector, contextOrType, typeOrOptions, possibleOptions) {
    var arity = arguments.length;
    var context, type, options;

    if (arity === 3) {
      // context and options are optional, so this is
      // app, selector, type
      context = null;
      type = contextOrType;
      options = {};
    } else if (arity === 4) {
      // context and options are optional, so this is
      if (typeof typeOrOptions === 'object') {
        // either
        // app, selector, type, options
        context = null;
        type = contextOrType;
        options = typeOrOptions;
      } else {
        // or
        // app, selector, context, type
        context = contextOrType;
        type = typeOrOptions;
        options = {};
      }
    } else {
      context = contextOrType;
      type = typeOrOptions;
      options = possibleOptions;
    }

    var $el = app.testHelpers.findWithAssert(selector, context);
    var el = $el[0];

    _emberMetalRun_loop.default(null, fireEvent, el, type, options);

    return app.testHelpers.wait();
  }

  function keyEvent(app, selector, contextOrType, typeOrKeyCode, keyCode) {
    var context, type;

    if (typeof keyCode === 'undefined') {
      context = null;
      keyCode = typeOrKeyCode;
      type = contextOrType;
    } else {
      context = contextOrType;
      type = typeOrKeyCode;
    }

    return app.testHelpers.triggerEvent(selector, context, type, { keyCode: keyCode, which: keyCode });
  }

  function fillIn(app, selector, contextOrText, text) {
    var $el, el, context;
    if (typeof text === 'undefined') {
      text = contextOrText;
    } else {
      context = contextOrText;
    }
    $el = app.testHelpers.findWithAssert(selector, context);
    el = $el[0];
    focus(el);
    _emberMetalRun_loop.default(function () {
      $el.val(text);
      fireEvent(el, 'input');
      fireEvent(el, 'change');
    });
    return app.testHelpers.wait();
  }

  function findWithAssert(app, selector, context) {
    var $el = app.testHelpers.find(selector, context);
    if ($el.length === 0) {
      throw new _emberMetalError.default('Element ' + selector + ' not found.');
    }
    return $el;
  }

  function find(app, selector, context) {
    var $el;
    context = context || _emberMetalProperty_get.get(app, 'rootElement');
    $el = app.$(selector, context);

    return $el;
  }

  function andThen(app, callback) {
    return app.testHelpers.wait(callback(app));
  }

  function wait(app, value) {
    return new _emberRuntimeExtRsvp.default.Promise(function (resolve) {
      var router = app.__container__.lookup('router:main');

      // Every 10ms, poll for the async thing to have finished
      var watcher = setInterval(function () {
        // 1. If the router is loading, keep polling
        var routerIsLoading = router.router && !!router.router.activeTransition;
        if (routerIsLoading) {
          return;
        }

        // 2. If there are pending Ajax requests, keep polling
        if (_emberTestingTest.default.pendingAjaxRequests) {
          return;
        }

        // 3. If there are scheduled timers or we are inside of a run loop, keep polling
        if (_emberMetalRun_loop.default.hasScheduledTimers() || _emberMetalRun_loop.default.currentRunLoop) {
          return;
        }
        if (_emberTestingTest.default.waiters && _emberTestingTest.default.waiters.any(function (waiter) {
          var context = waiter[0];
          var callback = waiter[1];
          return !callback.call(context);
        })) {
          return;
        }
        // Stop polling
        clearInterval(watcher);

        // Synchronously resolve the promise
        _emberMetalRun_loop.default(null, resolve, value);
      }, 10);
    });
  }

  /**
    Loads a route, sets up any controllers, and renders any templates associated
    with the route as though a real user had triggered the route change while
    using your app.
  
    Example:
  
    ```javascript
    visit('posts/index').then(function() {
      // assert something
    });
    ```
  
    @method visit
    @param {String} url the name of the route
    @return {RSVP.Promise}
    @public
  */
  asyncHelper('visit', visit);

  /**
    Clicks an element and triggers any actions triggered by the element's `click`
    event.
  
    Example:
  
    ```javascript
    click('.some-jQuery-selector').then(function() {
      // assert something
    });
    ```
  
    @method click
    @param {String} selector jQuery selector for finding element on the DOM
    @return {RSVP.Promise}
    @public
  */
  asyncHelper('click', click);

  /**
    Simulates a key event, e.g. `keypress`, `keydown`, `keyup` with the desired keyCode
  
    Example:
  
    ```javascript
    keyEvent('.some-jQuery-selector', 'keypress', 13).then(function() {
     // assert something
    });
    ```
  
    @method keyEvent
    @param {String} selector jQuery selector for finding element on the DOM
    @param {String} type the type of key event, e.g. `keypress`, `keydown`, `keyup`
    @param {Number} keyCode the keyCode of the simulated key event
    @return {RSVP.Promise}
    @since 1.5.0
    @public
  */
  asyncHelper('keyEvent', keyEvent);

  /**
    Fills in an input element with some text.
  
    Example:
  
    ```javascript
    fillIn('#email', 'you@example.com').then(function() {
      // assert something
    });
    ```
  
    @method fillIn
    @param {String} selector jQuery selector finding an input element on the DOM
    to fill text with
    @param {String} text text to place inside the input element
    @return {RSVP.Promise}
    @public
  */
  asyncHelper('fillIn', fillIn);

  /**
    Finds an element in the context of the app's container element. A simple alias
    for `app.$(selector)`.
  
    Example:
  
    ```javascript
    var $el = find('.my-selector');
    ```
  
    @method find
    @param {String} selector jQuery string selector for element lookup
    @return {Object} jQuery object representing the results of the query
    @public
  */
  helper('find', find);

  /**
    Like `find`, but throws an error if the element selector returns no results.
  
    Example:
  
    ```javascript
    var $el = findWithAssert('.doesnt-exist'); // throws error
    ```
  
    @method findWithAssert
    @param {String} selector jQuery selector string for finding an element within
    the DOM
    @return {Object} jQuery object representing the results of the query
    @throws {Error} throws error if jQuery object returned has a length of 0
    @public
  */
  helper('findWithAssert', findWithAssert);

  /**
    Causes the run loop to process any pending events. This is used to ensure that
    any async operations from other helpers (or your assertions) have been processed.
  
    This is most often used as the return value for the helper functions (see 'click',
    'fillIn','visit',etc).
  
    Example:
  
    ```javascript
    Ember.Test.registerAsyncHelper('loginUser', function(app, username, password) {
      visit('secured/path/here')
      .fillIn('#username', username)
      .fillIn('#password', password)
      .click('.submit')
  
      return app.testHelpers.wait();
    });
  
    @method wait
    @param {Object} value The value to be returned.
    @return {RSVP.Promise}
    @public
  */
  asyncHelper('wait', wait);
  asyncHelper('andThen', andThen);

  /**
    Returns the currently active route name.
  
  Example:
  
  ```javascript
  function validateRouteName() {
    equal(currentRouteName(), 'some.path', "correct route was transitioned into.");
  }
  
  visit('/some/path').then(validateRouteName)
  ```
  
  @method currentRouteName
  @return {Object} The name of the currently active route.
  @since 1.5.0
  @public
  */
  helper('currentRouteName', currentRouteName);

  /**
    Returns the current path.
  
  Example:
  
  ```javascript
  function validateURL() {
    equal(currentPath(), 'some.path.index', "correct path was transitioned into.");
  }
  
  click('#some-link-id').then(validateURL);
  ```
  
  @method currentPath
  @return {Object} The currently active path.
  @since 1.5.0
  @public
  */
  helper('currentPath', currentPath);

  /**
    Returns the current URL.
  
  Example:
  
  ```javascript
  function validateURL() {
    equal(currentURL(), '/some/path', "correct URL was transitioned into.");
  }
  
  click('#some-link-id').then(validateURL);
  ```
  
  @method currentURL
  @return {Object} The currently active URL.
  @since 1.5.0
  @public
  */
  helper('currentURL', currentURL);

  /**
   Pauses the current test - this is useful for debugging while testing or for test-driving.
   It allows you to inspect the state of your application at any point.
  
   Example (The test will pause before clicking the button):
  
   ```javascript
   visit('/')
   return pauseTest();
  
   click('.btn');
   ```
  
   @since 1.9.0
   @method pauseTest
   @return {Object} A promise that will never resolve
   @public
  */
  helper('pauseTest', pauseTest);

  /**
    Triggers the given DOM event on the element identified by the provided selector.
  
    Example:
  
    ```javascript
    triggerEvent('#some-elem-id', 'blur');
    ```
  
    This is actually used internally by the `keyEvent` helper like so:
  
    ```javascript
    triggerEvent('#some-elem-id', 'keypress', { keyCode: 13 });
    ```
  
   @method triggerEvent
   @param {String} selector jQuery selector for finding element on the DOM
   @param {String} [context] jQuery selector that will limit the selector
                             argument to find only within the context's children
   @param {String} type The event type to be triggered.
   @param {Object} [options] The options to be passed to jQuery.Event.
   @return {RSVP.Promise}
   @since 1.5.0
   @public
  */
  asyncHelper('triggerEvent', triggerEvent);
});

// Firefox does not trigger the `focusin` event if the window
// does not have focus. If the document doesn't have focus just
// use trigger('focusin') instead.
//# sourceMappingURL=data:application/json;base64,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QUM7T0FDM0IsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNSLENBQUMsQ0FBQztHQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCRCxhQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUI1QixhQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQjVCLGFBQVcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JsQyxhQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCOUIsUUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JyQixRQUFNLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJ6QyxhQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFCLGFBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJoQyxRQUFNLENBQUMsa0JBQWtCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQjdDLFFBQU0sQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JuQyxRQUFNLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CakMsUUFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkIvQixhQUFXLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDIiwiZmlsZSI6ImVtYmVyLXRlc3RpbmcvaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldCB9IGZyb20gJ2VtYmVyLW1ldGFsL3Byb3BlcnR5X2dldCc7XG5pbXBvcnQgRW1iZXJFcnJvciBmcm9tICdlbWJlci1tZXRhbC9lcnJvcic7XG5pbXBvcnQgcnVuIGZyb20gJ2VtYmVyLW1ldGFsL3J1bl9sb29wJztcbmltcG9ydCBqUXVlcnkgZnJvbSAnZW1iZXItdmlld3Mvc3lzdGVtL2pxdWVyeSc7XG5pbXBvcnQgVGVzdCBmcm9tICdlbWJlci10ZXN0aW5nL3Rlc3QnO1xuaW1wb3J0IFJTVlAgZnJvbSAnZW1iZXItcnVudGltZS9leHQvcnN2cCc7XG5pbXBvcnQgaXNFbmFibGVkIGZyb20gJ2VtYmVyLW1ldGFsL2ZlYXR1cmVzJztcblxuLyoqXG5AbW9kdWxlIGVtYmVyXG5Ac3VibW9kdWxlIGVtYmVyLXRlc3RpbmdcbiovXG5cbnZhciBoZWxwZXIgPSBUZXN0LnJlZ2lzdGVySGVscGVyO1xudmFyIGFzeW5jSGVscGVyID0gVGVzdC5yZWdpc3RlckFzeW5jSGVscGVyO1xuXG52YXIga2V5Ym9hcmRFdmVudFR5cGVzLCBtb3VzZUV2ZW50VHlwZXMsIGJ1aWxkS2V5Ym9hcmRFdmVudCwgYnVpbGRNb3VzZUV2ZW50LCBidWlsZEJhc2ljRXZlbnQsIGZpcmVFdmVudCwgZm9jdXM7XG5cbmlmIChpc0VuYWJsZWQoJ2VtYmVyLXRlc3QtaGVscGVycy1maXJlLW5hdGl2ZS1ldmVudHMnKSkge1xuICBsZXQgZGVmYXVsdEV2ZW50T3B0aW9ucyA9IHsgY2FuQnViYmxlOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlIH07XG4gIGtleWJvYXJkRXZlbnRUeXBlcyA9IFsna2V5ZG93bicsICdrZXlwcmVzcycsICdrZXl1cCddO1xuICBtb3VzZUV2ZW50VHlwZXMgPSBbJ2NsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZXVwJywgJ2RibGNsaWNrJywgJ21vdXNlZW50ZXInLCAnbW91c2VsZWF2ZScsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJ107XG5cblxuICBidWlsZEtleWJvYXJkRXZlbnQgPSBmdW5jdGlvbiBidWlsZEtleWJvYXJkRXZlbnQodHlwZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IGV2ZW50O1xuICAgIHRyeSB7XG4gICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdLZXlFdmVudHMnKTtcbiAgICAgIGxldCBldmVudE9wdHMgPSBqUXVlcnkuZXh0ZW5kKHt9LCBkZWZhdWx0RXZlbnRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgIGV2ZW50LmluaXRLZXlFdmVudChcbiAgICAgICAgdHlwZSxcbiAgICAgICAgZXZlbnRPcHRzLmNhbkJ1YmJsZSxcbiAgICAgICAgZXZlbnRPcHRzLmNhbmNlbGFibGUsXG4gICAgICAgIHdpbmRvdyxcbiAgICAgICAgZXZlbnRPcHRzLmN0cmxLZXksXG4gICAgICAgIGV2ZW50T3B0cy5hbHRLZXksXG4gICAgICAgIGV2ZW50T3B0cy5zaGlmdEtleSxcbiAgICAgICAgZXZlbnRPcHRzLm1ldGFLZXksXG4gICAgICAgIGV2ZW50T3B0cy5rZXlDb2RlLFxuICAgICAgICBldmVudE9wdHMuY2hhckNvZGVcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXZlbnQgPSBidWlsZEJhc2ljRXZlbnQodHlwZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBldmVudDtcbiAgfTtcblxuICBidWlsZE1vdXNlRXZlbnQgPSBmdW5jdGlvbiBidWlsZE1vdXNlRXZlbnQodHlwZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IGV2ZW50O1xuICAgIHRyeSB7XG4gICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuICAgICAgbGV0IGV2ZW50T3B0cyA9IGpRdWVyeS5leHRlbmQoe30sIGRlZmF1bHRFdmVudE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgZXZlbnQuaW5pdE1vdXNlRXZlbnQoXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV2ZW50T3B0cy5jYW5CdWJibGUsXG4gICAgICAgIGV2ZW50T3B0cy5jYW5jZWxhYmxlLFxuICAgICAgICB3aW5kb3csXG4gICAgICAgIGV2ZW50T3B0cy5kZXRhaWwsXG4gICAgICAgIGV2ZW50T3B0cy5zY3JlZW5YLFxuICAgICAgICBldmVudE9wdHMuc2NyZWVuWSxcbiAgICAgICAgZXZlbnRPcHRzLmNsaWVudFgsXG4gICAgICAgIGV2ZW50T3B0cy5jbGllbnRZLFxuICAgICAgICBldmVudE9wdHMuY3RybEtleSxcbiAgICAgICAgZXZlbnRPcHRzLmFsdEtleSxcbiAgICAgICAgZXZlbnRPcHRzLnNoaWZ0S2V5LFxuICAgICAgICBldmVudE9wdHMubWV0YUtleSxcbiAgICAgICAgZXZlbnRPcHRzLmJ1dHRvbixcbiAgICAgICAgZXZlbnRPcHRzLnJlbGF0ZWRUYXJnZXQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGV2ZW50ID0gYnVpbGRCYXNpY0V2ZW50KHR5cGUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG4gIH07XG5cbiAgYnVpbGRCYXNpY0V2ZW50ID0gZnVuY3Rpb24gYnVpbGRCYXNpY0V2ZW50KHR5cGUsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudHMnKTtcbiAgICBldmVudC5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgalF1ZXJ5LmV4dGVuZChldmVudCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9O1xuXG4gIGZpcmVFdmVudCA9IGZ1bmN0aW9uIGZpcmVFdmVudChlbGVtZW50LCB0eXBlLCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGV2ZW50O1xuICAgIGlmIChrZXlib2FyZEV2ZW50VHlwZXMuaW5kZXhPZih0eXBlKSA+IC0xKSB7XG4gICAgICBldmVudCA9IGJ1aWxkS2V5Ym9hcmRFdmVudCh0eXBlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKG1vdXNlRXZlbnRUeXBlcy5pbmRleE9mKHR5cGUpID4gLTEpIHtcbiAgICAgIGxldCByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGxldCB4ID0gcmVjdC5sZWZ0ICsgMTtcbiAgICAgIGxldCB5ID0gcmVjdC50b3AgKyAxO1xuICAgICAgbGV0IHNpbXVsYXRlZENvb3JkaW5hdGVzID0ge1xuICAgICAgICBzY3JlZW5YOiB4ICsgNSxcbiAgICAgICAgc2NyZWVuWTogeSArIDk1LFxuICAgICAgICBjbGllbnRYOiB4LFxuICAgICAgICBjbGllbnRZOiB5XG4gICAgICB9O1xuICAgICAgZXZlbnQgPSBidWlsZE1vdXNlRXZlbnQodHlwZSwgalF1ZXJ5LmV4dGVuZChzaW11bGF0ZWRDb29yZGluYXRlcywgb3B0aW9ucykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudCA9IGJ1aWxkQmFzaWNFdmVudCh0eXBlLCBvcHRpb25zKTtcbiAgICB9XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfTtcblxuICBmb2N1cyA9IGZ1bmN0aW9uIGZvY3VzKGVsKSB7XG4gICAgaWYgKCFlbCkgeyByZXR1cm47IH1cbiAgICBsZXQgJGVsID0galF1ZXJ5KGVsKTtcbiAgICBpZiAoJGVsLmlzKCc6aW5wdXQsIFtjb250ZW50ZWRpdGFibGU9dHJ1ZV0nKSkge1xuICAgICAgbGV0IHR5cGUgPSAkZWwucHJvcCgndHlwZScpO1xuICAgICAgaWYgKHR5cGUgIT09ICdjaGVja2JveCcgJiYgdHlwZSAhPT0gJ3JhZGlvJyAmJiB0eXBlICE9PSAnaGlkZGVuJykge1xuICAgICAgICBydW4obnVsbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gRmlyZWZveCBkb2VzIG5vdCB0cmlnZ2VyIHRoZSBgZm9jdXNpbmAgZXZlbnQgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgIC8vIGRvZXMgbm90IGhhdmUgZm9jdXMuIElmIHRoZSBkb2N1bWVudCBkb2Vzbid0IGhhdmUgZm9jdXMganVzdFxuICAgICAgICAgIC8vIHVzZSB0cmlnZ2VyKCdmb2N1c2luJykgaW5zdGVhZC5cblxuICAgICAgICAgIGlmICghZG9jdW1lbnQuaGFzRm9jdXMgfHwgZG9jdW1lbnQuaGFzRm9jdXMoKSkge1xuICAgICAgICAgICAgZWwuZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJGVsLnRyaWdnZXIoJ2ZvY3VzaW4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0gZWxzZSB7XG4gIGZvY3VzID0gZnVuY3Rpb24gZm9jdXMoZWwpIHtcbiAgICBpZiAoZWwgJiYgZWwuaXMoJzppbnB1dCwgW2NvbnRlbnRlZGl0YWJsZT10cnVlXScpKSB7XG4gICAgICB2YXIgdHlwZSA9IGVsLnByb3AoJ3R5cGUnKTtcbiAgICAgIGlmICh0eXBlICE9PSAnY2hlY2tib3gnICYmIHR5cGUgIT09ICdyYWRpbycgJiYgdHlwZSAhPT0gJ2hpZGRlbicpIHtcbiAgICAgICAgcnVuKGVsLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBGaXJlZm94IGRvZXMgbm90IHRyaWdnZXIgdGhlIGBmb2N1c2luYCBldmVudCBpZiB0aGUgd2luZG93XG4gICAgICAgICAgLy8gZG9lcyBub3QgaGF2ZSBmb2N1cy4gSWYgdGhlIGRvY3VtZW50IGRvZXNuJ3QgaGF2ZSBmb2N1cyBqdXN0XG4gICAgICAgICAgLy8gdXNlIHRyaWdnZXIoJ2ZvY3VzaW4nKSBpbnN0ZWFkLlxuICAgICAgICAgIGlmICghZG9jdW1lbnQuaGFzRm9jdXMgfHwgZG9jdW1lbnQuaGFzRm9jdXMoKSkge1xuICAgICAgICAgICAgdGhpcy5mb2N1cygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2ZvY3VzaW4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmaXJlRXZlbnQgPSBmdW5jdGlvbiBmaXJlRXZlbnQoZWxlbWVudCwgdHlwZSwgb3B0aW9ucykge1xuICAgIHZhciBldmVudCA9IGpRdWVyeS5FdmVudCh0eXBlLCBvcHRpb25zKTtcbiAgICBqUXVlcnkoZWxlbWVudCkudHJpZ2dlcihldmVudCk7XG4gIH07XG59XG5cblxuZnVuY3Rpb24gY3VycmVudFJvdXRlTmFtZShhcHApIHtcbiAgdmFyIHJvdXRpbmdTZXJ2aWNlID0gYXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdzZXJ2aWNlOi1yb3V0aW5nJyk7XG5cbiAgcmV0dXJuIGdldChyb3V0aW5nU2VydmljZSwgJ2N1cnJlbnRSb3V0ZU5hbWUnKTtcbn1cblxuZnVuY3Rpb24gY3VycmVudFBhdGgoYXBwKSB7XG4gIHZhciByb3V0aW5nU2VydmljZSA9IGFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnc2VydmljZTotcm91dGluZycpO1xuXG4gIHJldHVybiBnZXQocm91dGluZ1NlcnZpY2UsICdjdXJyZW50UGF0aCcpO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50VVJMKGFwcCkge1xuICB2YXIgcm91dGVyID0gYXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdyb3V0ZXI6bWFpbicpO1xuXG4gIHJldHVybiBnZXQocm91dGVyLCAnbG9jYXRpb24nKS5nZXRVUkwoKTtcbn1cblxuZnVuY3Rpb24gcGF1c2VUZXN0KCkge1xuICBUZXN0LmFkYXB0ZXIuYXN5bmNTdGFydCgpO1xuICByZXR1cm4gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbigpIHsgfSwgJ1Rlc3RBZGFwdGVyIHBhdXNlZCBwcm9taXNlJyk7XG59XG5cbmZ1bmN0aW9uIHZpc2l0KGFwcCwgdXJsKSB7XG4gIHZhciByb3V0ZXIgPSBhcHAuX19jb250YWluZXJfXy5sb29rdXAoJ3JvdXRlcjptYWluJyk7XG4gIHZhciBzaG91bGRIYW5kbGVVUkwgPSBmYWxzZTtcblxuICBhcHAuYm9vdCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgcm91dGVyLmxvY2F0aW9uLnNldFVSTCh1cmwpO1xuXG4gICAgaWYgKHNob3VsZEhhbmRsZVVSTCkge1xuICAgICAgcnVuKGFwcC5fX2RlcHJlY2F0ZWRJbnN0YW5jZV9fLCAnaGFuZGxlVVJMJywgdXJsKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChhcHAuX3JlYWRpbmVzc0RlZmVycmFscyA+IDApIHtcbiAgICByb3V0ZXJbJ2luaXRpYWxVUkwnXSA9IHVybDtcbiAgICBydW4oYXBwLCAnYWR2YW5jZVJlYWRpbmVzcycpO1xuICAgIGRlbGV0ZSByb3V0ZXJbJ2luaXRpYWxVUkwnXTtcbiAgfSBlbHNlIHtcbiAgICBzaG91bGRIYW5kbGVVUkwgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGFwcC50ZXN0SGVscGVycy53YWl0KCk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrKGFwcCwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgbGV0ICRlbCA9IGFwcC50ZXN0SGVscGVycy5maW5kV2l0aEFzc2VydChzZWxlY3RvciwgY29udGV4dCk7XG4gIGxldCBlbCA9ICRlbFswXTtcblxuICBydW4obnVsbCwgZmlyZUV2ZW50LCBlbCwgJ21vdXNlZG93bicpO1xuXG4gIGZvY3VzKGVsKTtcblxuICBydW4obnVsbCwgZmlyZUV2ZW50LCBlbCwgJ21vdXNldXAnKTtcbiAgcnVuKG51bGwsIGZpcmVFdmVudCwgZWwsICdjbGljaycpO1xuXG4gIHJldHVybiBhcHAudGVzdEhlbHBlcnMud2FpdCgpO1xufVxuXG5mdW5jdGlvbiB0cmlnZ2VyRXZlbnQoYXBwLCBzZWxlY3RvciwgY29udGV4dE9yVHlwZSwgdHlwZU9yT3B0aW9ucywgcG9zc2libGVPcHRpb25zKSB7XG4gIHZhciBhcml0eSA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHZhciBjb250ZXh0LCB0eXBlLCBvcHRpb25zO1xuXG4gIGlmIChhcml0eSA9PT0gMykge1xuICAgIC8vIGNvbnRleHQgYW5kIG9wdGlvbnMgYXJlIG9wdGlvbmFsLCBzbyB0aGlzIGlzXG4gICAgLy8gYXBwLCBzZWxlY3RvciwgdHlwZVxuICAgIGNvbnRleHQgPSBudWxsO1xuICAgIHR5cGUgPSBjb250ZXh0T3JUeXBlO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfSBlbHNlIGlmIChhcml0eSA9PT0gNCkge1xuICAgIC8vIGNvbnRleHQgYW5kIG9wdGlvbnMgYXJlIG9wdGlvbmFsLCBzbyB0aGlzIGlzXG4gICAgaWYgKHR5cGVvZiB0eXBlT3JPcHRpb25zID09PSAnb2JqZWN0JykgeyAgLy8gZWl0aGVyXG4gICAgICAvLyBhcHAsIHNlbGVjdG9yLCB0eXBlLCBvcHRpb25zXG4gICAgICBjb250ZXh0ID0gbnVsbDtcbiAgICAgIHR5cGUgPSBjb250ZXh0T3JUeXBlO1xuICAgICAgb3B0aW9ucyA9IHR5cGVPck9wdGlvbnM7XG4gICAgfSBlbHNlIHsgLy8gb3JcbiAgICAgIC8vIGFwcCwgc2VsZWN0b3IsIGNvbnRleHQsIHR5cGVcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0T3JUeXBlO1xuICAgICAgdHlwZSA9IHR5cGVPck9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnRleHQgPSBjb250ZXh0T3JUeXBlO1xuICAgIHR5cGUgPSB0eXBlT3JPcHRpb25zO1xuICAgIG9wdGlvbnMgPSBwb3NzaWJsZU9wdGlvbnM7XG4gIH1cblxuICB2YXIgJGVsID0gYXBwLnRlc3RIZWxwZXJzLmZpbmRXaXRoQXNzZXJ0KHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgdmFyIGVsID0gJGVsWzBdO1xuXG4gIHJ1bihudWxsLCBmaXJlRXZlbnQsIGVsLCB0eXBlLCBvcHRpb25zKTtcblxuICByZXR1cm4gYXBwLnRlc3RIZWxwZXJzLndhaXQoKTtcbn1cblxuZnVuY3Rpb24ga2V5RXZlbnQoYXBwLCBzZWxlY3RvciwgY29udGV4dE9yVHlwZSwgdHlwZU9yS2V5Q29kZSwga2V5Q29kZSkge1xuICB2YXIgY29udGV4dCwgdHlwZTtcblxuICBpZiAodHlwZW9mIGtleUNvZGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29udGV4dCA9IG51bGw7XG4gICAga2V5Q29kZSA9IHR5cGVPcktleUNvZGU7XG4gICAgdHlwZSA9IGNvbnRleHRPclR5cGU7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dCA9IGNvbnRleHRPclR5cGU7XG4gICAgdHlwZSA9IHR5cGVPcktleUNvZGU7XG4gIH1cblxuICByZXR1cm4gYXBwLnRlc3RIZWxwZXJzLnRyaWdnZXJFdmVudChzZWxlY3RvciwgY29udGV4dCwgdHlwZSwgeyBrZXlDb2RlOiBrZXlDb2RlLCB3aGljaDoga2V5Q29kZSB9KTtcbn1cblxuZnVuY3Rpb24gZmlsbEluKGFwcCwgc2VsZWN0b3IsIGNvbnRleHRPclRleHQsIHRleHQpIHtcbiAgdmFyICRlbCwgZWwsIGNvbnRleHQ7XG4gIGlmICh0eXBlb2YgdGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0ZXh0ID0gY29udGV4dE9yVGV4dDtcbiAgfSBlbHNlIHtcbiAgICBjb250ZXh0ID0gY29udGV4dE9yVGV4dDtcbiAgfVxuICAkZWwgPSBhcHAudGVzdEhlbHBlcnMuZmluZFdpdGhBc3NlcnQoc2VsZWN0b3IsIGNvbnRleHQpO1xuICBlbCA9ICRlbFswXTtcbiAgZm9jdXMoZWwpO1xuICBydW4oZnVuY3Rpb24oKSB7XG4gICAgJGVsLnZhbCh0ZXh0KTtcbiAgICBmaXJlRXZlbnQoZWwsICdpbnB1dCcpO1xuICAgIGZpcmVFdmVudChlbCwgJ2NoYW5nZScpO1xuICB9KTtcbiAgcmV0dXJuIGFwcC50ZXN0SGVscGVycy53YWl0KCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRXaXRoQXNzZXJ0KGFwcCwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyICRlbCA9IGFwcC50ZXN0SGVscGVycy5maW5kKHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgaWYgKCRlbC5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRW1iZXJFcnJvcignRWxlbWVudCAnICsgc2VsZWN0b3IgKyAnIG5vdCBmb3VuZC4nKTtcbiAgfVxuICByZXR1cm4gJGVsO1xufVxuXG5mdW5jdGlvbiBmaW5kKGFwcCwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyICRlbDtcbiAgY29udGV4dCA9IGNvbnRleHQgfHwgZ2V0KGFwcCwgJ3Jvb3RFbGVtZW50Jyk7XG4gICRlbCA9IGFwcC4kKHNlbGVjdG9yLCBjb250ZXh0KTtcblxuICByZXR1cm4gJGVsO1xufVxuXG5mdW5jdGlvbiBhbmRUaGVuKGFwcCwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIGFwcC50ZXN0SGVscGVycy53YWl0KGNhbGxiYWNrKGFwcCkpO1xufVxuXG5mdW5jdGlvbiB3YWl0KGFwcCwgdmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIHZhciByb3V0ZXIgPSBhcHAuX19jb250YWluZXJfXy5sb29rdXAoJ3JvdXRlcjptYWluJyk7XG5cbiAgICAvLyBFdmVyeSAxMG1zLCBwb2xsIGZvciB0aGUgYXN5bmMgdGhpbmcgdG8gaGF2ZSBmaW5pc2hlZFxuICAgIHZhciB3YXRjaGVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAvLyAxLiBJZiB0aGUgcm91dGVyIGlzIGxvYWRpbmcsIGtlZXAgcG9sbGluZ1xuICAgICAgdmFyIHJvdXRlcklzTG9hZGluZyA9IHJvdXRlci5yb3V0ZXIgJiYgISFyb3V0ZXIucm91dGVyLmFjdGl2ZVRyYW5zaXRpb247XG4gICAgICBpZiAocm91dGVySXNMb2FkaW5nKSB7IHJldHVybjsgfVxuXG4gICAgICAvLyAyLiBJZiB0aGVyZSBhcmUgcGVuZGluZyBBamF4IHJlcXVlc3RzLCBrZWVwIHBvbGxpbmdcbiAgICAgIGlmIChUZXN0LnBlbmRpbmdBamF4UmVxdWVzdHMpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIDMuIElmIHRoZXJlIGFyZSBzY2hlZHVsZWQgdGltZXJzIG9yIHdlIGFyZSBpbnNpZGUgb2YgYSBydW4gbG9vcCwga2VlcCBwb2xsaW5nXG4gICAgICBpZiAocnVuLmhhc1NjaGVkdWxlZFRpbWVycygpIHx8IHJ1bi5jdXJyZW50UnVuTG9vcCkgeyByZXR1cm47IH1cbiAgICAgIGlmIChUZXN0LndhaXRlcnMgJiYgVGVzdC53YWl0ZXJzLmFueShmdW5jdGlvbih3YWl0ZXIpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB3YWl0ZXJbMF07XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHdhaXRlclsxXTtcbiAgICAgICAgcmV0dXJuICFjYWxsYmFjay5jYWxsKGNvbnRleHQpO1xuICAgICAgfSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gU3RvcCBwb2xsaW5nXG4gICAgICBjbGVhckludGVydmFsKHdhdGNoZXIpO1xuXG4gICAgICAvLyBTeW5jaHJvbm91c2x5IHJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgIHJ1bihudWxsLCByZXNvbHZlLCB2YWx1ZSk7XG4gICAgfSwgMTApO1xuICB9KTtcbn1cblxuXG4vKipcbiAgTG9hZHMgYSByb3V0ZSwgc2V0cyB1cCBhbnkgY29udHJvbGxlcnMsIGFuZCByZW5kZXJzIGFueSB0ZW1wbGF0ZXMgYXNzb2NpYXRlZFxuICB3aXRoIHRoZSByb3V0ZSBhcyB0aG91Z2ggYSByZWFsIHVzZXIgaGFkIHRyaWdnZXJlZCB0aGUgcm91dGUgY2hhbmdlIHdoaWxlXG4gIHVzaW5nIHlvdXIgYXBwLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2aXNpdCgncG9zdHMvaW5kZXgnKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIC8vIGFzc2VydCBzb21ldGhpbmdcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgdmlzaXRcbiAgQHBhcmFtIHtTdHJpbmd9IHVybCB0aGUgbmFtZSBvZiB0aGUgcm91dGVcbiAgQHJldHVybiB7UlNWUC5Qcm9taXNlfVxuICBAcHVibGljXG4qL1xuYXN5bmNIZWxwZXIoJ3Zpc2l0JywgdmlzaXQpO1xuXG4vKipcbiAgQ2xpY2tzIGFuIGVsZW1lbnQgYW5kIHRyaWdnZXJzIGFueSBhY3Rpb25zIHRyaWdnZXJlZCBieSB0aGUgZWxlbWVudCdzIGBjbGlja2BcbiAgZXZlbnQuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGNsaWNrKCcuc29tZS1qUXVlcnktc2VsZWN0b3InKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIC8vIGFzc2VydCBzb21ldGhpbmdcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgY2xpY2tcbiAgQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGpRdWVyeSBzZWxlY3RvciBmb3IgZmluZGluZyBlbGVtZW50IG9uIHRoZSBET01cbiAgQHJldHVybiB7UlNWUC5Qcm9taXNlfVxuICBAcHVibGljXG4qL1xuYXN5bmNIZWxwZXIoJ2NsaWNrJywgY2xpY2spO1xuXG4vKipcbiAgU2ltdWxhdGVzIGEga2V5IGV2ZW50LCBlLmcuIGBrZXlwcmVzc2AsIGBrZXlkb3duYCwgYGtleXVwYCB3aXRoIHRoZSBkZXNpcmVkIGtleUNvZGVcblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAga2V5RXZlbnQoJy5zb21lLWpRdWVyeS1zZWxlY3RvcicsICdrZXlwcmVzcycsIDEzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgLy8gYXNzZXJ0IHNvbWV0aGluZ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCBrZXlFdmVudFxuICBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgalF1ZXJ5IHNlbGVjdG9yIGZvciBmaW5kaW5nIGVsZW1lbnQgb24gdGhlIERPTVxuICBAcGFyYW0ge1N0cmluZ30gdHlwZSB0aGUgdHlwZSBvZiBrZXkgZXZlbnQsIGUuZy4gYGtleXByZXNzYCwgYGtleWRvd25gLCBga2V5dXBgXG4gIEBwYXJhbSB7TnVtYmVyfSBrZXlDb2RlIHRoZSBrZXlDb2RlIG9mIHRoZSBzaW11bGF0ZWQga2V5IGV2ZW50XG4gIEByZXR1cm4ge1JTVlAuUHJvbWlzZX1cbiAgQHNpbmNlIDEuNS4wXG4gIEBwdWJsaWNcbiovXG5hc3luY0hlbHBlcigna2V5RXZlbnQnLCBrZXlFdmVudCk7XG5cbi8qKlxuICBGaWxscyBpbiBhbiBpbnB1dCBlbGVtZW50IHdpdGggc29tZSB0ZXh0LlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBmaWxsSW4oJyNlbWFpbCcsICd5b3VAZXhhbXBsZS5jb20nKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIC8vIGFzc2VydCBzb21ldGhpbmdcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgZmlsbEluXG4gIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBqUXVlcnkgc2VsZWN0b3IgZmluZGluZyBhbiBpbnB1dCBlbGVtZW50IG9uIHRoZSBET01cbiAgdG8gZmlsbCB0ZXh0IHdpdGhcbiAgQHBhcmFtIHtTdHJpbmd9IHRleHQgdGV4dCB0byBwbGFjZSBpbnNpZGUgdGhlIGlucHV0IGVsZW1lbnRcbiAgQHJldHVybiB7UlNWUC5Qcm9taXNlfVxuICBAcHVibGljXG4qL1xuYXN5bmNIZWxwZXIoJ2ZpbGxJbicsIGZpbGxJbik7XG5cbi8qKlxuICBGaW5kcyBhbiBlbGVtZW50IGluIHRoZSBjb250ZXh0IG9mIHRoZSBhcHAncyBjb250YWluZXIgZWxlbWVudC4gQSBzaW1wbGUgYWxpYXNcbiAgZm9yIGBhcHAuJChzZWxlY3RvcilgLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgJGVsID0gZmluZCgnLm15LXNlbGVjdG9yJyk7XG4gIGBgYFxuXG4gIEBtZXRob2QgZmluZFxuICBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgalF1ZXJ5IHN0cmluZyBzZWxlY3RvciBmb3IgZWxlbWVudCBsb29rdXBcbiAgQHJldHVybiB7T2JqZWN0fSBqUXVlcnkgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgcmVzdWx0cyBvZiB0aGUgcXVlcnlcbiAgQHB1YmxpY1xuKi9cbmhlbHBlcignZmluZCcsIGZpbmQpO1xuXG4vKipcbiAgTGlrZSBgZmluZGAsIGJ1dCB0aHJvd3MgYW4gZXJyb3IgaWYgdGhlIGVsZW1lbnQgc2VsZWN0b3IgcmV0dXJucyBubyByZXN1bHRzLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgJGVsID0gZmluZFdpdGhBc3NlcnQoJy5kb2VzbnQtZXhpc3QnKTsgLy8gdGhyb3dzIGVycm9yXG4gIGBgYFxuXG4gIEBtZXRob2QgZmluZFdpdGhBc3NlcnRcbiAgQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGpRdWVyeSBzZWxlY3RvciBzdHJpbmcgZm9yIGZpbmRpbmcgYW4gZWxlbWVudCB3aXRoaW5cbiAgdGhlIERPTVxuICBAcmV0dXJuIHtPYmplY3R9IGpRdWVyeSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSByZXN1bHRzIG9mIHRoZSBxdWVyeVxuICBAdGhyb3dzIHtFcnJvcn0gdGhyb3dzIGVycm9yIGlmIGpRdWVyeSBvYmplY3QgcmV0dXJuZWQgaGFzIGEgbGVuZ3RoIG9mIDBcbiAgQHB1YmxpY1xuKi9cbmhlbHBlcignZmluZFdpdGhBc3NlcnQnLCBmaW5kV2l0aEFzc2VydCk7XG5cbi8qKlxuICBDYXVzZXMgdGhlIHJ1biBsb29wIHRvIHByb2Nlc3MgYW55IHBlbmRpbmcgZXZlbnRzLiBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXRcbiAgYW55IGFzeW5jIG9wZXJhdGlvbnMgZnJvbSBvdGhlciBoZWxwZXJzIChvciB5b3VyIGFzc2VydGlvbnMpIGhhdmUgYmVlbiBwcm9jZXNzZWQuXG5cbiAgVGhpcyBpcyBtb3N0IG9mdGVuIHVzZWQgYXMgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIGhlbHBlciBmdW5jdGlvbnMgKHNlZSAnY2xpY2snLFxuICAnZmlsbEluJywndmlzaXQnLGV0YykuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIEVtYmVyLlRlc3QucmVnaXN0ZXJBc3luY0hlbHBlcignbG9naW5Vc2VyJywgZnVuY3Rpb24oYXBwLCB1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICB2aXNpdCgnc2VjdXJlZC9wYXRoL2hlcmUnKVxuICAgIC5maWxsSW4oJyN1c2VybmFtZScsIHVzZXJuYW1lKVxuICAgIC5maWxsSW4oJyNwYXNzd29yZCcsIHBhc3N3b3JkKVxuICAgIC5jbGljaygnLnN1Ym1pdCcpXG5cbiAgICByZXR1cm4gYXBwLnRlc3RIZWxwZXJzLndhaXQoKTtcbiAgfSk7XG5cbiAgQG1ldGhvZCB3YWl0XG4gIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSBUaGUgdmFsdWUgdG8gYmUgcmV0dXJuZWQuXG4gIEByZXR1cm4ge1JTVlAuUHJvbWlzZX1cbiAgQHB1YmxpY1xuKi9cbmFzeW5jSGVscGVyKCd3YWl0Jywgd2FpdCk7XG5hc3luY0hlbHBlcignYW5kVGhlbicsIGFuZFRoZW4pO1xuXG5cbi8qKlxuICBSZXR1cm5zIHRoZSBjdXJyZW50bHkgYWN0aXZlIHJvdXRlIG5hbWUuXG5cbkV4YW1wbGU6XG5cbmBgYGphdmFzY3JpcHRcbmZ1bmN0aW9uIHZhbGlkYXRlUm91dGVOYW1lKCkge1xuICBlcXVhbChjdXJyZW50Um91dGVOYW1lKCksICdzb21lLnBhdGgnLCBcImNvcnJlY3Qgcm91dGUgd2FzIHRyYW5zaXRpb25lZCBpbnRvLlwiKTtcbn1cblxudmlzaXQoJy9zb21lL3BhdGgnKS50aGVuKHZhbGlkYXRlUm91dGVOYW1lKVxuYGBgXG5cbkBtZXRob2QgY3VycmVudFJvdXRlTmFtZVxuQHJldHVybiB7T2JqZWN0fSBUaGUgbmFtZSBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSByb3V0ZS5cbkBzaW5jZSAxLjUuMFxuQHB1YmxpY1xuKi9cbmhlbHBlcignY3VycmVudFJvdXRlTmFtZScsIGN1cnJlbnRSb3V0ZU5hbWUpO1xuXG4vKipcbiAgUmV0dXJucyB0aGUgY3VycmVudCBwYXRoLlxuXG5FeGFtcGxlOlxuXG5gYGBqYXZhc2NyaXB0XG5mdW5jdGlvbiB2YWxpZGF0ZVVSTCgpIHtcbiAgZXF1YWwoY3VycmVudFBhdGgoKSwgJ3NvbWUucGF0aC5pbmRleCcsIFwiY29ycmVjdCBwYXRoIHdhcyB0cmFuc2l0aW9uZWQgaW50by5cIik7XG59XG5cbmNsaWNrKCcjc29tZS1saW5rLWlkJykudGhlbih2YWxpZGF0ZVVSTCk7XG5gYGBcblxuQG1ldGhvZCBjdXJyZW50UGF0aFxuQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudGx5IGFjdGl2ZSBwYXRoLlxuQHNpbmNlIDEuNS4wXG5AcHVibGljXG4qL1xuaGVscGVyKCdjdXJyZW50UGF0aCcsIGN1cnJlbnRQYXRoKTtcblxuLyoqXG4gIFJldHVybnMgdGhlIGN1cnJlbnQgVVJMLlxuXG5FeGFtcGxlOlxuXG5gYGBqYXZhc2NyaXB0XG5mdW5jdGlvbiB2YWxpZGF0ZVVSTCgpIHtcbiAgZXF1YWwoY3VycmVudFVSTCgpLCAnL3NvbWUvcGF0aCcsIFwiY29ycmVjdCBVUkwgd2FzIHRyYW5zaXRpb25lZCBpbnRvLlwiKTtcbn1cblxuY2xpY2soJyNzb21lLWxpbmstaWQnKS50aGVuKHZhbGlkYXRlVVJMKTtcbmBgYFxuXG5AbWV0aG9kIGN1cnJlbnRVUkxcbkByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnRseSBhY3RpdmUgVVJMLlxuQHNpbmNlIDEuNS4wXG5AcHVibGljXG4qL1xuaGVscGVyKCdjdXJyZW50VVJMJywgY3VycmVudFVSTCk7XG5cbi8qKlxuIFBhdXNlcyB0aGUgY3VycmVudCB0ZXN0IC0gdGhpcyBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZyB3aGlsZSB0ZXN0aW5nIG9yIGZvciB0ZXN0LWRyaXZpbmcuXG4gSXQgYWxsb3dzIHlvdSB0byBpbnNwZWN0IHRoZSBzdGF0ZSBvZiB5b3VyIGFwcGxpY2F0aW9uIGF0IGFueSBwb2ludC5cblxuIEV4YW1wbGUgKFRoZSB0ZXN0IHdpbGwgcGF1c2UgYmVmb3JlIGNsaWNraW5nIHRoZSBidXR0b24pOlxuXG4gYGBgamF2YXNjcmlwdFxuIHZpc2l0KCcvJylcbiByZXR1cm4gcGF1c2VUZXN0KCk7XG5cbiBjbGljaygnLmJ0bicpO1xuIGBgYFxuXG4gQHNpbmNlIDEuOS4wXG4gQG1ldGhvZCBwYXVzZVRlc3RcbiBAcmV0dXJuIHtPYmplY3R9IEEgcHJvbWlzZSB0aGF0IHdpbGwgbmV2ZXIgcmVzb2x2ZVxuIEBwdWJsaWNcbiovXG5oZWxwZXIoJ3BhdXNlVGVzdCcsIHBhdXNlVGVzdCk7XG5cbi8qKlxuICBUcmlnZ2VycyB0aGUgZ2l2ZW4gRE9NIGV2ZW50IG9uIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgdGhlIHByb3ZpZGVkIHNlbGVjdG9yLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB0cmlnZ2VyRXZlbnQoJyNzb21lLWVsZW0taWQnLCAnYmx1cicpO1xuICBgYGBcblxuICBUaGlzIGlzIGFjdHVhbGx5IHVzZWQgaW50ZXJuYWxseSBieSB0aGUgYGtleUV2ZW50YCBoZWxwZXIgbGlrZSBzbzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHRyaWdnZXJFdmVudCgnI3NvbWUtZWxlbS1pZCcsICdrZXlwcmVzcycsIHsga2V5Q29kZTogMTMgfSk7XG4gIGBgYFxuXG4gQG1ldGhvZCB0cmlnZ2VyRXZlbnRcbiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgalF1ZXJ5IHNlbGVjdG9yIGZvciBmaW5kaW5nIGVsZW1lbnQgb24gdGhlIERPTVxuIEBwYXJhbSB7U3RyaW5nfSBbY29udGV4dF0galF1ZXJ5IHNlbGVjdG9yIHRoYXQgd2lsbCBsaW1pdCB0aGUgc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50IHRvIGZpbmQgb25seSB3aXRoaW4gdGhlIGNvbnRleHQncyBjaGlsZHJlblxuIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBldmVudCB0eXBlIHRvIGJlIHRyaWdnZXJlZC5cbiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIHRvIGJlIHBhc3NlZCB0byBqUXVlcnkuRXZlbnQuXG4gQHJldHVybiB7UlNWUC5Qcm9taXNlfVxuIEBzaW5jZSAxLjUuMFxuIEBwdWJsaWNcbiovXG5hc3luY0hlbHBlcigndHJpZ2dlckV2ZW50JywgdHJpZ2dlckV2ZW50KTtcbiJdfQ==
enifed('ember-testing/index', ['exports', 'ember-metal/core', 'ember-testing/initializers', 'ember-testing/support', 'ember-testing/setup_for_testing', 'ember-testing/test', 'ember-testing/adapters/adapter', 'ember-testing/adapters/qunit', 'ember-testing/helpers'], function (exports, _emberMetalCore, _emberTestingInitializers, _emberTestingSupport, _emberTestingSetup_for_testing, _emberTestingTest, _emberTestingAdaptersAdapter, _emberTestingAdaptersQunit, _emberTestingHelpers) {
  'use strict';

  // adds helpers to helpers object in Test

  /**
    @module ember
    @submodule ember-testing
  */

  _emberMetalCore.default.Test = _emberTestingTest.default;
  _emberMetalCore.default.Test.Adapter = _emberTestingAdaptersAdapter.default;
  _emberMetalCore.default.Test.QUnitAdapter = _emberTestingAdaptersQunit.default;
  _emberMetalCore.default.setupForTesting = _emberTestingSetup_for_testing.default;
});
// to setup initializer
// to handle various edge cases
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3RpbmcvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWdCQSwwQkFBTSxJQUFJLDRCQUFPLENBQUM7QUFDbEIsMEJBQU0sSUFBSSxDQUFDLE9BQU8sdUNBQVUsQ0FBQztBQUM3QiwwQkFBTSxJQUFJLENBQUMsWUFBWSxxQ0FBZSxDQUFDO0FBQ3ZDLDBCQUFNLGVBQWUseUNBQWtCLENBQUMiLCJmaWxlIjoiZW1iZXItdGVzdGluZy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFbWJlciBmcm9tICdlbWJlci1tZXRhbC9jb3JlJztcblxuaW1wb3J0ICdlbWJlci10ZXN0aW5nL2luaXRpYWxpemVycyc7IC8vIHRvIHNldHVwIGluaXRpYWxpemVyXG5pbXBvcnQgJ2VtYmVyLXRlc3Rpbmcvc3VwcG9ydCc7ICAgICAgLy8gdG8gaGFuZGxlIHZhcmlvdXMgZWRnZSBjYXNlc1xuXG5pbXBvcnQgc2V0dXBGb3JUZXN0aW5nIGZyb20gJ2VtYmVyLXRlc3Rpbmcvc2V0dXBfZm9yX3Rlc3RpbmcnO1xuaW1wb3J0IFRlc3QgZnJvbSAnZW1iZXItdGVzdGluZy90ZXN0JztcbmltcG9ydCBBZGFwdGVyIGZyb20gJ2VtYmVyLXRlc3RpbmcvYWRhcHRlcnMvYWRhcHRlcic7XG5pbXBvcnQgUVVuaXRBZGFwdGVyIGZyb20gJ2VtYmVyLXRlc3RpbmcvYWRhcHRlcnMvcXVuaXQnO1xuaW1wb3J0ICdlbWJlci10ZXN0aW5nL2hlbHBlcnMnOyAgICAgIC8vIGFkZHMgaGVscGVycyB0byBoZWxwZXJzIG9iamVjdCBpbiBUZXN0XG5cbi8qKlxuICBAbW9kdWxlIGVtYmVyXG4gIEBzdWJtb2R1bGUgZW1iZXItdGVzdGluZ1xuKi9cblxuRW1iZXIuVGVzdCA9IFRlc3Q7XG5FbWJlci5UZXN0LkFkYXB0ZXIgPSBBZGFwdGVyO1xuRW1iZXIuVGVzdC5RVW5pdEFkYXB0ZXIgPSBRVW5pdEFkYXB0ZXI7XG5FbWJlci5zZXR1cEZvclRlc3RpbmcgPSBzZXR1cEZvclRlc3Rpbmc7XG4iXX0=
enifed('ember-testing/initializers', ['exports', 'ember-runtime/system/lazy_load'], function (exports, _emberRuntimeSystemLazy_load) {
  'use strict';

  var name = 'deferReadiness in `testing` mode';

  _emberRuntimeSystemLazy_load.onLoad('Ember.Application', function (Application) {
    if (!Application.initializers[name]) {
      Application.initializer({
        name: name,

        initialize: function (application) {
          if (application.testing) {
            application.deferReadiness();
          }
        }
      });
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3RpbmcvaW5pdGlhbGl6ZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQUksSUFBSSxHQUFHLGtDQUFrQyxDQUFDOztBQUU5QywrQkFKUyxNQUFNLENBSVIsbUJBQW1CLEVBQUUsVUFBUyxXQUFXLEVBQUU7QUFDaEQsUUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbkMsaUJBQVcsQ0FBQyxXQUFXLENBQUM7QUFDdEIsWUFBSSxFQUFFLElBQUk7O0FBRVYsa0JBQVUsRUFBQSxVQUFDLFdBQVcsRUFBRTtBQUN0QixjQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUU7QUFDdkIsdUJBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztXQUM5QjtTQUNGO09BQ0YsQ0FBQyxDQUFDO0tBQ0o7R0FDRixDQUFDLENBQUMiLCJmaWxlIjoiZW1iZXItdGVzdGluZy9pbml0aWFsaXplcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBvbkxvYWQgfSBmcm9tICdlbWJlci1ydW50aW1lL3N5c3RlbS9sYXp5X2xvYWQnO1xuXG52YXIgbmFtZSA9ICdkZWZlclJlYWRpbmVzcyBpbiBgdGVzdGluZ2AgbW9kZSc7XG5cbm9uTG9hZCgnRW1iZXIuQXBwbGljYXRpb24nLCBmdW5jdGlvbihBcHBsaWNhdGlvbikge1xuICBpZiAoIUFwcGxpY2F0aW9uLmluaXRpYWxpemVyc1tuYW1lXSkge1xuICAgIEFwcGxpY2F0aW9uLmluaXRpYWxpemVyKHtcbiAgICAgIG5hbWU6IG5hbWUsXG5cbiAgICAgIGluaXRpYWxpemUoYXBwbGljYXRpb24pIHtcbiAgICAgICAgaWYgKGFwcGxpY2F0aW9uLnRlc3RpbmcpIHtcbiAgICAgICAgICBhcHBsaWNhdGlvbi5kZWZlclJlYWRpbmVzcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuIl19
enifed('ember-testing/setup_for_testing', ['exports', 'ember-metal/core', 'ember-testing/adapters/qunit', 'ember-views/system/jquery'], function (exports, _emberMetalCore, _emberTestingAdaptersQunit, _emberViewsSystemJquery) {
  'use strict';

  exports.default = setupForTesting;

  var Test, requests;

  function incrementAjaxPendingRequests(_, xhr) {
    requests.push(xhr);
    Test.pendingAjaxRequests = requests.length;
  }

  function decrementAjaxPendingRequests(_, xhr) {
    for (var i = 0; i < requests.length; i++) {
      if (xhr === requests[i]) {
        requests.splice(i, 1);
      }
    }
    Test.pendingAjaxRequests = requests.length;
  }

  /**
    Sets Ember up for testing. This is useful to perform
    basic setup steps in order to unit test.
  
    Use `App.setupForTesting` to perform integration tests (full
    application testing).
  
    @method setupForTesting
    @namespace Ember
    @since 1.5.0
    @private
  */

  function setupForTesting() {
    if (!Test) {
      Test = requireModule('ember-testing/test')['default'];
    }

    _emberMetalCore.default.testing = true;

    // if adapter is not manually set default to QUnit
    if (!Test.adapter) {
      Test.adapter = _emberTestingAdaptersQunit.default.create();
    }

    requests = [];
    Test.pendingAjaxRequests = requests.length;

    _emberViewsSystemJquery.default(document).off('ajaxSend', incrementAjaxPendingRequests);
    _emberViewsSystemJquery.default(document).off('ajaxComplete', decrementAjaxPendingRequests);
    _emberViewsSystemJquery.default(document).on('ajaxSend', incrementAjaxPendingRequests);
    _emberViewsSystemJquery.default(document).on('ajaxComplete', decrementAjaxPendingRequests);
  }
});

// import Test from "ember-testing/test";  // ES6TODO: fix when cycles are supported
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3Rpbmcvc2V0dXBfZm9yX3Rlc3RpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O29CQWlDd0IsZUFBZTs7QUE1QnZDLE1BQUksSUFBSSxFQUFFLFFBQVEsQ0FBQzs7QUFFbkIsV0FBUyw0QkFBNEIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFO0FBQzVDLFlBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkIsUUFBSSxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7R0FDNUM7O0FBRUQsV0FBUyw0QkFBNEIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFO0FBQzVDLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3hDLFVBQUksR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN2QixnQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7T0FDdkI7S0FDRjtBQUNELFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO0dBQzVDOzs7Ozs7Ozs7Ozs7Ozs7QUFjYyxXQUFTLGVBQWUsR0FBRztBQUN4QyxRQUFJLENBQUMsSUFBSSxFQUFFO0FBQUUsVUFBSSxHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQUU7O0FBRXJFLDRCQUFNLE9BQU8sR0FBRyxJQUFJLENBQUM7OztBQUdyQixRQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNqQixVQUFJLENBQUMsT0FBTyxHQUFHLG1DQUFhLE1BQU0sRUFBRSxDQUFDO0tBQ3RDOztBQUVELFlBQVEsR0FBRyxFQUFFLENBQUM7QUFDZCxRQUFJLENBQUMsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQzs7QUFFM0Msb0NBQU8sUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0FBQy9ELG9DQUFPLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztBQUNuRSxvQ0FBTyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7QUFDOUQsb0NBQU8sUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0dBQ25FIiwiZmlsZSI6ImVtYmVyLXRlc3Rpbmcvc2V0dXBfZm9yX3Rlc3RpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW1iZXIgZnJvbSAnZW1iZXItbWV0YWwvY29yZSc7XG4vLyBpbXBvcnQgVGVzdCBmcm9tIFwiZW1iZXItdGVzdGluZy90ZXN0XCI7ICAvLyBFUzZUT0RPOiBmaXggd2hlbiBjeWNsZXMgYXJlIHN1cHBvcnRlZFxuaW1wb3J0IFFVbml0QWRhcHRlciBmcm9tICdlbWJlci10ZXN0aW5nL2FkYXB0ZXJzL3F1bml0JztcbmltcG9ydCBqUXVlcnkgZnJvbSAnZW1iZXItdmlld3Mvc3lzdGVtL2pxdWVyeSc7XG5cbnZhciBUZXN0LCByZXF1ZXN0cztcblxuZnVuY3Rpb24gaW5jcmVtZW50QWpheFBlbmRpbmdSZXF1ZXN0cyhfLCB4aHIpIHtcbiAgcmVxdWVzdHMucHVzaCh4aHIpO1xuICBUZXN0LnBlbmRpbmdBamF4UmVxdWVzdHMgPSByZXF1ZXN0cy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIGRlY3JlbWVudEFqYXhQZW5kaW5nUmVxdWVzdHMoXywgeGhyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmVxdWVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeGhyID09PSByZXF1ZXN0c1tpXSkge1xuICAgICAgcmVxdWVzdHMuc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuICBUZXN0LnBlbmRpbmdBamF4UmVxdWVzdHMgPSByZXF1ZXN0cy5sZW5ndGg7XG59XG5cbi8qKlxuICBTZXRzIEVtYmVyIHVwIGZvciB0ZXN0aW5nLiBUaGlzIGlzIHVzZWZ1bCB0byBwZXJmb3JtXG4gIGJhc2ljIHNldHVwIHN0ZXBzIGluIG9yZGVyIHRvIHVuaXQgdGVzdC5cblxuICBVc2UgYEFwcC5zZXR1cEZvclRlc3RpbmdgIHRvIHBlcmZvcm0gaW50ZWdyYXRpb24gdGVzdHMgKGZ1bGxcbiAgYXBwbGljYXRpb24gdGVzdGluZykuXG5cbiAgQG1ldGhvZCBzZXR1cEZvclRlc3RpbmdcbiAgQG5hbWVzcGFjZSBFbWJlclxuICBAc2luY2UgMS41LjBcbiAgQHByaXZhdGVcbiovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzZXR1cEZvclRlc3RpbmcoKSB7XG4gIGlmICghVGVzdCkgeyBUZXN0ID0gcmVxdWlyZU1vZHVsZSgnZW1iZXItdGVzdGluZy90ZXN0JylbJ2RlZmF1bHQnXTsgfVxuXG4gIEVtYmVyLnRlc3RpbmcgPSB0cnVlO1xuXG4gIC8vIGlmIGFkYXB0ZXIgaXMgbm90IG1hbnVhbGx5IHNldCBkZWZhdWx0IHRvIFFVbml0XG4gIGlmICghVGVzdC5hZGFwdGVyKSB7XG4gICAgVGVzdC5hZGFwdGVyID0gUVVuaXRBZGFwdGVyLmNyZWF0ZSgpO1xuICB9XG5cbiAgcmVxdWVzdHMgPSBbXTtcbiAgVGVzdC5wZW5kaW5nQWpheFJlcXVlc3RzID0gcmVxdWVzdHMubGVuZ3RoO1xuXG4gIGpRdWVyeShkb2N1bWVudCkub2ZmKCdhamF4U2VuZCcsIGluY3JlbWVudEFqYXhQZW5kaW5nUmVxdWVzdHMpO1xuICBqUXVlcnkoZG9jdW1lbnQpLm9mZignYWpheENvbXBsZXRlJywgZGVjcmVtZW50QWpheFBlbmRpbmdSZXF1ZXN0cyk7XG4gIGpRdWVyeShkb2N1bWVudCkub24oJ2FqYXhTZW5kJywgaW5jcmVtZW50QWpheFBlbmRpbmdSZXF1ZXN0cyk7XG4gIGpRdWVyeShkb2N1bWVudCkub24oJ2FqYXhDb21wbGV0ZScsIGRlY3JlbWVudEFqYXhQZW5kaW5nUmVxdWVzdHMpO1xufVxuIl19
enifed('ember-testing/support', ['exports', 'ember-metal/debug', 'ember-views/system/jquery', 'ember-metal/environment'], function (exports, _emberMetalDebug, _emberViewsSystemJquery, _emberMetalEnvironment) {
  'use strict';

  /**
    @module ember
    @submodule ember-testing
  */

  var $ = _emberViewsSystemJquery.default;

  /**
    This method creates a checkbox and triggers the click event to fire the
    passed in handler. It is used to correct for a bug in older versions
    of jQuery (e.g 1.8.3).
  
    @private
    @method testCheckboxClick
  */
  function testCheckboxClick(handler) {
    $('<input type="checkbox">').css({ position: 'absolute', left: '-1000px', top: '-1000px' }).appendTo('body').on('click', handler).trigger('click').remove();
  }

  if (_emberMetalEnvironment.default.hasDOM) {
    $(function () {
      /*
        Determine whether a checkbox checked using jQuery's "click" method will have
        the correct value for its checked property.
         If we determine that the current jQuery version exhibits this behavior,
        patch it to work correctly as in the commit for the actual fix:
        https://github.com/jquery/jquery/commit/1fb2f92.
      */
      testCheckboxClick(function () {
        if (!this.checked && !$.event.special.click) {
          $.event.special.click = {
            // For checkbox, fire native event so checked state will be right
            trigger: function () {
              if ($.nodeName(this, 'input') && this.type === 'checkbox' && this.click) {
                this.click();
                return false;
              }
            }
          };
        }
      });

      // Try again to verify that the patch took effect or blow up.
      testCheckboxClick(function () {
        _emberMetalDebug.warn('clicked checkboxes should be checked! the jQuery patch didn\'t work', this.checked, { id: 'ember-testing.test-checkbox-click' });
      });
    });
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3Rpbmcvc3VwcG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQVVBLE1BQUksQ0FBQyxrQ0FBUyxDQUFDOzs7Ozs7Ozs7O0FBVWYsV0FBUyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU7QUFDbEMsS0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQ3pCLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FDOUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUNoQixFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUNwQixPQUFPLENBQUMsT0FBTyxDQUFDLENBQ2hCLE1BQU0sRUFBRSxDQUFDO0dBQ2I7O0FBRUQsTUFBSSwrQkFBWSxNQUFNLEVBQUU7QUFDdEIsS0FBQyxDQUFDLFlBQVc7Ozs7Ozs7O0FBU1gsdUJBQWlCLENBQUMsWUFBVztBQUMzQixZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtBQUMzQyxXQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUc7O0FBRXRCLG1CQUFPLEVBQUEsWUFBRztBQUNSLGtCQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDdkUsb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLHVCQUFPLEtBQUssQ0FBQztlQUNkO2FBQ0Y7V0FDRixDQUFDO1NBQ0g7T0FDRixDQUFDLENBQUM7OztBQUdILHVCQUFpQixDQUFDLFlBQVc7QUFDM0IseUJBdkRHLElBQUksQ0F3REwscUVBQXFFLEVBQ3JFLElBQUksQ0FBQyxPQUFPLEVBQ1osRUFBRSxFQUFFLEVBQUUsbUNBQW1DLEVBQUUsQ0FDNUMsQ0FBQztPQUNILENBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQztHQUNKIiwiZmlsZSI6ImVtYmVyLXRlc3Rpbmcvc3VwcG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHdhcm4gfSBmcm9tICdlbWJlci1tZXRhbC9kZWJ1Zyc7XG5pbXBvcnQgalF1ZXJ5IGZyb20gJ2VtYmVyLXZpZXdzL3N5c3RlbS9qcXVlcnknO1xuXG5pbXBvcnQgZW52aXJvbm1lbnQgZnJvbSAnZW1iZXItbWV0YWwvZW52aXJvbm1lbnQnO1xuXG4vKipcbiAgQG1vZHVsZSBlbWJlclxuICBAc3VibW9kdWxlIGVtYmVyLXRlc3RpbmdcbiovXG5cbnZhciAkID0galF1ZXJ5O1xuXG4vKipcbiAgVGhpcyBtZXRob2QgY3JlYXRlcyBhIGNoZWNrYm94IGFuZCB0cmlnZ2VycyB0aGUgY2xpY2sgZXZlbnQgdG8gZmlyZSB0aGVcbiAgcGFzc2VkIGluIGhhbmRsZXIuIEl0IGlzIHVzZWQgdG8gY29ycmVjdCBmb3IgYSBidWcgaW4gb2xkZXIgdmVyc2lvbnNcbiAgb2YgalF1ZXJ5IChlLmcgMS44LjMpLlxuXG4gIEBwcml2YXRlXG4gIEBtZXRob2QgdGVzdENoZWNrYm94Q2xpY2tcbiovXG5mdW5jdGlvbiB0ZXN0Q2hlY2tib3hDbGljayhoYW5kbGVyKSB7XG4gICQoJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4nKVxuICAgIC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogJy0xMDAwcHgnLCB0b3A6ICctMTAwMHB4JyB9KVxuICAgIC5hcHBlbmRUbygnYm9keScpXG4gICAgLm9uKCdjbGljaycsIGhhbmRsZXIpXG4gICAgLnRyaWdnZXIoJ2NsaWNrJylcbiAgICAucmVtb3ZlKCk7XG59XG5cbmlmIChlbnZpcm9ubWVudC5oYXNET00pIHtcbiAgJChmdW5jdGlvbigpIHtcbiAgICAvKlxuICAgICAgRGV0ZXJtaW5lIHdoZXRoZXIgYSBjaGVja2JveCBjaGVja2VkIHVzaW5nIGpRdWVyeSdzIFwiY2xpY2tcIiBtZXRob2Qgd2lsbCBoYXZlXG4gICAgICB0aGUgY29ycmVjdCB2YWx1ZSBmb3IgaXRzIGNoZWNrZWQgcHJvcGVydHkuXG5cbiAgICAgIElmIHdlIGRldGVybWluZSB0aGF0IHRoZSBjdXJyZW50IGpRdWVyeSB2ZXJzaW9uIGV4aGliaXRzIHRoaXMgYmVoYXZpb3IsXG4gICAgICBwYXRjaCBpdCB0byB3b3JrIGNvcnJlY3RseSBhcyBpbiB0aGUgY29tbWl0IGZvciB0aGUgYWN0dWFsIGZpeDpcbiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvanF1ZXJ5L2NvbW1pdC8xZmIyZjkyLlxuICAgICovXG4gICAgdGVzdENoZWNrYm94Q2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuY2hlY2tlZCAmJiAhJC5ldmVudC5zcGVjaWFsLmNsaWNrKSB7XG4gICAgICAgICQuZXZlbnQuc3BlY2lhbC5jbGljayA9IHtcbiAgICAgICAgICAvLyBGb3IgY2hlY2tib3gsIGZpcmUgbmF0aXZlIGV2ZW50IHNvIGNoZWNrZWQgc3RhdGUgd2lsbCBiZSByaWdodFxuICAgICAgICAgIHRyaWdnZXIoKSB7XG4gICAgICAgICAgICBpZiAoJC5ub2RlTmFtZSh0aGlzLCAnaW5wdXQnKSAmJiB0aGlzLnR5cGUgPT09ICdjaGVja2JveCcgJiYgdGhpcy5jbGljaykge1xuICAgICAgICAgICAgICB0aGlzLmNsaWNrKCk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUcnkgYWdhaW4gdG8gdmVyaWZ5IHRoYXQgdGhlIHBhdGNoIHRvb2sgZWZmZWN0IG9yIGJsb3cgdXAuXG4gICAgdGVzdENoZWNrYm94Q2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnY2xpY2tlZCBjaGVja2JveGVzIHNob3VsZCBiZSBjaGVja2VkISB0aGUgalF1ZXJ5IHBhdGNoIGRpZG5cXCd0IHdvcmsnLFxuICAgICAgICB0aGlzLmNoZWNrZWQsXG4gICAgICAgIHsgaWQ6ICdlbWJlci10ZXN0aW5nLnRlc3QtY2hlY2tib3gtY2xpY2snIH1cbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19
enifed('ember-testing/test', ['exports', 'ember-metal/run_loop', 'ember-runtime/ext/rsvp', 'ember-testing/setup_for_testing', 'ember-application/system/application', 'ember-runtime/system/native_array'], function (exports, _emberMetalRun_loop, _emberRuntimeExtRsvp, _emberTestingSetup_for_testing, _emberApplicationSystemApplication, _emberRuntimeSystemNative_array) {
  'use strict';

  /**
    @module ember
    @submodule ember-testing
  */
  var helpers = {};
  var injectHelpersCallbacks = [];

  /**
    This is a container for an assortment of testing related functionality:
  
    * Choose your default test adapter (for your framework of choice).
    * Register/Unregister additional test helpers.
    * Setup callbacks to be fired when the test helpers are injected into
      your application.
  
    @class Test
    @namespace Ember
    @public
  */
  var Test = {
    /**
      Hash containing all known test helpers.
       @property _helpers
      @private
      @since 1.7.0
    */
    _helpers: helpers,

    /**
      `registerHelper` is used to register a test helper that will be injected
      when `App.injectTestHelpers` is called.
       The helper method will always be called with the current Application as
      the first parameter.
       For example:
       ```javascript
      Ember.Test.registerHelper('boot', function(app) {
        Ember.run(app, app.advanceReadiness);
      });
      ```
       This helper can later be called without arguments because it will be
      called with `app` as the first parameter.
       ```javascript
      App = Ember.Application.create();
      App.injectTestHelpers();
      boot();
      ```
       @public
      @method registerHelper
      @param {String} name The name of the helper method to add.
      @param {Function} helperMethod
      @param options {Object}
    */
    registerHelper: function (name, helperMethod) {
      helpers[name] = {
        method: helperMethod,
        meta: { wait: false }
      };
    },

    /**
      `registerAsyncHelper` is used to register an async test helper that will be injected
      when `App.injectTestHelpers` is called.
       The helper method will always be called with the current Application as
      the first parameter.
       For example:
       ```javascript
      Ember.Test.registerAsyncHelper('boot', function(app) {
        Ember.run(app, app.advanceReadiness);
      });
      ```
       The advantage of an async helper is that it will not run
      until the last async helper has completed.  All async helpers
      after it will wait for it complete before running.
        For example:
       ```javascript
      Ember.Test.registerAsyncHelper('deletePost', function(app, postId) {
        click('.delete-' + postId);
      });
       // ... in your test
      visit('/post/2');
      deletePost(2);
      visit('/post/3');
      deletePost(3);
      ```
       @public
      @method registerAsyncHelper
      @param {String} name The name of the helper method to add.
      @param {Function} helperMethod
      @since 1.2.0
    */
    registerAsyncHelper: function (name, helperMethod) {
      helpers[name] = {
        method: helperMethod,
        meta: { wait: true }
      };
    },

    /**
      Remove a previously added helper method.
       Example:
       ```javascript
      Ember.Test.unregisterHelper('wait');
      ```
       @public
      @method unregisterHelper
      @param {String} name The helper to remove.
    */
    unregisterHelper: function (name) {
      delete helpers[name];
      delete Test.Promise.prototype[name];
    },

    /**
      Used to register callbacks to be fired whenever `App.injectTestHelpers`
      is called.
       The callback will receive the current application as an argument.
       Example:
       ```javascript
      Ember.Test.onInjectHelpers(function() {
        Ember.$(document).ajaxSend(function() {
          Test.pendingAjaxRequests++;
        });
         Ember.$(document).ajaxComplete(function() {
          Test.pendingAjaxRequests--;
        });
      });
      ```
       @public
      @method onInjectHelpers
      @param {Function} callback The function to be called.
    */
    onInjectHelpers: function (callback) {
      injectHelpersCallbacks.push(callback);
    },

    /**
      This returns a thenable tailored for testing.  It catches failed
      `onSuccess` callbacks and invokes the `Ember.Test.adapter.exception`
      callback in the last chained then.
       This method should be returned by async helpers such as `wait`.
       @public
      @method promise
      @param {Function} resolver The function used to resolve the promise.
      @param {String} label An optional string for identifying the promise.
    */
    promise: function (resolver, label) {
      var fullLabel = 'Ember.Test.promise: ' + (label || '<Unknown Promise>');
      return new Test.Promise(resolver, fullLabel);
    },

    /**
     Used to allow ember-testing to communicate with a specific testing
     framework.
      You can manually set it before calling `App.setupForTesting()`.
      Example:
      ```javascript
     Ember.Test.adapter = MyCustomAdapter.create()
     ```
      If you do not set it, ember-testing will default to `Ember.Test.QUnitAdapter`.
      @public
     @property adapter
     @type {Class} The adapter to be used.
     @default Ember.Test.QUnitAdapter
    */
    adapter: null,

    /**
      Replacement for `Ember.RSVP.resolve`
      The only difference is this uses
      an instance of `Ember.Test.Promise`
       @public
      @method resolve
      @param {Mixed} The value to resolve
      @since 1.2.0
    */
    resolve: function (val) {
      return Test.promise(function (resolve) {
        return resolve(val);
      });
    },

    /**
       This allows ember-testing to play nicely with other asynchronous
       events, such as an application that is waiting for a CSS3
       transition or an IndexDB transaction.
        For example:
        ```javascript
       Ember.Test.registerWaiter(function() {
         return myPendingTransactions() == 0;
       });
       ```
       The `context` argument allows you to optionally specify the `this`
       with which your callback will be invoked.
        For example:
        ```javascript
       Ember.Test.registerWaiter(MyDB, MyDB.hasPendingTransactions);
       ```
        @public
       @method registerWaiter
       @param {Object} context (optional)
       @param {Function} callback
       @since 1.2.0
    */
    registerWaiter: function (context, callback) {
      if (arguments.length === 1) {
        callback = context;
        context = null;
      }
      if (!this.waiters) {
        this.waiters = _emberRuntimeSystemNative_array.A();
      }
      this.waiters.push([context, callback]);
    },
    /**
       `unregisterWaiter` is used to unregister a callback that was
       registered with `registerWaiter`.
        @public
       @method unregisterWaiter
       @param {Object} context (optional)
       @param {Function} callback
       @since 1.2.0
    */
    unregisterWaiter: function (context, callback) {
      if (!this.waiters) {
        return;
      }
      if (arguments.length === 1) {
        callback = context;
        context = null;
      }
      this.waiters = _emberRuntimeSystemNative_array.A(this.waiters.filter(function (elt) {
        return !(elt[0] === context && elt[1] === callback);
      }));
    }
  };

  function helper(app, name) {
    var fn = helpers[name].method;
    var meta = helpers[name].meta;

    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var lastPromise;

      args.unshift(app);

      // some helpers are not async and
      // need to return a value immediately.
      // example: `find`
      if (!meta.wait) {
        return fn.apply(app, args);
      }

      lastPromise = run(function () {
        return Test.resolve(Test.lastPromise);
      });

      // wait for last helper's promise to resolve and then
      // execute. To be safe, we need to tell the adapter we're going
      // asynchronous here, because fn may not be invoked before we
      // return.
      Test.adapter.asyncStart();
      return lastPromise.then(function () {
        return fn.apply(app, args);
      }).finally(function () {
        Test.adapter.asyncEnd();
      });
    };
  }

  function run(fn) {
    if (!_emberMetalRun_loop.default.currentRunLoop) {
      return _emberMetalRun_loop.default(fn);
    } else {
      return fn();
    }
  }

  _emberApplicationSystemApplication.default.reopen({
    /**
     This property contains the testing helpers for the current application. These
     are created once you call `injectTestHelpers` on your `Ember.Application`
     instance. The included helpers are also available on the `window` object by
     default, but can be used from this object on the individual application also.
       @property testHelpers
      @type {Object}
      @default {}
      @public
    */
    testHelpers: {},

    /**
     This property will contain the original methods that were registered
     on the `helperContainer` before `injectTestHelpers` is called.
      When `removeTestHelpers` is called, these methods are restored to the
     `helperContainer`.
       @property originalMethods
      @type {Object}
      @default {}
      @private
      @since 1.3.0
    */
    originalMethods: {},

    /**
    This property indicates whether or not this application is currently in
    testing mode. This is set when `setupForTesting` is called on the current
    application.
     @property testing
    @type {Boolean}
    @default false
    @since 1.3.0
    @public
    */
    testing: false,

    /**
      This hook defers the readiness of the application, so that you can start
      the app when your tests are ready to run. It also sets the router's
      location to 'none', so that the window's location will not be modified
      (preventing both accidental leaking of state between tests and interference
      with your testing framework).
       Example:
       ```
      App.setupForTesting();
      ```
       @method setupForTesting
      @public
    */
    setupForTesting: function () {
      _emberTestingSetup_for_testing.default();

      this.testing = true;

      this.Router.reopen({
        location: 'none'
      });
    },

    /**
      This will be used as the container to inject the test helpers into. By
      default the helpers are injected into `window`.
       @property helperContainer
      @type {Object} The object to be used for test helpers.
      @default window
      @since 1.2.0
      @private
    */
    helperContainer: null,

    /**
      This injects the test helpers into the `helperContainer` object. If an object is provided
      it will be used as the helperContainer. If `helperContainer` is not set it will default
      to `window`. If a function of the same name has already been defined it will be cached
      (so that it can be reset if the helper is removed with `unregisterHelper` or
      `removeTestHelpers`).
       Any callbacks registered with `onInjectHelpers` will be called once the
      helpers have been injected.
       Example:
      ```
      App.injectTestHelpers();
      ```
       @method injectTestHelpers
      @public
    */
    injectTestHelpers: function (helperContainer) {
      if (helperContainer) {
        this.helperContainer = helperContainer;
      } else {
        this.helperContainer = window;
      }

      this.reopen({
        willDestroy: function () {
          this._super.apply(this, arguments);
          this.removeTestHelpers();
        }
      });

      this.testHelpers = {};
      for (var name in helpers) {
        this.originalMethods[name] = this.helperContainer[name];
        this.testHelpers[name] = this.helperContainer[name] = helper(this, name);
        protoWrap(Test.Promise.prototype, name, helper(this, name), helpers[name].meta.wait);
      }

      for (var i = 0, l = injectHelpersCallbacks.length; i < l; i++) {
        injectHelpersCallbacks[i](this);
      }
    },

    /**
      This removes all helpers that have been registered, and resets and functions
      that were overridden by the helpers.
       Example:
       ```javascript
      App.removeTestHelpers();
      ```
       @public
      @method removeTestHelpers
    */
    removeTestHelpers: function () {
      if (!this.helperContainer) {
        return;
      }

      for (var name in helpers) {
        this.helperContainer[name] = this.originalMethods[name];
        delete Test.Promise.prototype[name];
        delete this.testHelpers[name];
        delete this.originalMethods[name];
      }
    }
  });

  // This method is no longer needed
  // But still here for backwards compatibility
  // of helper chaining
  function protoWrap(proto, name, callback, isAsync) {
    proto[name] = function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (isAsync) {
        return callback.apply(this, args);
      } else {
        return this.then(function () {
          return callback.apply(this, args);
        });
      }
    };
  }

  Test.Promise = function () {
    _emberRuntimeExtRsvp.default.Promise.apply(this, arguments);
    Test.lastPromise = this;
  };

  Test.Promise.prototype = Object.create(_emberRuntimeExtRsvp.default.Promise.prototype);
  Test.Promise.prototype.constructor = Test.Promise;
  Test.Promise.resolve = Test.resolve;

  // Patch `then` to isolate async methods
  // specifically `Ember.Test.lastPromise`
  var originalThen = _emberRuntimeExtRsvp.default.Promise.prototype.then;
  Test.Promise.prototype.then = function (onSuccess, onFailure) {
    return originalThen.call(this, function (val) {
      return isolate(onSuccess, val);
    }, onFailure);
  };

  // This method isolates nested async methods
  // so that they don't conflict with other last promises.
  //
  // 1. Set `Ember.Test.lastPromise` to null
  // 2. Invoke method
  // 3. Return the last promise created during method
  function isolate(fn, val) {
    var value, lastPromise;

    // Reset lastPromise for nested helpers
    Test.lastPromise = null;

    value = fn(val);

    lastPromise = Test.lastPromise;
    Test.lastPromise = null;

    // If the method returned a promise
    // return that promise. If not,
    // return the last async helper's promise
    if (value && value instanceof Test.Promise || !lastPromise) {
      return value;
    } else {
      return run(function () {
        return Test.resolve(lastPromise).then(function () {
          return value;
        });
      });
    }
  }

  exports.default = Test;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVtYmVyLXRlc3RpbmcvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBVUEsTUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLE1BQUksc0JBQXNCLEdBQUcsRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7OztBQWNoQyxNQUFJLElBQUksR0FBRzs7Ozs7OztBQVFULFlBQVEsRUFBRSxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDakIsa0JBQWMsRUFBQSxVQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7QUFDakMsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHO0FBQ2QsY0FBTSxFQUFFLFlBQVk7QUFDcEIsWUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtPQUN0QixDQUFDO0tBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBDRCx1QkFBbUIsRUFBQSxVQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7QUFDdEMsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHO0FBQ2QsY0FBTSxFQUFFLFlBQVk7QUFDcEIsWUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtPQUNyQixDQUFDO0tBQ0g7Ozs7Ozs7Ozs7OztBQWVELG9CQUFnQixFQUFBLFVBQUMsSUFBSSxFQUFFO0FBQ3JCLGFBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCRCxtQkFBZSxFQUFBLFVBQUMsUUFBUSxFQUFFO0FBQ3hCLDRCQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUN2Qzs7Ozs7Ozs7Ozs7O0FBY0QsV0FBTyxFQUFBLFVBQUMsUUFBUSxFQUFFLEtBQUssRUFBRTtBQUN2QixVQUFJLFNBQVMsNkJBQTBCLEtBQUssSUFBSSxtQkFBbUIsQ0FBQSxB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QixTQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVoQixlQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUMvQixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQzs7Ozs7QUFLeEIsUUFBSSxBQUFDLEtBQUssSUFBSyxLQUFLLFlBQVksSUFBSSxDQUFDLE9BQU8sQUFBQyxJQUFLLENBQUMsV0FBVyxFQUFFO0FBQzlELGFBQU8sS0FBSyxDQUFDO0tBQ2QsTUFBTTtBQUNMLGFBQU8sR0FBRyxDQUFDLFlBQVc7QUFDcEIsZUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFXO0FBQy9DLGlCQUFPLEtBQUssQ0FBQztTQUNkLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKO0dBQ0Y7O29CQUVjLElBQUkiLCJmaWxlIjoiZW1iZXItdGVzdGluZy90ZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVtYmVyUnVuIGZyb20gJ2VtYmVyLW1ldGFsL3J1bl9sb29wJztcbmltcG9ydCBSU1ZQIGZyb20gJ2VtYmVyLXJ1bnRpbWUvZXh0L3JzdnAnO1xuaW1wb3J0IHNldHVwRm9yVGVzdGluZyBmcm9tICdlbWJlci10ZXN0aW5nL3NldHVwX2Zvcl90ZXN0aW5nJztcbmltcG9ydCBFbWJlckFwcGxpY2F0aW9uIGZyb20gJ2VtYmVyLWFwcGxpY2F0aW9uL3N5c3RlbS9hcHBsaWNhdGlvbic7XG5pbXBvcnQgeyBBIGFzIGVtYmVyQSB9IGZyb20gJ2VtYmVyLXJ1bnRpbWUvc3lzdGVtL25hdGl2ZV9hcnJheSc7XG5cbi8qKlxuICBAbW9kdWxlIGVtYmVyXG4gIEBzdWJtb2R1bGUgZW1iZXItdGVzdGluZ1xuKi9cbnZhciBoZWxwZXJzID0ge307XG52YXIgaW5qZWN0SGVscGVyc0NhbGxiYWNrcyA9IFtdO1xuXG4vKipcbiAgVGhpcyBpcyBhIGNvbnRhaW5lciBmb3IgYW4gYXNzb3J0bWVudCBvZiB0ZXN0aW5nIHJlbGF0ZWQgZnVuY3Rpb25hbGl0eTpcblxuICAqIENob29zZSB5b3VyIGRlZmF1bHQgdGVzdCBhZGFwdGVyIChmb3IgeW91ciBmcmFtZXdvcmsgb2YgY2hvaWNlKS5cbiAgKiBSZWdpc3Rlci9VbnJlZ2lzdGVyIGFkZGl0aW9uYWwgdGVzdCBoZWxwZXJzLlxuICAqIFNldHVwIGNhbGxiYWNrcyB0byBiZSBmaXJlZCB3aGVuIHRoZSB0ZXN0IGhlbHBlcnMgYXJlIGluamVjdGVkIGludG9cbiAgICB5b3VyIGFwcGxpY2F0aW9uLlxuXG4gIEBjbGFzcyBUZXN0XG4gIEBuYW1lc3BhY2UgRW1iZXJcbiAgQHB1YmxpY1xuKi9cbnZhciBUZXN0ID0ge1xuICAvKipcbiAgICBIYXNoIGNvbnRhaW5pbmcgYWxsIGtub3duIHRlc3QgaGVscGVycy5cblxuICAgIEBwcm9wZXJ0eSBfaGVscGVyc1xuICAgIEBwcml2YXRlXG4gICAgQHNpbmNlIDEuNy4wXG4gICovXG4gIF9oZWxwZXJzOiBoZWxwZXJzLFxuXG4gIC8qKlxuICAgIGByZWdpc3RlckhlbHBlcmAgaXMgdXNlZCB0byByZWdpc3RlciBhIHRlc3QgaGVscGVyIHRoYXQgd2lsbCBiZSBpbmplY3RlZFxuICAgIHdoZW4gYEFwcC5pbmplY3RUZXN0SGVscGVyc2AgaXMgY2FsbGVkLlxuXG4gICAgVGhlIGhlbHBlciBtZXRob2Qgd2lsbCBhbHdheXMgYmUgY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgQXBwbGljYXRpb24gYXNcbiAgICB0aGUgZmlyc3QgcGFyYW1ldGVyLlxuXG4gICAgRm9yIGV4YW1wbGU6XG5cbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgRW1iZXIuVGVzdC5yZWdpc3RlckhlbHBlcignYm9vdCcsIGZ1bmN0aW9uKGFwcCkge1xuICAgICAgRW1iZXIucnVuKGFwcCwgYXBwLmFkdmFuY2VSZWFkaW5lc3MpO1xuICAgIH0pO1xuICAgIGBgYFxuXG4gICAgVGhpcyBoZWxwZXIgY2FuIGxhdGVyIGJlIGNhbGxlZCB3aXRob3V0IGFyZ3VtZW50cyBiZWNhdXNlIGl0IHdpbGwgYmVcbiAgICBjYWxsZWQgd2l0aCBgYXBwYCBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLlxuXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIEFwcCA9IEVtYmVyLkFwcGxpY2F0aW9uLmNyZWF0ZSgpO1xuICAgIEFwcC5pbmplY3RUZXN0SGVscGVycygpO1xuICAgIGJvb3QoKTtcbiAgICBgYGBcblxuICAgIEBwdWJsaWNcbiAgICBAbWV0aG9kIHJlZ2lzdGVySGVscGVyXG4gICAgQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGhlbHBlciBtZXRob2QgdG8gYWRkLlxuICAgIEBwYXJhbSB7RnVuY3Rpb259IGhlbHBlck1ldGhvZFxuICAgIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9XG4gICovXG4gIHJlZ2lzdGVySGVscGVyKG5hbWUsIGhlbHBlck1ldGhvZCkge1xuICAgIGhlbHBlcnNbbmFtZV0gPSB7XG4gICAgICBtZXRob2Q6IGhlbHBlck1ldGhvZCxcbiAgICAgIG1ldGE6IHsgd2FpdDogZmFsc2UgfVxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAgYHJlZ2lzdGVyQXN5bmNIZWxwZXJgIGlzIHVzZWQgdG8gcmVnaXN0ZXIgYW4gYXN5bmMgdGVzdCBoZWxwZXIgdGhhdCB3aWxsIGJlIGluamVjdGVkXG4gICAgd2hlbiBgQXBwLmluamVjdFRlc3RIZWxwZXJzYCBpcyBjYWxsZWQuXG5cbiAgICBUaGUgaGVscGVyIG1ldGhvZCB3aWxsIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCB0aGUgY3VycmVudCBBcHBsaWNhdGlvbiBhc1xuICAgIHRoZSBmaXJzdCBwYXJhbWV0ZXIuXG5cbiAgICBGb3IgZXhhbXBsZTpcblxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBFbWJlci5UZXN0LnJlZ2lzdGVyQXN5bmNIZWxwZXIoJ2Jvb3QnLCBmdW5jdGlvbihhcHApIHtcbiAgICAgIEVtYmVyLnJ1bihhcHAsIGFwcC5hZHZhbmNlUmVhZGluZXNzKTtcbiAgICB9KTtcbiAgICBgYGBcblxuICAgIFRoZSBhZHZhbnRhZ2Ugb2YgYW4gYXN5bmMgaGVscGVyIGlzIHRoYXQgaXQgd2lsbCBub3QgcnVuXG4gICAgdW50aWwgdGhlIGxhc3QgYXN5bmMgaGVscGVyIGhhcyBjb21wbGV0ZWQuICBBbGwgYXN5bmMgaGVscGVyc1xuICAgIGFmdGVyIGl0IHdpbGwgd2FpdCBmb3IgaXQgY29tcGxldGUgYmVmb3JlIHJ1bm5pbmcuXG5cblxuICAgIEZvciBleGFtcGxlOlxuXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIEVtYmVyLlRlc3QucmVnaXN0ZXJBc3luY0hlbHBlcignZGVsZXRlUG9zdCcsIGZ1bmN0aW9uKGFwcCwgcG9zdElkKSB7XG4gICAgICBjbGljaygnLmRlbGV0ZS0nICsgcG9zdElkKTtcbiAgICB9KTtcblxuICAgIC8vIC4uLiBpbiB5b3VyIHRlc3RcbiAgICB2aXNpdCgnL3Bvc3QvMicpO1xuICAgIGRlbGV0ZVBvc3QoMik7XG4gICAgdmlzaXQoJy9wb3N0LzMnKTtcbiAgICBkZWxldGVQb3N0KDMpO1xuICAgIGBgYFxuXG4gICAgQHB1YmxpY1xuICAgIEBtZXRob2QgcmVnaXN0ZXJBc3luY0hlbHBlclxuICAgIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBoZWxwZXIgbWV0aG9kIHRvIGFkZC5cbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBoZWxwZXJNZXRob2RcbiAgICBAc2luY2UgMS4yLjBcbiAgKi9cbiAgcmVnaXN0ZXJBc3luY0hlbHBlcihuYW1lLCBoZWxwZXJNZXRob2QpIHtcbiAgICBoZWxwZXJzW25hbWVdID0ge1xuICAgICAgbWV0aG9kOiBoZWxwZXJNZXRob2QsXG4gICAgICBtZXRhOiB7IHdhaXQ6IHRydWUgfVxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAgUmVtb3ZlIGEgcHJldmlvdXNseSBhZGRlZCBoZWxwZXIgbWV0aG9kLlxuXG4gICAgRXhhbXBsZTpcblxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBFbWJlci5UZXN0LnVucmVnaXN0ZXJIZWxwZXIoJ3dhaXQnKTtcbiAgICBgYGBcblxuICAgIEBwdWJsaWNcbiAgICBAbWV0aG9kIHVucmVnaXN0ZXJIZWxwZXJcbiAgICBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgaGVscGVyIHRvIHJlbW92ZS5cbiAgKi9cbiAgdW5yZWdpc3RlckhlbHBlcihuYW1lKSB7XG4gICAgZGVsZXRlIGhlbHBlcnNbbmFtZV07XG4gICAgZGVsZXRlIFRlc3QuUHJvbWlzZS5wcm90b3R5cGVbbmFtZV07XG4gIH0sXG5cbiAgLyoqXG4gICAgVXNlZCB0byByZWdpc3RlciBjYWxsYmFja3MgdG8gYmUgZmlyZWQgd2hlbmV2ZXIgYEFwcC5pbmplY3RUZXN0SGVscGVyc2BcbiAgICBpcyBjYWxsZWQuXG5cbiAgICBUaGUgY2FsbGJhY2sgd2lsbCByZWNlaXZlIHRoZSBjdXJyZW50IGFwcGxpY2F0aW9uIGFzIGFuIGFyZ3VtZW50LlxuXG4gICAgRXhhbXBsZTpcblxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBFbWJlci5UZXN0Lm9uSW5qZWN0SGVscGVycyhmdW5jdGlvbigpIHtcbiAgICAgIEVtYmVyLiQoZG9jdW1lbnQpLmFqYXhTZW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICBUZXN0LnBlbmRpbmdBamF4UmVxdWVzdHMrKztcbiAgICAgIH0pO1xuXG4gICAgICBFbWJlci4kKGRvY3VtZW50KS5hamF4Q29tcGxldGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIFRlc3QucGVuZGluZ0FqYXhSZXF1ZXN0cy0tO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgYGBgXG5cbiAgICBAcHVibGljXG4gICAgQG1ldGhvZCBvbkluamVjdEhlbHBlcnNcbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLlxuICAqL1xuICBvbkluamVjdEhlbHBlcnMoY2FsbGJhY2spIHtcbiAgICBpbmplY3RIZWxwZXJzQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICB9LFxuXG4gIC8qKlxuICAgIFRoaXMgcmV0dXJucyBhIHRoZW5hYmxlIHRhaWxvcmVkIGZvciB0ZXN0aW5nLiAgSXQgY2F0Y2hlcyBmYWlsZWRcbiAgICBgb25TdWNjZXNzYCBjYWxsYmFja3MgYW5kIGludm9rZXMgdGhlIGBFbWJlci5UZXN0LmFkYXB0ZXIuZXhjZXB0aW9uYFxuICAgIGNhbGxiYWNrIGluIHRoZSBsYXN0IGNoYWluZWQgdGhlbi5cblxuICAgIFRoaXMgbWV0aG9kIHNob3VsZCBiZSByZXR1cm5lZCBieSBhc3luYyBoZWxwZXJzIHN1Y2ggYXMgYHdhaXRgLlxuXG4gICAgQHB1YmxpY1xuICAgIEBtZXRob2QgcHJvbWlzZVxuICAgIEBwYXJhbSB7RnVuY3Rpb259IHJlc29sdmVyIFRoZSBmdW5jdGlvbiB1c2VkIHRvIHJlc29sdmUgdGhlIHByb21pc2UuXG4gICAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIEFuIG9wdGlvbmFsIHN0cmluZyBmb3IgaWRlbnRpZnlpbmcgdGhlIHByb21pc2UuXG4gICovXG4gIHByb21pc2UocmVzb2x2ZXIsIGxhYmVsKSB7XG4gICAgdmFyIGZ1bGxMYWJlbCA9IGBFbWJlci5UZXN0LnByb21pc2U6ICR7bGFiZWwgfHwgJzxVbmtub3duIFByb21pc2U+J31gO1xuICAgIHJldHVybiBuZXcgVGVzdC5Qcm9taXNlKHJlc29sdmVyLCBmdWxsTGFiZWwpO1xuICB9LFxuXG4gIC8qKlxuICAgVXNlZCB0byBhbGxvdyBlbWJlci10ZXN0aW5nIHRvIGNvbW11bmljYXRlIHdpdGggYSBzcGVjaWZpYyB0ZXN0aW5nXG4gICBmcmFtZXdvcmsuXG5cbiAgIFlvdSBjYW4gbWFudWFsbHkgc2V0IGl0IGJlZm9yZSBjYWxsaW5nIGBBcHAuc2V0dXBGb3JUZXN0aW5nKClgLlxuXG4gICBFeGFtcGxlOlxuXG4gICBgYGBqYXZhc2NyaXB0XG4gICBFbWJlci5UZXN0LmFkYXB0ZXIgPSBNeUN1c3RvbUFkYXB0ZXIuY3JlYXRlKClcbiAgIGBgYFxuXG4gICBJZiB5b3UgZG8gbm90IHNldCBpdCwgZW1iZXItdGVzdGluZyB3aWxsIGRlZmF1bHQgdG8gYEVtYmVyLlRlc3QuUVVuaXRBZGFwdGVyYC5cblxuICAgQHB1YmxpY1xuICAgQHByb3BlcnR5IGFkYXB0ZXJcbiAgIEB0eXBlIHtDbGFzc30gVGhlIGFkYXB0ZXIgdG8gYmUgdXNlZC5cbiAgIEBkZWZhdWx0IEVtYmVyLlRlc3QuUVVuaXRBZGFwdGVyXG4gICovXG4gIGFkYXB0ZXI6IG51bGwsXG5cbiAgLyoqXG4gICAgUmVwbGFjZW1lbnQgZm9yIGBFbWJlci5SU1ZQLnJlc29sdmVgXG4gICAgVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyB0aGlzIHVzZXNcbiAgICBhbiBpbnN0YW5jZSBvZiBgRW1iZXIuVGVzdC5Qcm9taXNlYFxuXG4gICAgQHB1YmxpY1xuICAgIEBtZXRob2QgcmVzb2x2ZVxuICAgIEBwYXJhbSB7TWl4ZWR9IFRoZSB2YWx1ZSB0byByZXNvbHZlXG4gICAgQHNpbmNlIDEuMi4wXG4gICovXG4gIHJlc29sdmUodmFsKSB7XG4gICAgcmV0dXJuIFRlc3QucHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZSh2YWwpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgICBUaGlzIGFsbG93cyBlbWJlci10ZXN0aW5nIHRvIHBsYXkgbmljZWx5IHdpdGggb3RoZXIgYXN5bmNocm9ub3VzXG4gICAgIGV2ZW50cywgc3VjaCBhcyBhbiBhcHBsaWNhdGlvbiB0aGF0IGlzIHdhaXRpbmcgZm9yIGEgQ1NTM1xuICAgICB0cmFuc2l0aW9uIG9yIGFuIEluZGV4REIgdHJhbnNhY3Rpb24uXG5cbiAgICAgRm9yIGV4YW1wbGU6XG5cbiAgICAgYGBgamF2YXNjcmlwdFxuICAgICBFbWJlci5UZXN0LnJlZ2lzdGVyV2FpdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgIHJldHVybiBteVBlbmRpbmdUcmFuc2FjdGlvbnMoKSA9PSAwO1xuICAgICB9KTtcbiAgICAgYGBgXG4gICAgIFRoZSBgY29udGV4dGAgYXJndW1lbnQgYWxsb3dzIHlvdSB0byBvcHRpb25hbGx5IHNwZWNpZnkgdGhlIGB0aGlzYFxuICAgICB3aXRoIHdoaWNoIHlvdXIgY2FsbGJhY2sgd2lsbCBiZSBpbnZva2VkLlxuXG4gICAgIEZvciBleGFtcGxlOlxuXG4gICAgIGBgYGphdmFzY3JpcHRcbiAgICAgRW1iZXIuVGVzdC5yZWdpc3RlcldhaXRlcihNeURCLCBNeURCLmhhc1BlbmRpbmdUcmFuc2FjdGlvbnMpO1xuICAgICBgYGBcblxuICAgICBAcHVibGljXG4gICAgIEBtZXRob2QgcmVnaXN0ZXJXYWl0ZXJcbiAgICAgQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgKG9wdGlvbmFsKVxuICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICBAc2luY2UgMS4yLjBcbiAgKi9cbiAgcmVnaXN0ZXJXYWl0ZXIoY29udGV4dCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY2FsbGJhY2sgPSBjb250ZXh0O1xuICAgICAgY29udGV4dCA9IG51bGw7XG4gICAgfVxuICAgIGlmICghdGhpcy53YWl0ZXJzKSB7XG4gICAgICB0aGlzLndhaXRlcnMgPSBlbWJlckEoKTtcbiAgICB9XG4gICAgdGhpcy53YWl0ZXJzLnB1c2goW2NvbnRleHQsIGNhbGxiYWNrXSk7XG4gIH0sXG4gIC8qKlxuICAgICBgdW5yZWdpc3RlcldhaXRlcmAgaXMgdXNlZCB0byB1bnJlZ2lzdGVyIGEgY2FsbGJhY2sgdGhhdCB3YXNcbiAgICAgcmVnaXN0ZXJlZCB3aXRoIGByZWdpc3RlcldhaXRlcmAuXG5cbiAgICAgQHB1YmxpY1xuICAgICBAbWV0aG9kIHVucmVnaXN0ZXJXYWl0ZXJcbiAgICAgQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgKG9wdGlvbmFsKVxuICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICBAc2luY2UgMS4yLjBcbiAgKi9cbiAgdW5yZWdpc3RlcldhaXRlcihjb250ZXh0LCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy53YWl0ZXJzKSB7IHJldHVybjsgfVxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBjYWxsYmFjayA9IGNvbnRleHQ7XG4gICAgICBjb250ZXh0ID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy53YWl0ZXJzID0gZW1iZXJBKHRoaXMud2FpdGVycy5maWx0ZXIoZnVuY3Rpb24oZWx0KSB7XG4gICAgICByZXR1cm4gIShlbHRbMF0gPT09IGNvbnRleHQgJiYgZWx0WzFdID09PSBjYWxsYmFjayk7XG4gICAgfSkpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBoZWxwZXIoYXBwLCBuYW1lKSB7XG4gIHZhciBmbiA9IGhlbHBlcnNbbmFtZV0ubWV0aG9kO1xuICB2YXIgbWV0YSA9IGhlbHBlcnNbbmFtZV0ubWV0YTtcblxuICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIHZhciBsYXN0UHJvbWlzZTtcblxuICAgIGFyZ3MudW5zaGlmdChhcHApO1xuXG4gICAgLy8gc29tZSBoZWxwZXJzIGFyZSBub3QgYXN5bmMgYW5kXG4gICAgLy8gbmVlZCB0byByZXR1cm4gYSB2YWx1ZSBpbW1lZGlhdGVseS5cbiAgICAvLyBleGFtcGxlOiBgZmluZGBcbiAgICBpZiAoIW1ldGEud2FpdCkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KGFwcCwgYXJncyk7XG4gICAgfVxuXG4gICAgbGFzdFByb21pc2UgPSBydW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gVGVzdC5yZXNvbHZlKFRlc3QubGFzdFByb21pc2UpO1xuICAgIH0pO1xuXG4gICAgLy8gd2FpdCBmb3IgbGFzdCBoZWxwZXIncyBwcm9taXNlIHRvIHJlc29sdmUgYW5kIHRoZW5cbiAgICAvLyBleGVjdXRlLiBUbyBiZSBzYWZlLCB3ZSBuZWVkIHRvIHRlbGwgdGhlIGFkYXB0ZXIgd2UncmUgZ29pbmdcbiAgICAvLyBhc3luY2hyb25vdXMgaGVyZSwgYmVjYXVzZSBmbiBtYXkgbm90IGJlIGludm9rZWQgYmVmb3JlIHdlXG4gICAgLy8gcmV0dXJuLlxuICAgIFRlc3QuYWRhcHRlci5hc3luY1N0YXJ0KCk7XG4gICAgcmV0dXJuIGxhc3RQcm9taXNlLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZm4uYXBwbHkoYXBwLCBhcmdzKTtcbiAgICB9KS5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgICAgVGVzdC5hZGFwdGVyLmFzeW5jRW5kKCk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bihmbikge1xuICBpZiAoIWVtYmVyUnVuLmN1cnJlbnRSdW5Mb29wKSB7XG4gICAgcmV0dXJuIGVtYmVyUnVuKGZuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxufVxuXG5FbWJlckFwcGxpY2F0aW9uLnJlb3Blbih7XG4gIC8qKlxuICAgVGhpcyBwcm9wZXJ0eSBjb250YWlucyB0aGUgdGVzdGluZyBoZWxwZXJzIGZvciB0aGUgY3VycmVudCBhcHBsaWNhdGlvbi4gVGhlc2VcbiAgIGFyZSBjcmVhdGVkIG9uY2UgeW91IGNhbGwgYGluamVjdFRlc3RIZWxwZXJzYCBvbiB5b3VyIGBFbWJlci5BcHBsaWNhdGlvbmBcbiAgIGluc3RhbmNlLiBUaGUgaW5jbHVkZWQgaGVscGVycyBhcmUgYWxzbyBhdmFpbGFibGUgb24gdGhlIGB3aW5kb3dgIG9iamVjdCBieVxuICAgZGVmYXVsdCwgYnV0IGNhbiBiZSB1c2VkIGZyb20gdGhpcyBvYmplY3Qgb24gdGhlIGluZGl2aWR1YWwgYXBwbGljYXRpb24gYWxzby5cblxuICAgIEBwcm9wZXJ0eSB0ZXN0SGVscGVyc1xuICAgIEB0eXBlIHtPYmplY3R9XG4gICAgQGRlZmF1bHQge31cbiAgICBAcHVibGljXG4gICovXG4gIHRlc3RIZWxwZXJzOiB7fSxcblxuICAvKipcbiAgIFRoaXMgcHJvcGVydHkgd2lsbCBjb250YWluIHRoZSBvcmlnaW5hbCBtZXRob2RzIHRoYXQgd2VyZSByZWdpc3RlcmVkXG4gICBvbiB0aGUgYGhlbHBlckNvbnRhaW5lcmAgYmVmb3JlIGBpbmplY3RUZXN0SGVscGVyc2AgaXMgY2FsbGVkLlxuXG4gICBXaGVuIGByZW1vdmVUZXN0SGVscGVyc2AgaXMgY2FsbGVkLCB0aGVzZSBtZXRob2RzIGFyZSByZXN0b3JlZCB0byB0aGVcbiAgIGBoZWxwZXJDb250YWluZXJgLlxuXG4gICAgQHByb3BlcnR5IG9yaWdpbmFsTWV0aG9kc1xuICAgIEB0eXBlIHtPYmplY3R9XG4gICAgQGRlZmF1bHQge31cbiAgICBAcHJpdmF0ZVxuICAgIEBzaW5jZSAxLjMuMFxuICAqL1xuICBvcmlnaW5hbE1ldGhvZHM6IHt9LFxuXG5cbiAgLyoqXG4gIFRoaXMgcHJvcGVydHkgaW5kaWNhdGVzIHdoZXRoZXIgb3Igbm90IHRoaXMgYXBwbGljYXRpb24gaXMgY3VycmVudGx5IGluXG4gIHRlc3RpbmcgbW9kZS4gVGhpcyBpcyBzZXQgd2hlbiBgc2V0dXBGb3JUZXN0aW5nYCBpcyBjYWxsZWQgb24gdGhlIGN1cnJlbnRcbiAgYXBwbGljYXRpb24uXG5cbiAgQHByb3BlcnR5IHRlc3RpbmdcbiAgQHR5cGUge0Jvb2xlYW59XG4gIEBkZWZhdWx0IGZhbHNlXG4gIEBzaW5jZSAxLjMuMFxuICBAcHVibGljXG4gICovXG4gIHRlc3Rpbmc6IGZhbHNlLFxuXG4gIC8qKlxuICAgIFRoaXMgaG9vayBkZWZlcnMgdGhlIHJlYWRpbmVzcyBvZiB0aGUgYXBwbGljYXRpb24sIHNvIHRoYXQgeW91IGNhbiBzdGFydFxuICAgIHRoZSBhcHAgd2hlbiB5b3VyIHRlc3RzIGFyZSByZWFkeSB0byBydW4uIEl0IGFsc28gc2V0cyB0aGUgcm91dGVyJ3NcbiAgICBsb2NhdGlvbiB0byAnbm9uZScsIHNvIHRoYXQgdGhlIHdpbmRvdydzIGxvY2F0aW9uIHdpbGwgbm90IGJlIG1vZGlmaWVkXG4gICAgKHByZXZlbnRpbmcgYm90aCBhY2NpZGVudGFsIGxlYWtpbmcgb2Ygc3RhdGUgYmV0d2VlbiB0ZXN0cyBhbmQgaW50ZXJmZXJlbmNlXG4gICAgd2l0aCB5b3VyIHRlc3RpbmcgZnJhbWV3b3JrKS5cblxuICAgIEV4YW1wbGU6XG5cbiAgICBgYGBcbiAgICBBcHAuc2V0dXBGb3JUZXN0aW5nKCk7XG4gICAgYGBgXG5cbiAgICBAbWV0aG9kIHNldHVwRm9yVGVzdGluZ1xuICAgIEBwdWJsaWNcbiAgKi9cbiAgc2V0dXBGb3JUZXN0aW5nKCkge1xuICAgIHNldHVwRm9yVGVzdGluZygpO1xuXG4gICAgdGhpcy50ZXN0aW5nID0gdHJ1ZTtcblxuICAgIHRoaXMuUm91dGVyLnJlb3Blbih7XG4gICAgICBsb2NhdGlvbjogJ25vbmUnXG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAgVGhpcyB3aWxsIGJlIHVzZWQgYXMgdGhlIGNvbnRhaW5lciB0byBpbmplY3QgdGhlIHRlc3QgaGVscGVycyBpbnRvLiBCeVxuICAgIGRlZmF1bHQgdGhlIGhlbHBlcnMgYXJlIGluamVjdGVkIGludG8gYHdpbmRvd2AuXG5cbiAgICBAcHJvcGVydHkgaGVscGVyQ29udGFpbmVyXG4gICAgQHR5cGUge09iamVjdH0gVGhlIG9iamVjdCB0byBiZSB1c2VkIGZvciB0ZXN0IGhlbHBlcnMuXG4gICAgQGRlZmF1bHQgd2luZG93XG4gICAgQHNpbmNlIDEuMi4wXG4gICAgQHByaXZhdGVcbiAgKi9cbiAgaGVscGVyQ29udGFpbmVyOiBudWxsLFxuXG4gIC8qKlxuICAgIFRoaXMgaW5qZWN0cyB0aGUgdGVzdCBoZWxwZXJzIGludG8gdGhlIGBoZWxwZXJDb250YWluZXJgIG9iamVjdC4gSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkXG4gICAgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBoZWxwZXJDb250YWluZXIuIElmIGBoZWxwZXJDb250YWluZXJgIGlzIG5vdCBzZXQgaXQgd2lsbCBkZWZhdWx0XG4gICAgdG8gYHdpbmRvd2AuIElmIGEgZnVuY3Rpb24gb2YgdGhlIHNhbWUgbmFtZSBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQgaXQgd2lsbCBiZSBjYWNoZWRcbiAgICAoc28gdGhhdCBpdCBjYW4gYmUgcmVzZXQgaWYgdGhlIGhlbHBlciBpcyByZW1vdmVkIHdpdGggYHVucmVnaXN0ZXJIZWxwZXJgIG9yXG4gICAgYHJlbW92ZVRlc3RIZWxwZXJzYCkuXG5cbiAgICBBbnkgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgd2l0aCBgb25JbmplY3RIZWxwZXJzYCB3aWxsIGJlIGNhbGxlZCBvbmNlIHRoZVxuICAgIGhlbHBlcnMgaGF2ZSBiZWVuIGluamVjdGVkLlxuXG4gICAgRXhhbXBsZTpcbiAgICBgYGBcbiAgICBBcHAuaW5qZWN0VGVzdEhlbHBlcnMoKTtcbiAgICBgYGBcblxuICAgIEBtZXRob2QgaW5qZWN0VGVzdEhlbHBlcnNcbiAgICBAcHVibGljXG4gICovXG4gIGluamVjdFRlc3RIZWxwZXJzKGhlbHBlckNvbnRhaW5lcikge1xuICAgIGlmIChoZWxwZXJDb250YWluZXIpIHtcbiAgICAgIHRoaXMuaGVscGVyQ29udGFpbmVyID0gaGVscGVyQ29udGFpbmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhlbHBlckNvbnRhaW5lciA9IHdpbmRvdztcbiAgICB9XG5cbiAgICB0aGlzLnJlb3Blbih7XG4gICAgICB3aWxsRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5yZW1vdmVUZXN0SGVscGVycygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy50ZXN0SGVscGVycyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWUgaW4gaGVscGVycykge1xuICAgICAgdGhpcy5vcmlnaW5hbE1ldGhvZHNbbmFtZV0gPSB0aGlzLmhlbHBlckNvbnRhaW5lcltuYW1lXTtcbiAgICAgIHRoaXMudGVzdEhlbHBlcnNbbmFtZV0gPSB0aGlzLmhlbHBlckNvbnRhaW5lcltuYW1lXSA9IGhlbHBlcih0aGlzLCBuYW1lKTtcbiAgICAgIHByb3RvV3JhcChUZXN0LlByb21pc2UucHJvdG90eXBlLCBuYW1lLCBoZWxwZXIodGhpcywgbmFtZSksIGhlbHBlcnNbbmFtZV0ubWV0YS53YWl0KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGluamVjdEhlbHBlcnNDYWxsYmFja3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpbmplY3RIZWxwZXJzQ2FsbGJhY2tzW2ldKHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICBUaGlzIHJlbW92ZXMgYWxsIGhlbHBlcnMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCwgYW5kIHJlc2V0cyBhbmQgZnVuY3Rpb25zXG4gICAgdGhhdCB3ZXJlIG92ZXJyaWRkZW4gYnkgdGhlIGhlbHBlcnMuXG5cbiAgICBFeGFtcGxlOlxuXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIEFwcC5yZW1vdmVUZXN0SGVscGVycygpO1xuICAgIGBgYFxuXG4gICAgQHB1YmxpY1xuICAgIEBtZXRob2QgcmVtb3ZlVGVzdEhlbHBlcnNcbiAgKi9cbiAgcmVtb3ZlVGVzdEhlbHBlcnMoKSB7XG4gICAgaWYgKCF0aGlzLmhlbHBlckNvbnRhaW5lcikgeyByZXR1cm47IH1cblxuICAgIGZvciAodmFyIG5hbWUgaW4gaGVscGVycykge1xuICAgICAgdGhpcy5oZWxwZXJDb250YWluZXJbbmFtZV0gPSB0aGlzLm9yaWdpbmFsTWV0aG9kc1tuYW1lXTtcbiAgICAgIGRlbGV0ZSBUZXN0LlByb21pc2UucHJvdG90eXBlW25hbWVdO1xuICAgICAgZGVsZXRlIHRoaXMudGVzdEhlbHBlcnNbbmFtZV07XG4gICAgICBkZWxldGUgdGhpcy5vcmlnaW5hbE1ldGhvZHNbbmFtZV07XG4gICAgfVxuICB9XG59KTtcblxuLy8gVGhpcyBtZXRob2QgaXMgbm8gbG9uZ2VyIG5lZWRlZFxuLy8gQnV0IHN0aWxsIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4vLyBvZiBoZWxwZXIgY2hhaW5pbmdcbmZ1bmN0aW9uIHByb3RvV3JhcChwcm90bywgbmFtZSwgY2FsbGJhY2ssIGlzQXN5bmMpIHtcbiAgcHJvdG9bbmFtZV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgaWYgKGlzQXN5bmMpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufVxuXG5UZXN0LlByb21pc2UgPSBmdW5jdGlvbigpIHtcbiAgUlNWUC5Qcm9taXNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIFRlc3QubGFzdFByb21pc2UgPSB0aGlzO1xufTtcblxuVGVzdC5Qcm9taXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUlNWUC5Qcm9taXNlLnByb3RvdHlwZSk7XG5UZXN0LlByb21pc2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVGVzdC5Qcm9taXNlO1xuVGVzdC5Qcm9taXNlLnJlc29sdmUgPSBUZXN0LnJlc29sdmU7XG5cbi8vIFBhdGNoIGB0aGVuYCB0byBpc29sYXRlIGFzeW5jIG1ldGhvZHNcbi8vIHNwZWNpZmljYWxseSBgRW1iZXIuVGVzdC5sYXN0UHJvbWlzZWBcbnZhciBvcmlnaW5hbFRoZW4gPSBSU1ZQLlByb21pc2UucHJvdG90eXBlLnRoZW47XG5UZXN0LlByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbihvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xuICByZXR1cm4gb3JpZ2luYWxUaGVuLmNhbGwodGhpcywgZnVuY3Rpb24odmFsKSB7XG4gICAgcmV0dXJuIGlzb2xhdGUob25TdWNjZXNzLCB2YWwpO1xuICB9LCBvbkZhaWx1cmUpO1xufTtcblxuLy8gVGhpcyBtZXRob2QgaXNvbGF0ZXMgbmVzdGVkIGFzeW5jIG1ldGhvZHNcbi8vIHNvIHRoYXQgdGhleSBkb24ndCBjb25mbGljdCB3aXRoIG90aGVyIGxhc3QgcHJvbWlzZXMuXG4vL1xuLy8gMS4gU2V0IGBFbWJlci5UZXN0Lmxhc3RQcm9taXNlYCB0byBudWxsXG4vLyAyLiBJbnZva2UgbWV0aG9kXG4vLyAzLiBSZXR1cm4gdGhlIGxhc3QgcHJvbWlzZSBjcmVhdGVkIGR1cmluZyBtZXRob2RcbmZ1bmN0aW9uIGlzb2xhdGUoZm4sIHZhbCkge1xuICB2YXIgdmFsdWUsIGxhc3RQcm9taXNlO1xuXG4gIC8vIFJlc2V0IGxhc3RQcm9taXNlIGZvciBuZXN0ZWQgaGVscGVyc1xuICBUZXN0Lmxhc3RQcm9taXNlID0gbnVsbDtcblxuICB2YWx1ZSA9IGZuKHZhbCk7XG5cbiAgbGFzdFByb21pc2UgPSBUZXN0Lmxhc3RQcm9taXNlO1xuICBUZXN0Lmxhc3RQcm9taXNlID0gbnVsbDtcblxuICAvLyBJZiB0aGUgbWV0aG9kIHJldHVybmVkIGEgcHJvbWlzZVxuICAvLyByZXR1cm4gdGhhdCBwcm9taXNlLiBJZiBub3QsXG4gIC8vIHJldHVybiB0aGUgbGFzdCBhc3luYyBoZWxwZXIncyBwcm9taXNlXG4gIGlmICgodmFsdWUgJiYgKHZhbHVlIGluc3RhbmNlb2YgVGVzdC5Qcm9taXNlKSkgfHwgIWxhc3RQcm9taXNlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBydW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gVGVzdC5yZXNvbHZlKGxhc3RQcm9taXNlKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUZXN0O1xuIl19
requireModule("ember-testing");

}());

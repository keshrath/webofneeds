/*
 * Copyright 2012  Research Studios Austria Forschungsges.m.b.H.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * Created by fkleedorfer on 27.08.2014.
 */

(function () {
    // determine if in-browser or using node.js
    var _browser = (typeof window !== 'undefined' || typeof self !== 'undefined');
    if (_browser) {
        if (typeof global === 'undefined') {
            if (typeof window !== 'undefined') {
                global = window;
            } else if (typeof self !== 'undefined') {
                global = self;
            } else if (typeof $ !== 'undefined') {
                global = $;
            }
        }
    }






    // attaches wonutils API to the given object
    var wrapper = function (wonutils) {
        return wonutils;
    };

    var factory = function () {
        return wrapper(function () {
            return factory();
        });
    };

    // the shared global wonutils API instance
    wrapper(factory);
    if (_browser) {
        // export simple browser API
        if (typeof wonutils === 'undefined') {
            wonutils = wonutilsjs = factory;
        } else {
            wonutils = factory;
        }
    }
})();
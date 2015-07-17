/**
 *
 * Created by ksinger on 06.07.2015.
 */

// enable es6 in jshint:
/* jshint esnext: true */

console.log('System.import working');


import angular from 'angular';
window.angular = angular; // for compatibility with pre-ES6/commonjs scripts

import wonAppTag from 'app/wonAppTag';

let app = angular.module('won.owner',[])
                 .directive('wonApp', wonAppTag);
//let app = angular.module('won.owner',[]);
angular.bootstrap(document, ['won.owner'], {
    // make sure dependency injection works after minification
    // see https://docs.angularjs.org/guide/production
    // and https://docs.angularjs.org/guide/di#dependency-annotation
    strictDi: true
});

console.log('app_jspm.js: ', angular);
window.app = app; //TODO for debugging only. remove me.
window.wonAppTag = wonAppTag; //TODO for debugging only. remove me.

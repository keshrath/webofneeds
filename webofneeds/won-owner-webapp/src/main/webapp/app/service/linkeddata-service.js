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
 * Created by fkleedorfer on 05.09.2014.
 */

angular.module('won.owner').factory('linkedDataService', function ($q, $rootScope) {
    linkedDataService = {};

    privateData = {};

    //create an rdfstore-js based store as a cache for rdf data.
    privateData.store =  rdfstore.create();


    getSafeValue = function(dataItem) {
        if (dataItem == null) return null;
        if (dataItem.value != null) return dataItem.value;
        return null;
    }

    /**
     * Fetches the linked data for the specified URI and saves it in the local triplestore.
     * @param uri
     * @return a promise to a boolean which indicates success
     */
    linkedDataService.fetch = function(uri) {
        var deferred = $q.defer();
        try {
            privateData.store.load('remote', uri, function (success, results) {
                $rootScope.$apply(function(){
                    deferred.resolve(success);
                });
            });
        } catch (e) {
            deferred.reject(e);
        }
        return deferred.promise;
    }

    /**
     * Retrieves the RDF data by dereferencing the specified URI.
     * @param uri
     * @param forceFetch if true, data will be fetched via http and updated in the cache before being returned.
     * @return a promise to the data, which is represented as JSON-LD.
     */
    linkedDataService.get = function(uri, forceFetch) {
        if (typeof forceFetch === 'undefined'){
            forceFetch = false;
        }
        var deferred = $q.defer();
        try {
            var done = false;
            //load the data from the local rdf store if forceFetch is false
            if (! forceFetch) {
                privateData.store.graph(uri, function (success, mygraph) {
                    $rootScope.$apply(function() {
                        if (success) {
                            deferred.resolve(mygraph);
                            done = true;
                        }
                    });
                })
            }
            if (done) {
                //if we found the data, we're done!
                return deferred.promise;
            }
            //we're not done yet - we have to fetch the data remotely
            linkedDataService.fetch(uri).then(
                function(successValue) {
                    //ignore successValue 'true'
                    deferred.notify("fetched data for " + uri);
                    //now get the data from the store and return
                    privateData.store.graph(uri, function(success, graph) {
                        $rootScope.$apply(function() {
                            deferred.resolve(graph);
                        });
                    })
                },
                function(reason) {
                    //handle error when fetching the data
                    deferred.reject("cannot get " + uri + ", reason:" + reason);
                },
                //don't handle updates
                null
            );
        } catch (e){
            deferred.reject(e);
        }
        return deferred.promise;
    }

    /**
     * Loads the default data of the need with the specified URI into a js object.
     * @return the object or null if no data is found for that URI in the local datastore
     */
    linkedDataService.getNeed = function(uri) {
        //TODO: SPARQL query that returns the common need properties
        var resultObject = null;
        /*var query =
            "prefix " + won.WONMSG.prefix + ": <" + won.WONMSG.baseUri + "> \n" +
            "prefix " + won.WON.prefix + ": <" + won.WON.baseUri + "> \n" +
            "SELECT ?basicNeedType ?title ?tag ?textDescription where {" +"\n"+
            "<" + uri +">" + won.WON.hasBasicNeedTypeCompacted + " ?basicNeedType ."+
            "<" + uri +">" + won.WON.hasContentCompacted + " ?content ."+
            "?content " + "dc:title" + " ?title ."+
            " OPTIONAL { " +
                "<" + uri +">" + won.WON.hasTagCompacted + " ?tag ."+
            "} OPTIONAL { " +
                "<" + uri +">" + won.WON.hasTextDescriptionCompacted + " ?tag ."+
            "}"+
            "}"; */
        var query =
            "prefix " + won.WONMSG.prefix + ": <" + won.WONMSG.baseUri + "> \n" +
            "prefix " + won.WON.prefix + ": <" + won.WON.baseUri + "> \n" +
            "prefix " + "dc"+":<"+"http://purl.org/dc/elements/1.1/>\n" +
            "select ?basicNeedType ?title ?tag ?textDescription where { " +
                "<" + uri + ">" + won.WON.hasBasicNeedTypeCompacted + " ?basicNeedType ."+
                "<" + uri + ">" + won.WON.hasContentCompacted + " ?content ."+
                "?content dc:title ?title ."+
                "OPTIONAL {<"+ uri + ">"+ won.WON.hasTagCompacted + " ?tag .}"+
                "OPTIONAL {<"+ uri + ">"+ won.WON.hasTextDescriptionCompacted + " ?textDescription ."+
                "}}";
        privateData.store.execute(query, function (success, results) {
            if (!success) {
                return;
            }
            //use only first result!
            if (results.length == 0) {
                return;
            }
            if (results.length > 1) {
                console.log("more than 1 solution found for message property query!");
            }
            var result = results[0];
            resultObject = {};
            resultObject.basicNeedType = getSafeValue(result.basicNeedType);
            resultObject.title = getSafeValue(result.title);
            resultObject.tag = getSafeValue(result.tag);
            resultObject.textDescription = getSafeValue(result.textDescription);

            //resultObject.log("done copying the data to the event object, returning the result");
        });
        return resultObject;
    }

    /**
     * Loads the default data of the need with the specified URI into a js object.
     * @return the object or null if no data is found for that URI in the local datastore
     */
    linkedDataService.getConnection = function(uri) {
        //TODO: SPARQL query that returns the common connection properties
    }

    /**
     * Loads the default data of the need with the specified URI into a js object.
     * @return the object or null if no data is found for that URI in the local datastore
     */
    linkedDataService.getMessage = function(uri) {
        //TODO: SPARQL query that returns the common message properties
    }

    /**
     * Loads the hints for the need with the specified URI into an array of js objects.
     * @return the array or null if no data is found for that URI in the local datastore
     */
    linkedDataService.getHintsForNeed = function(uri) {
        //TODO: SPARQL query that returns an array of hints
    }

    /**
     * Loads the connections for the need with the specified URI into an array of js objects.
     * @return the array or null if no data is found for that URI in the local datastore
     */
    linkedDataService.getConnections = function(uri) {
        //TODO: SPARQL query that returns an array of connections
    }


    return linkedDataService;

});
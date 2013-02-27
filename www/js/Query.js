/**
 * Query.js
 * Provides query string parsing and object to query string conversion
 * in the style of the JSON api
**/

Query = {
        parse: function(string){
                var kvs = string.indexOf('&') < 0 ? [string] : string.split('&')
                var obj = {}
                for(var i = 0; i < kvs.length; i++){
                        var tup = kvs[i].split('=')
                        if(tup.length == 2)
                                obj[ tup[0] ] = unescape( tup[1] )
                }
                return obj              
        },
        stringify: function(obj){
                var kvs = []
                for(var k in obj)
                kvs.push( k + '=' + escape( obj[k] ) )
                return kvs.join('&')
        }
}



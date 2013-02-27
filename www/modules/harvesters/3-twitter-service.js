var TwitterService;

/*jslint
  browser: true,
  devel: true,
  sub: true
*/

/*globals
  $: false, TL: false
*/

function twitter_oauth_complete() {
    'use strict';
    twitter_oauth_complete.callback(TwitterService.id, true);
}

TwitterService = {

    disabled: false,
    id: 'twitter',
    niceName: 'Twitter',
    logo: 'images/twitter-logo.png',
    icon: 'images/twitter-icon.png',
    solicitation: '<b>Twitter</b><br />Import tweets from your Twitter stream',
    currentMaxID: 0,

    /* service implementation... */
    login: function (callback) {
        'use strict';
        twitter_oauth_complete.callback = callback;

        var oauth = window.open('/oauth/twitter/auth/',
				'twitter_oauth',
				'status=0,menubar=0,toolbar=0,directories=0,scrollbars=1,height=350,width=500');
        oauth.moveTo(Math.floor(window.innerWidth / 2 - 250), 200);
    },

    isLoggedIn: function (callback) {
        'use strict';

	//return callback(false)
        $.getJSON('/oauth/twitter/check_auth', function (result) {
            console.log('Twitter.isLoggedIn: ', result);
            callback(result);
        });
    },

    initAPI: function (callback) {
        'use strict';

        TL.Data.GetAppData(function (data, ns) {
            TwitterService.currentMaxID = data['twitterMaxID'] || "0";
            callback(true);
        });
    },

    updateMaxID: function (newMaxID, callback) {
        'use strict';

        TL.Data.GetAppData(
            function (data, ns) {
                data['twitterMaxID'] = newMaxID;
                TL.Data.PutAppData(data, ns, callback);
            }
        );
    },

    getEventsSince: function (time, callback) {
        'use strict';
        TwitterService.getEvents(callback, TwitterService.currentMaxID);
    },

    getEvents: function (callback, since) {
        'use strict';
        /*jslint white: true*/
        since = since || false;
        $.get('/oauth/twitter/api/?oauth_api=statuses/user_timeline.json&oauth_api_params='
              + '{"count":100' + (since ? ',"since_id":' + since : '') + '}',
              function (result) {
                  if (result) {
                      var json, events, maxID;
                      json = JSON.parse(result);
                      events = TwitterService.normalizeEvents(json);
                      if (events.length) {
	                  maxID = TwitterService.findMaxID(events);
	                  TwitterService.updateMaxID(maxID, function () {
	                      TwitterService.currentMaxID = maxID;
                              callback(events);
	                  });
                      } else {
                          callback([]);
                      }
                  } else {
                      callback([]);
                  }
              }
             );
    },

    normalizeEvents: function (statuses) {
        'use strict';
        var events = [], k, s;

        for (k = 0; k < statuses.length; k += 1) {
            s = statuses[k];
            events.push({
                type: 'twitter',
                icon: 'images/tweet-bird.png',
                appIcon: TwitterService.icon,
                hash: 'TID' + s.id_str,
                caption: 'Twitter update',
                title: '',
                description: s.text,
                start: new Date(Date.parse(s.created_at)), /* - new Date().getTimezoneOffset()*60*1000 */
                end: null
            });
        }
        return events;
    },

    /*
     * Twitter only indexes statuses by ID, not time posted.
     * Because of that, we have to ask for new requests based
     * on the largest ID seen to date, as opposed to a timestamp.
     */
    findMaxID: function (statuses) {
        'use strict';
        var max = statuses[0], k;

        for (k = 0; k < statuses.length; k += 1) {
            if (statuses[k].start > max.start) {
                max = statuses[k];
            }
        }
        return max.hash;
    },

    searchEvents: function (events, query) {
        'use strict';
        return events;
    }
};

TL.RegisterSource(TwitterService);

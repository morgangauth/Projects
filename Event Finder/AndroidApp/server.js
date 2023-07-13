const fetch = require('node-fetch');

var express = require('express');
const axios = require('axios').default;
var app = express();
var geohash = require('ngeohash');

app.use(express.static('static'));
const cors = require('cors');
app.use(cors());


//constants
const TM_API_KEY = "fIjPidWmXgLZCGQpf1YJNKaSGtOgslVj";
const TM_BASE_URL = "https://app.ticketmaster.com/discovery/v2/";
const jsonStub = ".json?";

//variables
var geoPoint;

// Spotify
var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: '31d716c761574c00930ca74889a4b3a1',
  clientSecret: '1d53cc0f551d4ec3934ae78cffc3ced8',
  redirectUri: 'http://www.example.com/callback'
});

//functions

function getGoogleLocation(location) {
   const TOKEN = "AIzaSyC_K-cfhtDekCrmKOBJvFJtknIRxK_Kh-4";
   const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
   let url = BASE_URL+concatTerms(location) + "&key=" + TOKEN;
   console.log(url);
   return fetch(url)
 .then((response) => response.json())
 .then((data) => {
       if(data["status"] == "ZERO_RESULTS") {
           return "invalid";
       }
       let lat = data["results"][0]["geometry"]["location"]["lat"];
       let long = data["results"][0]["geometry"]["location"]["lng"];
       return getGeohash(lat, long);
   })
   .catch(error=> {
       console.log(error)
       })
}

function concatTerms(input) {
   const terms = input.split(" ");
   return terms.join("+");
}

function getGeohash(lat, long) {
   const GEO_PRECISION = 7;
   console.log(lat +" "+ long + " geohash: " + geohash.encode(lat, long, GEO_PRECISION));
   return geohash.encode(lat, long, GEO_PRECISION);
}

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.sendFile(path.join(__dirname, 'dist/hw8/index.html'));
})

app.get('/suggest', function (req, res) {
   console.log("Got a GET request for the suggest");

   const SUGGEST_STUB = "suggest";
   var keyword = req.query.keyword;

   var suggest_url = TM_BASE_URL + SUGGEST_STUB + "?" + "apikey=" + TM_API_KEY + "&keyword=" + keyword;
   console.log(suggest_url);

   axios.get(suggest_url)
  .then(function (response) {
    // handle success
    console.log(response);
    res.set({'Access-Control-Allow-Origin' : '*'});
    res.send( JSON.stringify( response.data ) )
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
})

app.get('/searchEvents', function (req, res) {
   console.log("Got a GET request for the event search");
   var autoLocation = req.query.autoLocation;
   var location = req.query.location;
   var eventId = req.query.eventId;

   if(eventId != "") {
      callEventSearch(req, res);
   }
   else if(autoLocation=="true") {
      let lat = req.query.lat;
      let long = req.query.long;
      geoPoint = getGeohash(lat, long);
      callEventSearch(req, res);
   
   // Get IP address location info - MOVED TO FRONT END
   // getIPinfo().then((obj) => {
   //    const latLong = obj.split(",");
   //    let lat = latLong[0];
   //    let long = latLong[1];
   //    geoPoint = getGeohash(lat, long);
   //    callEventSearch(req, res);

   // }
   // )
   // .catch(error=> {
   //    console.log(error)
   //    })
   }
   else {
      getGoogleLocation(location).then(
          (obj) => {
              if(obj == "invalid") {
               res.set({'Access-Control-Allow-Origin' : '*'});
               res.end(JSON.stringify( "invalid"));
              }
              geoPoint = obj;
              callEventSearch(req, res);
          }
      )
  }

  
})



function callEventSearch(req, res) {
   const EVENT_STUB = "events";
   var keyword = req.query.keyword;
   var radius = req.query.distance;
   var cat = req.query.category;
   var eventId = req.query.eventId;

   var segmentId;
   var search_url;

   if(cat == "Default") {
      segmentId = "";
   }
   else if(cat == "Music") {
      segmentId = "KZFzniwnSyZfZ7v7nJ";
   }
   else if(cat == "Sports") {
      segmentId = "KZFzniwnSyZfZ7v7nE";
   }
   else if(cat == "Arts & Theatre") {
      segmentId = "KZFzniwnSyZfZ7v7na";
   }
   else if(cat == "Film") {
      segmentId = "KZFzniwnSyZfZ7v7nn";
   }
   else if(cat == "Miscellaneous") {
      segmentId = "KZFzniwnSyZfZ7v7n1";
   }

   if(eventId == "") {
      search_url = TM_BASE_URL + EVENT_STUB + jsonStub + [
         "geoPoint=" + geoPoint,
         "radius=" + radius,
         "unit=miles",
         "keyword=" + keyword,
         "segmentId=" + segmentId,
         "sort=date,asc",
         "apikey=" + TM_API_KEY
     ].join("&");
   }
    else {
      search_url = TM_BASE_URL + EVENT_STUB + "/" + eventId + jsonStub + "apikey=" + TM_API_KEY;
      setSpotifyAccessToken();
    }
    console.log(search_url);
   axios.get(search_url)
  .then(function (response) {
    // handle success
    res.set({'Access-Control-Allow-Origin' : '*'});
    res.send( JSON.stringify( response.data ) )
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
    
  });

}

function getIPinfo() {
   let obj = "";
   const TOKEN = "2ffb14ed222be7";
   return fetch('https://ipinfo.io/?token=' + TOKEN)
 .then((response) => response.json())
 .then(data => {
   obj = data.loc;
   return obj;
   })
   .catch(error=> {
       console.log(error)
       });
}



app.get('/searchVenue', function (req, res) {
   console.log("Got a GET request for the venue");

   const VENUE_STUB = "venues/";
   var venueId = req.query.venue;

   var venue_url = TM_BASE_URL + VENUE_STUB + venueId + jsonStub + "apikey=" + TM_API_KEY;
   console.log(venue_url);
   axios.get(venue_url)
  .then(function (response) {
    // handle success
   //  console.log(response);
    res.set({'Access-Control-Allow-Origin' : '*'});
    res.send( JSON.stringify( response.data ) )
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
})

app.get('/searchArtist', function (req, res) {
   console.log("Got a GET request for the artist");
   getSpotifyArtist(req, res);

})

function getSpotifyArtist(req, res) {
   var artistName = req.query.artist;
   var artistData;

   // Search Artist
   spotifyApi.searchArtists(artistName)
  .then(function(data) {
    console.log('Search artists by "Name"');
    artistData = data.body.artists?.items[0];
    console.log(artistData);
    getSpotifyAlbums(req, res, artistData, artistData.id);

  }, function(err) {
    console.error(err);

  })
  .catch(function(err) {
   if(err.status == 401) {
      setSpotifyAccessToken();
      getSpotifyArtist(req, res);

   }
  });
}


function getSpotifyAlbums(req, res, artistData, artistId) {
   var responseData;
   
   // Get albums by a certain artist
   spotifyApi.getArtistAlbums(artistId, { limit: 3})
   .then(function(data) {
   console.log('Artist albums', data.body);
   responseData = {artist: artistData, albums: data.body};

   res.set({'Access-Control-Allow-Origin' : '*'});
   res.send( JSON.stringify( responseData ) )

   }, function(err) {
   console.error(err);
   })
   .catch(function(err) {
      if(err.status == 401) {
         setSpotifyAccessToken();
         getSpotifyArtist(req, res);
   
      }
     });
}

function setSpotifyAccessToken() {
   // Retrieve an access token.
   spotifyApi.clientCredentialsGrant().then(
      function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
   
      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
      },
      function(err) {
      console.log('Something went wrong when retrieving an access token', err);
      }
   );

}

var path = require('path');        
const port = process.env.PORT ||3000;   

//Set the base path to the angular-test dist folder
app.use(express.static(path.join(__dirname, 'dist/hw8')));

//Any routes will be redirected to the angular app
// app.get('*', function(req, res) {
//     res.sendFile(path.join(__dirname, 'dist/hw8/index.html'));
// });

//Starting server on port 8081
app.listen(port, () => {
    console.log('Server started!');
    console.log(port);
});


// https://stackoverflow.com/questions/51086672/deploying-angular-app-to-aws-elastic-beanstalk
// https://blog.devgenius.io/deploy-angular-nodejs-application-to-aws-elastic-beanstalk-9ab13076a736
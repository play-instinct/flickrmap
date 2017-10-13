const state = {
  photos: [],
  geojson: {},
  currentLat: 55.754093,
  currentLong: 37.6173,
  randomLocations: [{
      name: 'Paris, France',
      long: 2.352222,
      lat: 48.856614
    }, {
      name: 'Berlin, Germany',
      long: 13.404954,
      lat: 52.520007
    }, {
      name: 'New York, New York',
      long: -115.174556,
      lat: 36.1023717
    }, {
      name: 'Oahu, Hawaii',
      long: -158.000057,
      lat: 21.438912
    }, {
      name: 'Sacramento, California',
      long: -158.000057,
      lat: 21.438912
    }, {
      name: 'Athens, Greece',
      long: 23.727539,
      lat: 37.983810
    }, {
      name: 'San Paolo, Brazil',
      long: -46.633309,
      lat: -23.550520
    }, {
      name: 'Istanbul, Turkey',
      long: 28.978359,
      lat: 41.008238
    }, {
      name: 'Marrakesh, Morroco',
      long: -7.981084,
      lat: 31.629472
    }, {
      name: 'Bucaramanga, Colombia',
      long: -73.122742,
      lat: 7.119349
    }, {
      name: 'Seattle, Washington',
      long: -122.332071,
      lat: 47.606209
    }, {
      name: 'Las Vegas, Nevada',
      long: -115.139830,
      lat: 36.169941
    },

    {
      name: 'St. Petersburg, Russia',
      long: 30.335099,
      lat: 59.934280
    },

  ]
};


mapboxgl.accessToken =
  'pk.eyJ1IjoieWthdGVzcXVlIiwiYSI6ImNqN3V1bmphMjRlN3YyeHBrbDV0cmYyZzkifQ.IkEhhVc-aWVnuLsnNlf5Zg';


let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ykatesque/cj86z79ws33k12ro5es8c7yqx',
  center: [37.6173, 55.754093],
  zoom: 5,
});



let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken
});

map.addControl(geocoder);


map.on('load', function() {
  map.addSource('single-point', {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": []
    },
  });
  map.addLayer({
    "id": "point",
    "source": "single-point",
    "type": "circle",
    "paint": {
      "circle-radius": 10,
      "circle-color": "#007cbf"
    }
  });

  // Listen for the `geocoder.input` event that is triggered when a user
  // makes a selection and add a symbol that matches the result.
  geocoder.on('result', function(ev) {
    $('#map').removeClass('half-map');
    $('.detail-info-container').addClass('hidden');
    let coord = ev.result.geometry.coordinates;
    let geolong = coord[1];
    let geolat = coord[0];
    map.getSource('single-point').setData(ev.result.geometry);
    getDataFromFlickr(geolong, geolat, makeGeoJson);
  });
});



function getDataFromFlickr(lat, lon, callback) {
  $('.no-results').remove();
  state.photos = [];
  state.currentLat = lat,
    state.currentLong = lon
  const settings = {
    url: 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=a6342f1b1a90efed3c5276f7ea8bd15a&lat=' +
      lat + '&lon=' + lon +
      '&extras=geo%2C+owner_name&format=json&nojsoncallback=1',
    dataType: 'json',
    type: 'GET',
    success: callback,
    error: errorLog
  };
  $.ajax(settings).done(function(data) {
    state.photos = [];
    let result = data.photos.photo.slice(0, 100)
    if (result.length > 0) {
      state.photos = result.map(item => ({
        photo_url: 'https://farm' + item.farm + '.staticflickr.com/' +
          item.server + '/' + item.id + '_' + item.secret + '_z.jpg',
        thumb_url: 'https://farm' + item.farm + '.staticflickr.com/' +
          item.server + '/' + item.id + '_' + item.secret + '_q.jpg',
        flickr_url: 'https://flickr.com/' + item.owner + '/' + item.id,
        large_photo_url: 'https://farm' + item.farm +
          '.staticflickr.com/' + item.server + '/' + item.id + '_' +
          item.secret + '_b.jpg',
        author_url: 'https://www.flickr.com/photos/' + item.owner,
        author_id: item.owner,
        title: item.title,
        farm: item.farm,
        author_name: item.ownername,
        lat: item.latitude,
        long: item.longitude,
        photo_id: item.id,
        server: item.server,
        secret: item.secret,
      }));
      makeGeoJson(state.photos);
      console.log(state.photos);

    } else {
      state.photos = [];
      noResults();
    }

  });
};



function errorLog() {
  var error;
};

function noResults() {
  state.photos = [];
  $('#map').append(
    `<div class="no-results">No Results at this Location. <div class="try-again">Please try again.</div></div>`
  )
};



function makeGeoJson() {
  state.geojson = {
    "type": "FeatureCollection",
    "features": [],
  };
  if (state.photos.length > 0) {
    state.photos.forEach(function(x) {
      state.geojson.features.push({
        type: "Feature",
        properties: {
          name: x.title,
          thumb_url: x.thumb_url,
          author_name: x.author_id,
          full_size: x.photo_url,
        },
        geometry: {
          type: "Point",
          coordinates: [
            x.long,
            x.lat,
          ]
        }
      })
    });
  };
  state.geojson.features.forEach(function(marker) {
    var el = document.createElement('div');
    el.className = 'marker';
    new mapboxgl.Marker(el)
      .setLngLat(marker.geometry.coordinates)
      .setPopup(new mapboxgl.Popup({
          offset: 25
        }) // add popups
        .setHTML(
          `<figure class="effect-goliath"><img src="${marker.properties.thumb_url}" alt="img23"/>
                        <figcaption><p>View Details</p><a href="#" class="view-link">View more</a></figcaption></figure>`
        )).addTo(map);

  });
};


function displayDetailData(obj) {
  let url = obj.flickr_url;
  let author_url = obj.author_url;
  let author_name = 'Photo by ' + obj.author_name;
  $('.flickr-link').attr('href', url);
  $('.author-link').attr('href', author_url);
  $('a.author-link').text(author_name);
  $('.single-data').empty().append(
    `<h5>${obj.title}</h5><figure class="effect-goliath large-img"><img src="${obj.photo_url}" alt="img23" class="${obj.photo_id}"/>
                        <figcaption><p>View Full Screen</p><a href="#enlarge-modal"  rel="modal:open" class="fullscreen-link" >View more</a></figcaption></figure>`
  );
};






function geoLocateAndCallAPI() {
  const defaultLocation = {
    lat: 55.754093,
    long: 37.6173,
  };
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      const currLocation = {
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
      };
      map.flyTo({
        center: [currLocation.long, currLocation.lat],
        zoom: 12,
      });
      getDataFromFlickr(currLocation.lat, currLocation.long)
    }, function() {
      getDataFromFlickr(defaultLocation.lat, defaultLocation.long);
    })
  } else {
    getDataFromFlickr(defaultLocation.lat, defaultLocation.long);
  }

};

geoLocateAndCallAPI();


$('#random-location').on('click', function(e) {
  e.preventDefault();
  var randomlocation = state.randomLocations[Math.floor(Math.random() *
    state.randomLocations.length)];
  let lat = randomlocation.lat;
  let long = randomlocation.long;
  state.photos = [];
  $('.detail-info-container').addClass('hidden');
  map.flyTo({
    center: [long, lat],
    zoom: 12
  });
  getDataFromFlickr(lat, long);

});



$('#map').bind('DOMNodeInserted', function() {
  $('.mapboxgl-popup-content').addClass('animated fadeIn')
});



$('body').on('click', '.effect-goliath', function(e) {
  e.preventDefault();
  $('#map').addClass('half-map');
  $('.detail-info-container').removeClass('hidden');
  let img = $(this).parent().find("img")[0].src;
  const found = state.photos.find(item => item.thumb_url === img);
  displayDetailData(found);
});


$('body').on('click', '.mapboxgl-popup-close-button', function(e) {
  e.preventDefault();
  $('.detail-info-container').addClass('hidden');

});

$('body').on('click', '.close-link', function(e) {
  e.preventDefault();
  $('#map').removeClass('half-map');
  $('.detail-info-container').addClass('hidden');

});


$('body').on('click', '.fullscreen-link', function(e) {
  e.preventDefault();
  let img_id = $('.large-img img').attr("class");
  var result = state.photos.filter(function(obj) {return obj.photo_id === img_id;});
  let url = result[0].large_photo_url;
  $('.fullscreen-img').attr("src", url);
});



$('body').on('click', '.fullscreen-img', function(e) {
  e.preventDefault();
  $.modal.close();
});

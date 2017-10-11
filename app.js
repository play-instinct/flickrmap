
const state = {
    photos : [],
    geojson: {},
    currentLat: 55.754093,
    currentLong: 37.6173,
    randomLocations:[
        {
        "name": "Paris, France",
        long: 2.352222,
        lat: 48.856614
        },
        {
        "name": "Berlin, Germany",
        long: 13.404954,
        lat: 52.520007 
        },
        {  
        "name": "New York, New York",
        long: -115.174556,
        lat: 36.1023717
        },
            {
        "name": "Oahu, Hawaii",
        long: -158.000057,
        lat: 21.438912 
        },
            {
        "name": "Sacramento, California",
        long: -158.000057,
        lat: 21.438912 
        },
           {
        "name": "Athens, Greece",
        long: 23.727539,
        lat: 37.983810
        },
        {
            "name": "San Paolo, Brazil",
            long: -46.633309,
            lat: -23.550520
        }

    ]
    
}


mapboxgl.accessToken = 'pk.eyJ1IjoieWthdGVzcXVlIiwiYSI6ImNqN3V1bmphMjRlN3YyeHBrbDV0cmYyZzkifQ.IkEhhVc-aWVnuLsnNlf5Zg';


let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ykatesque/cj86z79ws33k12ro5es8c7yqx',
    center: [37.6173, 55.754093],
    zoom: 5,
    // causes pan & zoom handlers not to be applied, similar to
    // .dragging.disable() and other handler .disable() funtions in Leaflet.
});


let geocoder =  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
});

map.addControl(geocoder);

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));

map.on('load', function() {
    map.addSource('single-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
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




function changeMap(lat, lon){

}



function getDataFromFlickr(lat, lon, callback) {
    $('.no-results').remove();
    state.photos = [];
    state.currentLat = lat,
    state. currentLong = lon
    const settings = {
    url: 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=a6342f1b1a90efed3c5276f7ea8bd15a&lat=' + lat + '&lon='+ lon + '&format=json&nojsoncallback=1',
    dataType: 'json',
    type: 'GET',
    success: callback,
    error: errorLog
  };
  console.log('GETTING DATA')
  $.ajax(settings).done(function(data) {
    state.photos = [];
    result = data.photos.photo.slice(0, 60)
    console.log(result.length)
    if (result.length > 0) {
        state.photos = result.map(item => ({
        photo_url: 'https://farm' + item.farm + '.staticflickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_z.jpg',
        thumb_url: 'https://farm' + item.farm + '.staticflickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_q.jpg',
        flickr_url: 'https://flickr.com/' + item.owner + '/' + item.id,
        author_id: item.owner,
        title: item.title,
        farm: item.farm,
        photo_id: item.id,
        server: item.server,
        secret: item.secret,

        }));
        getGeoData(callback);

    }
      else {
        state.photos = [];
        noResults();
      }

    });

}


function errorLog(){
    console.log('error')
}


function getGeoData(callback){
console.log('in geo data')
let all = [];
if (state.photos.length > 0 ) {
     state.photos.forEach( function(x) {
    all.push(
        $.ajax({
            method: "GET",
            dataType: 'json',
            url: 'https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&api_key=a6342f1b1a90efed3c5276f7ea8bd15a&photo_id=' + x.photo_id + '&format=json&nojsoncallback=1',
        })
    );
 });

}
Promise.all(all).then(function(data){
    console.log('hello')
    data.forEach(function result(result){
        console.log(result)
       addLocationToState(result);
    });
     callback();

})
}


function addLocationToState(result, obj){
    console.log('in ADD LOCATION')
    const photolocation = result.photo;
    let lat = photolocation.location.latitude;
    let long = photolocation.location.longitude;
    const index = state.photos.findIndex(function(item){
        return item.photo_id === result.photo.id;

    });
    state.photos[index].lat = lat;
    state.photos[index].long = long;

// obj["lat"] = lat;
// obj["long"] = long;
}


function noResults(){
    console.log('no results');
    state.photos = {};
    $('#map').append(`<div class="no-results">No Results at this Location. <div class="try-again">Please try again.</div></div>`)

}







function makeGeoJson(){

      state.geojson = {
      "type": "FeatureCollection",
      "features": [],
   };
   if (state.photos.length > 0) {
       state.photos.forEach(function(x){
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
          x.lat
        ]
      } })
   });
   }


    state.geojson.features.forEach(function(marker) {
      var el = document.createElement('div');
      el.className = 'marker';
    new mapboxgl.Marker(el)
      .setLngLat(marker.geometry.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
      .setHTML(`<figure class="effect-goliath">
                        <img src="${marker.properties.thumb_url}" alt="img23"/>
                        <figcaption>
                            <p>View Details</p>
                            <a href="#" class="view-link">View more</a>
                        </figcaption>           
                    </figure>`))

        // `<h3> ${marker.properties.name} </h3> <div class="img-container"><img src="${marker.properties.thumb_url}"><span class="more-link">MORE INFO</span></div>`))
      // .setHTML('<h3>' + marker.properties.name + '</h3><img src="' + marker.properties.thumb_url + '>'))
      .addTo(map);
    });  

  
}


function displayDetailData(obj){

let url = obj.flickr_url 

$('.flickr-link').attr("href", url);
// $(`<h5>${obj.title}</h5><div class="large-img"><img src="${obj.photo_url}"></div>`).appendTo(".single-data").hide().fadeIn(300);
  $('.single-data').empty().append(

    `<h5>${obj.title}</h5><div class="large-img"><img src="${obj.photo_url}"></div>`)



}



function findPhotoByKey(array, key, value) {
    console.log('findPhot')
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            console.log('found it');
            console.log(array[i]);
            displayDetailData(array[i])
            }
    }
    return null;
}




function geoLocateAndCallAPI() {
    const defaultLocation = {
        lat: 55.754093,
        long: 37.6173,
    };

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(pos, options) {
             const currLocation = {
                lat: pos.coords.latitude,
                long: pos.coords.longitude,
            };
            map.flyTo({
                center: [currLocation.long, currLocation.lat],
                zoom: 12,
            });
            getDataFromFlickr(currLocation.lat, currLocation.long, makeGeoJson)

        }, function() {
            console.log('rendering default map')
        })
    } else {
        console.log('locating not working doing call with default location');

    }
    
}

geoLocateAndCallAPI();


$('#random-location').on('click', function (e) {
    e.preventDefault();
    var randomlocation = state.randomLocations[Math.floor(Math.random()*state.randomLocations.length)];
    let lat = randomlocation.lat
    let long = randomlocation.long
    state.photos = []
    map.flyTo({center: [long, lat],  zoom: 12});
    getDataFromFlickr(lat, long, makeGeoJson);
    // let lat =   (-74.50 + (Math.random() - 0.5) * 10); 
    // let long =  (40 + (Math.random() - 0.5) * 10);
    // state.photos = [];
    // map.flyTo({center: [lat, long,],  zoom: 12});
    // getDataFromFlickr(lat, long, makeGeoJson);
    
});


$('body').on('click', '.effect-goliath', function(e){
  e.preventDefault();
  $('#map').addClass('half-map');
  $('.detail-info-container').removeClass('hidden');
  let img = $(this).parent().find( "img" )[0].src
  findPhotoByKey(state.photos, "thumb_url", img)


});


$('body').on('click', '.close-link', function(e){
    e.preventDefault();
    $('#map').removeClass('half-map');
    $('.detail-info-container').addClass('hidden');

});



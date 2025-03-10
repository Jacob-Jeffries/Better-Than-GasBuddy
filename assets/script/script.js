// Global Variables used throughout the code base
var apiKey = "dd973ce46d39d0efc4bc792777fb49f2";
var city = "";
var state = "";
var country = "";
let startCity = "";
let endCity = "";
var date = ('dddd, MMMM Do YYYY');
var dateTime = ('YYYY-MM-DD HH:MM:SS');
var latitude  = "";
var longitude = "";
let pos = "";

// Jquery style main fucntion to load the page 
$(function () {

  // Event listeners for the city confirmation buttons, they call the getLocation() function passing in a string variable to denote the city's position in the schema  
  $(document).on("click", "#start-btn", function(event){
    pos = "start";
    getLocation(pos);
  });
  
  $(document).on("click", "#end-btn", function(event){
    pos = "end";
    getLocation(pos)
  });
  
  // Event listener for the main submit button, this button calls and tores the weather for each of the cities, then calls the mapbox fucntion to draw the map route and display the turn-by-turn directions
  $(document).on("submit", "#search-form", function(event) {
    event.preventDefault();
    $("#root").html('');
    console.log("lat/lon", latitude);

    displayWeather("start");
    displayWeather("end");
    callMapbox();  
  });

  // Redundant function that could be reworked 
  function getLocation(pos) {
    let id = "#"+pos;
    console.log(id);
    let searchLocation = $("#"+pos).val();
    console.log("location: ", searchLocation);
    getLocationByCity(searchLocation, pos);
  }

  // This function uses the openWeather API to act as a forward geocoder, confirm the user input for cities
  function getLocationByCity(searchLocation, pos) {
    let url = "//api.openweathermap.org/geo/1.0/direct";
    let data = {
      q: searchLocation,
      limit: 5,
      appid: apiKey,
    };
    console.log("Data", data);
    $.ajax({
      type: "get",
      url: url,
      data: data,
      dataType: "json",
      success: function (locations) {
        console.log(locations);
        console.log("length", locations.length);
        //if no results, show error
        if (locations.length == 0) {
          locationError(pos);
          return;
        }

        $("#search-btn").after('<div class="location-choice"><h3>Which One?</h3></div>');
        locations.forEach((location, index) => {
          $(".location-choice").append(`<button type="button" class="location-choice-btn" data-lat="${location.lat}" data-lon="${location.lon}" data-city="${location.name}" data-state="${location.state}" data-country="${location.country}" data-pos="${pos}" >${location.name}, ${location.state}</button>`);
        });
        $("#"+pos+"-location-error").hide();
      },
      error: function (response) {
        locationError();
        return;
      },
    });
    getWeatherData(latitude, longitude, pos);
  }

  // Once the user clicks on the city confirmation options, this listener takes the data for that specific city and stores it for later use. It also calls the getWeatherData() function
  $(document).on("click", ".location-choice-btn", function() {
    city = $(this).data('city');
    state = $(this).data('state');
    latitude = $(this).data('lat');
    longitude = $(this).data('lon');
    $(".location-choice").remove();
    localStorage.setItem($(this).data('pos')+"Lat", $(this).data('lat'));
    localStorage.setItem($(this).data('pos')+"Lon", $(this).data('lon'));
    if($(this).data('pos') == "start"){
      startCity = city;
    }
    else if($(this).data('pos') == "end"){
      endCity = city;
    }
    else{
      return
    };
    getWeatherData(latitude, longitude, $(this).data('pos'));
  });

  // If no city is found an error message is displayed, prompting the user to try again.
  function locationError(pos) {
    $("#"+pos+"-location-error").show();
  };

  // This function gets the weather data and stores it to local storage
  function getWeatherData(lat, lon, pos, addHistory=true) {

    var url = `https://api.openweathermap.org/data/3.0/onecall`;

    let data = {
      lat: lat,
      lon: lon,
      units: 'imperial',
      exclude: 'minutely,hourly',
      appid: apiKey,
    };

    $.ajax({
      type: "get",
      url: url,
      data: data,
      dataType: "json",
      success: function (weather) {
        console.log("Weather Data",weather);
        // if no results, show error
        if (weather.length == 0) {
          locationError();
          return;
        }

        //Store the received weather data to local storage
        localStorage.setItem(pos+"Weather", JSON.stringify(weather));
        console.log(pos);
        console.log(JSON.stringify(weather));
      },
      error: function (response) {
        locationError();
        return;
      },
    });
  };

  // This function is called twice to display the weather data for both the start and end cities
  function displayWeather(pos) {
    let weatherToday = JSON.parse(localStorage.getItem(pos+"Weather"));
    console.log(pos+"Weather");
    console.log(weatherToday);

    $(".cardBodyToday").empty();
    let currentDate = dayjs(dayjs.unix(parseInt(weatherToday.current.dt))).format("dddd, MMMM D, YYYY h:mmA");
    console.log("Current Date", currentDate);

    if(pos == "start"){
      cityName = startCity;
    };
    if(pos == "end"){
      cityName = endCity;
    };

    console.log(pos+"Value:",$("#"+pos).val());
		$('.'+pos+'cardTodayCityName').text(cityName);
		$('.cardTodayDate').text(currentDate);
		//Icons
		$('.'+pos+'icons').attr('src', `./assets/img/weather-icons/${weatherToday.current.weather[0].icon}.png`).attr('class', 'img-fluid');
		// Temperature
		var pEl = `<p>Temperature: ${weatherToday.current.temp} °F</p>`;
		$('.'+pos+'cardBodyToday').append(pEl);
		//Feels Like
		var pElTemp = `<p>Feels Like: ${weatherToday.current.feels_like} °F</p>`;
		$('.'+pos+'cardBodyToday').append(pElTemp);
		//Humidity
		var pElHumid = `<p>Humidity: ${weatherToday.current.humidity} %</p>`;
		$('.'+pos+'cardBodyToday').append(pElHumid);
		//Wind Speed
		var pElWind = `<p>Wind Speed: ${weatherToday.current.wind_speed} MPH</p>`;
		$('.'+pos+'cardBodyToday').append(pElWind);
  };
});

// Start of MAPBOX code

function callMapbox(){
  let start = [null]
  let end = [null]

  // This takes the lat & long from the weather API for the starting city. I pull it from local storage - essentially I am using the weather API as my forward geocoding service
  start = [parseFloat(localStorage.getItem("startLon")), parseFloat(localStorage.getItem("startLat"))]
  console.log(start);

  // Hard coded the end point for development, until the second city in the form is working & storing Lon / Lat to local storage
  // end = [-84.546667, 42.733611];
  end = [parseFloat(localStorage.getItem("endLon")), parseFloat(localStorage.getItem("endLat"))]
  console.log(end);

  getRoute(start, end);

  start = [null]
  end = [null]
}

// Save my API Token as a variable used later in the API call
mapboxgl.accessToken = 'pk.eyJ1IjoiamFjb2ItamVmZnJpZXMiLCJhIjoiY2xjcDJzeTJtMWh3YzNwcjBscWJ2amg5OCJ9.FCsyRgLMa5gW0lyMlWsClw';

// Creates a "map" variable and  draws it onto the screen; into which start point, end point, and directions lines will be drawn.
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-86, 44], // starting position
  zoom: 4.5
});

// getRout(start, end) create a function to make a directions request
// This is an async function that uses await to handle the fetch promise
async function getRoute(start, end) {
  // Mapbox API call  
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  // await instead of .then . then to handle promise
  const json = await query.json();
  const data = json.routes[0];  
  // console.log(json.routes[0]);
  // Pulling out the route data from the returned JSON object
  const route = data.geometry.coordinates;
  console.log(route);

  // Creating an object that contains the route data in a structured "geojson" accordiung to MAPBOX specifications - used to draw route on the map: line endpoints are defined
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };

  // if the route already exists on the map, we'll reset it using setData
  // This gave me all sorts of trouble, once a layer is added to a map it is non longer a "layer" and becomes a "source" to move it you have to modify the "source" not the "layer" - GOLLY!
  if (map.getSource('route')) {
    // console.log("if");
    map.getSource('route').setData(geojson);
    map.getSource('point').setData(
      {
        type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [
                  parseFloat(localStorage.getItem("startLon")),
                  parseFloat(localStorage.getItem("startLat"))]
              }
      });
    map.getSource('end').setData(
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: end
        }
      });
  }
  // otherwise, we'll make a new request and draw the new features
  else {
    // Adds a blue line to represent the travel path
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });

    //Adds a Green circle to the map to represent the start point
    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [
                  parseFloat(localStorage.getItem("startLon")),
                  parseFloat(localStorage.getItem("startLat"))]
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#00FF00'
      }
    });

    //Add a red circle to the map to represent the destination point
    map.addLayer({
      id: 'end',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: end
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius':10,
        'circle-color': '#f30'
      }
    });
  }
  
  // Add turn instructions here at the end
  // Line 327: calls the original JSON from the MAPBOX directions API call, and pulls out the text of directions. 
  const instructions = document.getElementById('instructions');
  const steps = data.legs[0].steps;
  let tripInstructions = '';
  for (const step of steps) {
    tripInstructions += `<li>${step.maneuver.instruction}</li>`;
  }
  instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
    data.duration / 3600)} hr 🚗 </strong></p><ol>${tripInstructions}</ol>`;
};
// END of async that get directions from MAPBOX directions API
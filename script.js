let map;
let geocoder;
let cityDataCache = {};
let infoWindow; // Declare a global InfoWindow variable

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.0902, lng: -95.7129 },
        zoom: 4,
    });
    geocoder = new google.maps.Geocoder();
    preprocessCityData();

    // Create a single InfoWindow instance
    infoWindow = new google.maps.InfoWindow();

    map.addListener("click", (mapsMouseEvent) => {
        const latLng = mapsMouseEvent.latLng.toJSON();
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results[0]) {
                let city = '';
                let state = '';
                const cityComponent = results[0].address_components.find(component => component.types.includes("locality"));
                const stateComponent = results[0].address_components.find(component => component.types.includes("administrative_area_level_1"));
                if (cityComponent) {
                    city = cityComponent.long_name;
                }
                if (stateComponent) {
                    state = stateComponent.long_name;
                }
                if (city && state) {
                    const formattedCityName = formatCityName(city, state);
                    const populationData = getPopulation(formattedCityName);
                    const content = `<b>Location:</b> ${formattedCityName}<br><b>Latitude:</b> ${latLng.lat}<br><b>Longitude:</b> ${latLng.lng}<br><b>Population:</b> ${populationData}`;
                    infoWindow.setContent(content); // Update InfoWindow content
                    infoWindow.setPosition(latLng); // Set InfoWindow position
                    infoWindow.open(map); // Open InfoWindow
                } else {
                    alert(`Latitude: ${latLng.lat}\nLongitude: ${latLng.lng}\nCity or state information not available for this location.`);
                }
            }
        });
    });
}

function preprocessCityData() {
    const url = `https://api.census.gov/data/2019/pep/population?get=POP,NAME&for=place:*&in=state:*&key=${CENSUS_API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.slice(1).forEach(row => {
                const cityName = row[1].toLowerCase();
                const population = row[0];
                cityDataCache[cityName] = population;
            });
        })
        .catch(error => {
            console.error('Error preprocessing city data:', error);
        });
}

function formatCityName(city, state) {
    const stateLowerCase = state.toLowerCase();
    for (const suffix of ["corporation", "city", "county", "lynchburg", "islamorada", "town", "county", "kearns", "magna", "copperton", "government", "canyon", "village", "balance", "counties", "borough", "princeton", "municipality", "cdp"]) {
        const formattedName = `${city.toLowerCase()} ${suffix}, ${stateLowerCase}`;
        if (cityDataCache[formattedName]) {
            return formattedName;
        }
    }
    return `${city.toLowerCase()}, ${stateLowerCase}`; // Default format if no suffix matches
}

function getPopulation(formattedCityName) {
    const population = cityDataCache[formattedCityName];
    if (population) {
        return population;
    }
    console.log(`Population data not found for ${formattedCityName}`);
    return 'Population data not found';
}

document.addEventListener("DOMContentLoaded", function () {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=initMap&libraries=&v=weekly`;
    script.defer = true;
    document.head.appendChild(script);

    // Add passive event listeners for touchstart and touchmove
    document.addEventListener('touchstart', function onTouchStart(event) {
        event.preventDefault();
    }, { passive: true });

    document.addEventListener('touchmove', function onTouchMove(event) {
        event.preventDefault();
    }, { passive: true });
});

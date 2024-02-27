const [latitude=16.2644673, longitude=48.0173229] = campground.geometry.coordinates // supply default coordinates as old campgrounds don't have one
console.log(`lat=${latitude}, lon=${longitude}`);
var map = L.map("map").setView([longitude, latitude], 13); // Set initial location and zoom level
// Add the OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
}).addTo(map);

// Add a single marker
var marker = L.marker([longitude, latitude]).addTo(map);

// Bind a popup to the marker
marker.bindPopup(campground.title).openPopup();
var map = L.map("map").setView([40.66995747013945, -53.59179687498357], 3);

L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png")
    .addTo(map);

var markers = L.markerClusterGroup();

for (var i = 0; i < campgrounds.length; i++) {
    var [latitude = 16.0 + Math.random(), longitude = 48.0+Math.random()] = campgrounds[i].geometry.coordinates; // Koordinaten auslesen und als Default rund um Pfaffstätten verwenden
    var title = campgrounds[i].properties.popUpMarkup;
    var marker = L.marker(new L.LatLng(longitude, latitude), {
//        title: title,
        title: campgrounds[i].title,
    });
    marker.bindPopup(title);
    markers.addLayer(marker);
}

map.addLayer(markers);
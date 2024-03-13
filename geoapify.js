if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const axios = require('axios');
const FileSystem = require("fs");
const querystring = require('querystring');


module.exports.getLatLon = (ort) => {
//    console.log(`GEOAPIFY_KEY= '${process.env.GEOAPIFY_KEY}'`)
    const query = {text:ort,apiKey:process.env.GEOAPIFY_KEY};
    const urlQuery = querystring.stringify(query);
    //console.log(`urlQuery: '${urlQuery}'`);

/*    const config = {
        method: 'get',
        url: `https://api.geoapify.com/v1/geocode/search?${urlQuery}`,
        headers: { }
    };
    const defaultLon='48.01486372988319';
    const defaultLat='16.262750133845064';
    let lon=defaultLon;
    let lat=defaultLat;
    axios(config)
    .then(function (response) {
        console.log('response.data = ', response.data);
        if (features in response.data) {
            console.log('  features definiert');
            if (properties in response.data.features[0]) {
                console.log('    properties definiert');
                const f=response.data.properties.features[0];
                if (lon in f) { lon=f.lon; };
                if (lat in f) { lat=f.lon; };
            } else {
                console.log('    properties NICHT definiert!');
            }
        } else {
            console.log('  features NICHT definiert!');
        }
    })
    .catch(function (error) {
      console.log(error);
    });
    //console.log(`lon: ${lon}, lat: ${lat}`);
    return {lon:lon,lat:lat,defaultLon:defaultLon,defaultLat:defaultLat};
*/
    return true;
}

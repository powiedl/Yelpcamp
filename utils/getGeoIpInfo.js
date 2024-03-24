const axios = require('axios');
const jsonFile = require('jsonfile');
const IPGeolocationAPI = require('ip-geolocation-api-javascript-sdk');
const GeolocationParams = require('ip-geolocation-api-javascript-sdk/GeolocationParams.js');


module.exports=async function (ip,cookies) {

        //const url=`https://ipgeolocation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&ip_address=${ip}&fields=country,city`
    //const url=`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${ip}&fields=country_name,city`;
    //const url=`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=81.217.68.179&fields=country_name,city`;
    const url=`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${ip}&fields=country_name,city`;
    //const url='https://ipgeolocation.abstractapi.com/v1/?api_key=9e297ac3aa51404497dc60e88f70d9e4&ip_address=81.217.68.179&fields=country,city'
    //console.log('geoipinfo url="',url,'"');

    async function handleResponse(json) {
        console.log(json);
        return json;
        // ({country_name,city} = json);
        // country_name = country_name || 'unknown'; // wenn man eine private IP hat, bekommt man von AbstractAPI ein null als Country retour
        // city = city || 'unknown'; // wenn man eine private IP hat, bekommt man von AbstractAPI ein null als City retour
        // console.log('  ipGeolocationAPI information: country_name=',country_name,'city=',city);
        // return({country_name:country_name,city:city});
    }
    let country_name = cookies?.ipCountry || '';
    let city = cookies?.ipCity || '';
    if (!country_name || !city ) {
        const geolocationParams = new GeolocationParams();
        geolocationParams.setIPAddress('81.217.68.179');
        geolocationParams.setFields('country_name,city');
        try {
            const response=await axios.get(url);
            ({country_name,city} = response.data);
        } catch {
            country_name='unknown';
            city='unknown';
        }
        console.log('  ipGeolocationAPI fresh return: country_name=',country_name,'city=',city);
        return({country:country_name,city:city});
    } else {
//        console.log('  ipGeolocationAPI cached return: country_name=',country_name,'city=',city);
        return({country:country_name,city:city});
    }
}
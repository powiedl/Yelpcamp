const axios = require('axios');
const jsonFile = require('jsonfile');

module.exports=async function (ip,cookies) {

    const url=`https://ipgeolocation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&ip_address=${ip}&fields=country,city`
    //const url='https://ipgeolocation.abstractapi.com/v1/?api_key=9e297ac3aa51404497dc60e88f70d9e4&ip_address=81.217.68.179&fields=country,city'
    //console.log('geoipinfo url="',url,'"');
    let country = cookies?.ipCountry || 'abstractAPI';
    let city = cookies?.ipCity || 'abstractAPI';
    if (country === 'abstractAPI' || city === 'abstractAPI') {
        const res = await axios.get(url);
        if (res.statusText === 'OK') {
//            jsonFile.writeFile('/tmp/abstractAPI.json',res.data);
            ({country,city} = res.data);
            country = country || 'unknown'; // wenn man eine private IP hat, bekommt man von AbstractAPI ein null als Country retour
            city = city || 'unknown'; // wenn man eine private IP hat, bekommt man von AbstractAPI ein null als City retour
        } else {
            country = 'unknown';
            city = 'unknown'
        }
    }
    return({country:country,city:city});
}
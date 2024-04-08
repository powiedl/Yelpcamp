function formatTimeStamp(t, id) {
    if (!id) {
        console.log(`formatTimeStamp, id='${id}'`);
        console.log(`formatTimeStamp, t='${t}'`);
    }
    const timeStamp = new Date(t*1000);
    if (!id) {
        console.log(`formatTimeStamp, timeStamp='${timeStamp}'`);
    }
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
    const now=new Date();
    let erg=''
    const year = now.getFullYear() === timeStamp.getFullYear() ? '' : timeStamp.getFullYear()
    if (now.toDateString() === timeStamp.toDateString()) {
        erg='heute,';
    } else {
        now.setDate(now.getDate()-1)
        if (now.toDateString() === timeStamp.toDateString()) {
            erg='gestern,';
        } else {
            erg=`${timeStamp.getDate()}. ${months[timeStamp.getMonth()]} ${year}`.trim()
        }
    }
    const hours = timeStamp.getHours() < 10 ? '0' : '' + timeStamp.getHours();
    const minutes = timeStamp.getMinutes() < 10 ? '0' : '' + timeStamp.getMinutes();
    let seconds;
    if(erg === 'heute,') {
        seconds = ':' + (timeStamp.getSeconds()<10 ? '0' : '' ) + timeStamp.getSeconds();
    } else {
        seconds = '';
    }
    erg=`${erg} ${hours}:${minutes}${seconds}`;
    //console.log(`formatTimeStamp, erg='${erg}'`);
    if (id) {
        document.querySelector('#' + id).innerText = erg;
    } else {
        console.log(`formatTimeStamp='${year}-${timeStamp.getMonth()}-${timeStamp.getDate()} ${hours}:${minutes}:${seconds}'`);
    }
    return erg;
}
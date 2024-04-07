function formatTimeStamp(t, id) {
    console.log(`formatTimeStamp, id='${id}'`);
    //console.log(`formatTimeStamp, t='${t}'`);
    const timeStamp = new Date(t*1000);
    //console.log(`formatTimeStamp, timeStamp='${timeStamp}'`);
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
    const now=new Date();
    let erg=''
    if (now.toDateString() === timeStamp.toDateString()) {
        erg='heute,';
    } else {
        now.setDate(now.getDate()-1)
        if (now.toDateString() === timeStamp.toDateString()) {
            erg='gestern,';
        } else {
            todayerg=`${timeStamp.getDate()}. ${months[timeStamp.getMonth]} ${t.getFullYear()}`
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
    console.log(`formatTimeStamp, erg='${erg}'`);
    document.querySelector('#' + id).innerText = erg;
    return erg;
}
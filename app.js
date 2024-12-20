if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');

const ExpressError = require('./utils/ExpressError');
const geoIpInfo = require('./utils/getGeoIpInfo');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet'); // verlangt jetzt scheinbar https
const log = require('./models/log');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const { match } = require('assert');
const appVersion = '24.407.1';
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp2';
console.log(`dbUrl ='${dbUrl}'`);

mongoose.connect(dbUrl, {
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname,'public'))); // damit wird der Inhalt vom Ordner public "Teil" der Applikation und kann verwendet werden (wir verwenden ein css)
//app.use(helmet({contentSecurityPolicy : false })); // absichern der Header
// #region hemlet configuration 

const scriptSrcUrls = [
    "http://r51:3000/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com/",
];
const styleSrcUrls = [
    "http://r51:3000/",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com/",
];
const connectSrcUrls = [
    "http://r51:3000/",
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    
];
const fontSrcUrls = [];

app.use(
    helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dqsqcmfl9/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://unpkg.com/leaflet@1.9.4/",
                "http://a.tile.osm.org/",
                "http://b.tile.osm.org/",
                "http://c.tile.osm.org/",
                "http://d.tile.osm.org/",
                "https://a.tile.openstreetmap.org/",
                "https://b.tile.openstreetmap.org/",
                "https://c.tile.openstreetmap.org/",
                "https://d.tile.osm.org/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

//app.use(helmet({contentSecurityPolicy : false }));
// #endregion

const sessionSecret = process.env.SESSION_STORE_SECRET || 'thisIsMyDevelopmentSessionSecret';
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: sessionSecret,
    }
});

store.on('error',function (e) {
    console.log('SESSION STORE ERROR',e);
})

const sessionConfig = {
    store: store,
    name: 'meineSessionDamitManNichtWeissDassEsDieSessionIst', // sonst hat der Cookie einen Default Namen 'connect.sid' - damit kann ein Angreifer wissen: "dass ist der spannende Cookie"
    resave: false,
    saveUninitialized: true,
    secret: sessionSecret,
    cookie: {
        httpOnly: true,
        //secure: true, // damit funktioniert das Cookie nur über HTTPS (was wir nicht haben, daher muss man es ausblenden)
        expires:Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }    
}
app.use(session(sessionConfig));
app.use(flash());
app.use(mongoSanitize()); // entfernt gefährliche Zeichen, z. b. $ aus dem Querystring
app.use(passport.initialize());
app.use(passport.session()); // muss nach der Zeile app.use(session(...)); kommen, steht aber auch in der Passport-Doku
passport.use(new LocalStrategy(User.authenticate())); // die Methode .authenticate ist eines der Dinge die von Passport kommen
passport.serializeUser(User.serializeUser()); // wie bekommt man einen User in die Session
passport.deserializeUser(User.deserializeUser()); // wie bekommt man einen User aus der Session heraus, beides kommt von Passport
app.use(cookieParser()); // Cookie-Parser
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use((req,res,next) => {
    //flash handling
    // what to do, if we want to check, if an "unknown" flash type was sent? most likely because no flash type was sent and only the message itself
    //console.dir(req.flash); // does not work, because flash is a function, but it "must" be somewhere in the req object
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user; // req.user wird von passport mit den Daten des aktuell angemeldeten User gefüllt - oder undefined, wenn niemand angemeldet ist
    return next();
})

app.use(async(req,res,next) => {
    //my little logging ...
    const jetzt=new Date().toJSON();
    //console.log('******************************************');
    //console.log(`${jetzt}: method=${req.method},url='${req.url}',originalUrl='${req.originalUrl}'`); // spannenderweise sind baseurl und originalurl "leer"
    const ips = req.header('x-forwarded-for') || req.socket.remoteAddress;
    const arrIps = ips.split(',');
    const clientIp = arrIps[0]
    const otherIps = arrIps.slice(1,);
    const {country,city} = await geoIpInfo(clientIp,req.cookies);
    const logEntry = new log();
    logEntry.originalUrl = req.originalUrl;
    logEntry.clientIp = clientIp;
    logEntry.otherIps = otherIps;
    logEntry.method = req.method;
    logEntry.protocol = req.protocol;
    logEntry.timeStamp = jetzt;
    logEntry.username = req.user ? req.user.username : 'anonymous';
    logEntry.appVersion = appVersion;
    logEntry.country = country;
    logEntry.city = city;
    await logEntry.save();

    res.cookie('ipCountry',country, { 
        maxAge: 60*10*1000 // 10 Minuten
    });
    res.cookie('ipCity',city, { 
        maxAge: 60*10*1000 // 10 Minuten
    });
    
    //console.log(req.session);
    return next();
})

app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);
app.use('/',userRoutes);


app.get('/', (req, res) => {
    res.render('home')
});
app.get('/changelog', (req, res) => {
    res.render('changelog', { appVersion:appVersion })
});
app.get('/todos', (req, res) => {
    res.render('todos', { appVersion:appVersion })
});
app.get('/ipinfo',async (req,res) => {
    const ips = req.header('x-forwarded-for') || req.socket.remoteAddress;
    const arrIps = ips.split(',');
    const clientIp = arrIps[0]
    const otherIps = arrIps.slice(1,);
    const {country,city} = await geoIpInfo(clientIp,req.cookies);
    console.log('country=',country,'city=',city);
    const ipInfo={clientIp: clientIp, otherIps:otherIps,country:country,city:city};
    res.send(ipInfo);
})

app.get('/logs',async(req,res) => {
    const {isAdmin}=req.query;
    const logs = await log.find({});
    for (let log of logs) {
        if (!isAdmin) {
            if (log.username !== 'anonymous') {
                log.username = log.username.slice(0,1) + '***' + log.username.slice(-1); 
            } else log.username = '---'
        }
        const logMonth = log.timeStamp.getMonth() + 1; // getMonth startet mit 0
        log.timeStampString = log.timeStamp.getFullYear() +'-' +
        (logMonth <10 ? '0' : '') + logMonth + '-' + 
        (log.timeStamp.getDate() < 10 ? '0' : '') + log.timeStamp.getDate() + ' ' + 
        (log.timeStamp.getHours() < 10 ? '0' : '') + log.timeStamp.getHours() + ':' + 
        (log.timeStamp.getMinutes() < 10 ? '0' : '') + log.timeStamp.getMinutes() + ':' + 
        (log.timeStamp.getSeconds() < 10 ? '0' : '') + log.timeStamp.getSeconds();
    }

    res.render('logs',{isAdmin,logs});
})

function generateUser(username='user',domain='@mail.local',count=1) {
    const repeatCharacters=4; // the first repeatCharacters will be randomly repeated in mailaddress
    const maxRepetitions=5; // maximum number of repetitions for a single character
    const result=[];
    for (let index = 0; index < count; index++) {
        const singleResult = {username:'',mailaddress:''};
        for (let i=0; i<Math.min(repeatCharacters,username.length);i++) {
            let char=username.charAt(i);
            let repeat=Math.floor(Math.random()*maxRepetitions)+1; // 1-5
            singleResult['username']=singleResult['username'] + char + repeat.toString();
            singleResult['mailaddress']=singleResult['mailaddress'] + char.repeat(repeat);
        }
        if (username.length>repeatCharacters) {
            singleResult['username']=singleResult['username']+username.substring(repeatCharacters);
            singleResult['mailaddress']=singleResult['mailaddress']+username.substring(repeatCharacters);
        }
        singleResult['mailaddress']=singleResult['mailaddress']+domain;
        result.push(singleResult);
    }
    return(result);
}

app.get('/fakeUser', async (req,res) => {
    let { username='user',domain='@mail.local',count=1,password='verybad',behavior='generate' } = req.query;
//    console.log(`username='${username}', domain='${domain}', count=${count}`);
    if (domain.slice(0) !== '@') {
        domain='@'+domain;
    }
    if (behavior.toLowerCase()!=='original') {
        const users = generateUser(username,domain,count);
        for (let u of users) {
            const user = new User({email: u.mailaddress, username:u.username});
            const newUser = await User.register(user,password);
        }
        res.send(users);
    } else {
        const user = new User({email: (username+domain), username:username});
        const newUser = await User.register(user,password);
        res.send(user);
    }
})

// gilt für alle HTTP Verben für alle Routen - aber nur, wenn es nicht davor behandelt wurde, d. h. alles "unbekannte"
app.all('*', (req,res,next) => {
    next(new ExpressError('Page not found',404));
})

app.use((err,req,res,next) => {
    const { statusCode=500 } = err;
    if (!err.message) { err.message = 'Oh no, something went wrong (and nobody told me the bloody details ...)' }
    res.status(statusCode).render('error', { err });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
})

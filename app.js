if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');

const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

mongoose.connect('mongodb://localhost:27017/yelp-camp2', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
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
const sessionConfig = {
    secret: 'thisShouldBeABetterSecretAndItShouldNotBeDefinedDirectlyInTheSourcecode',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
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

app.use((req,res,next) => {
    //my little logging ...
    const jetzt=new Date().toJSON();
    //console.log('******************************************');
    console.log(`${jetzt}: method=${req.method},url='${req.url}',originalUrl='${req.originalUrl}'`); // spannenderweise sind baseurl und originalurl "leer"
    //console.log(req.session);
    return next();
})

app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);
app.use('/',userRoutes);


app.get('/', (req, res) => {
    res.render('home')
});

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

app.listen(3000, () => {
    console.log('Serving on port 3000');
    console.log('remember the owner used by seeding is "Tim" with a password of "TimTom"');
})
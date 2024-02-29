const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');
const axios = require('axios');
const Review = require('../models/review');
const User = require('../models/user');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

const Image = mongoose.model('Image', ImageSchema);

const images = [];
const cleanup = false;
const cleanupImages = false;
const cleanupCamps = false;
const cleanupUsers = false;
const createUsers = false; // wenn cleanup === true ist, werden auf jeden Fall neue User erzeugt
const maxImg=2; // wieviele (neue) Images sollen von unsplash geholt werden
const maxCamps=50; // wieviele Camps sollen generiert werden
const password = 'verybad'; // password for new users

async function seedImg(cnt) {
    images.length = 0; // clears the array
    for(let i=0;i<cnt;i++) {
        try {
            const resp = await axios.get('https://api.unsplash.com/photos/random', {
            params: {
                client_id: 'SMLcGS0xADbaF22P-s0DoCr55qiu2oGSIOK-p4vL7LI',
                collections: 1114848,
            },
        })
        const image = new Image({url:resp.data.urls.small});
        await image.save();
        //images.push(resp.data.urls.small);
        //console.log(`  image seeded ... ${resp.data.urls.small}'`);
      } catch (err) {
        console.error(err);
        break;        
      }
    }
    let imgsFromDb = await Image.find();
    console.log(`  found ${imgsFromDb.length} images in database ...`);
    for (let imgFromDb of imgsFromDb) {
        images.push(imgFromDb.url);
//        console.log(`    using image from '${imgFromDb.url}`);
    }
    console.log(`  using ${images.length} different images`);
}

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

mongoose.connect('mongodb://localhost:27017/yelp-camp2', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    let user = null;
    if (cleanup || cleanupCamps) {
        console.log('deleting all reviews ...');
        await Review.deleteMany({});
        console.log('deleting all campgrounds ...');
        await Campground.deleteMany({});
    }
    if (cleanup || cleanupUsers) {
        console.log('deleting all users ...');
        await User.deleteMany({});
    }
    if (cleanupImages && !cleanup) {
        console.log('deleting images ...');
        await Image.deleteMany({});
    }
    if (cleanup || cleanupUsers || createUsers) {
        console.log('generate new users ...');
        let users = generateUser('timi','@generated.local',5);
        for (let u of users) {
            const user = new User({email: u.mailaddress, username:u.username});
            try {
                newUser = await User.register(user,password);
                console.log(`  generated user '${newUser.username}, id='${newUser._id}`);
            } catch (e) {
                if (typeof e === 'UserExistsError') {
                    console.log(`  User '${user.username}' already exists. Skipping creation of this user.`);
                }
            }
        }
    }
    user = await User.find({email:'timtom@mail.anywhere', username:'timtom'});
    if (!user || user.length === 0) {
        user = new User({email:'tim@mail.anywhere', username:'tim'});
        try {
            newUser = await User.register(user,password);
            console.log(`  generated user '${newUser.username}, id='${newUser._id}`);
        } catch (e) {
            if (typeof e === 'UserExistsError') {
                console.log(`  User '${user.username}' already exists. Skipping creation of this user.`);
            }
        }
    }

    user = await User.find({email:'powidl@mail.anywhere', username:'powidl'});
    if (!user || user.length === 0) {
        user = new User({email:'powidl@mail.anywhere', username:'powidl'});
        try {
            newUser = await User.register(user,password);
            console.log(`  generated user '${newUser.username}, id='${newUser._id}`);
        } catch (e) {
            if (typeof e === 'UserExistsError') {
                console.log(`  User '${user.username}' already exists. Skipping creation of this user.`);
            }
        }
    }
    defaultAuthor=user._id;
    console.log(`default Author Id:'${defaultAuthor}'`);
    
    console.log('generate new campgrounds ...');
    await seedImg(maxImg);
    if (cleanup || cleanupCamps) {
        const imgCnt = Math.floor(Math.random()*2)+1;
        const curImages = [];
        for (let curImg=0;curImg<imgCnt;curImg++) {
            curImages.push({
                url: images[Math.floor(Math.random()*(images.length))],
                filename: ''
            })
        }
        const camp = new Campground({
            author: defaultAuthor, // ObjectID of user powidl
            location: 'Pfaffstätten, Austria',
            title: 'Powidl Camp',
            images: curImages,
            description: 'Pfaffstätten liegt im Industrieviertel in Niederösterreich. Die Fläche der Marktgemeinde umfasst 7,81 Quadratkilometer. 35,55 Prozent der Fläche sind bewaldet. Die höchste Erhebung ist der Pfaffstättner Kogel im Anningermassiv. Ortsteile sind Einöde und Pfaffstätten. Der bekannte Weinort liegt direkt an der Thermenlinie, wobei der Ortsteil Pfaffstätten im ebenen Teil der Gemeinde liegt, während der Ortsteil Einöde schon im Wienerwald liegt.',
            price:99 ,
            geometry: {
                type: "Point",
                coordinates: [
                    16.260432705650416,
                    48.00725562942716
                ]
            } 
        })
        await camp.save();
    }
    for (let i = 0; i < maxCamps; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const location = `${cities[random1000].city}, ${cities[random1000].state}`;
        const title = `${sample(descriptors)} ${sample(places)}`;
        const price = Math.floor(Math.random()*40+24);
        const imgCnt = Math.floor(Math.random()*2)+1;
        const curImages = [];
        for (let curImg=0;curImg<imgCnt;curImg++) {
            curImages.push({
                url: images[Math.floor(Math.random()*(images.length))],
                filename: ''
            })
        }
        console.log(`Seeding '${title}' at '${location}'. Price = ${price}, imgCnt=${imgCnt}, curImages.length=${curImages.length}'`);
        const camp = new Campground({
            author: defaultAuthor, // ObjectID of user powidl
            location: location,
            title: title,
            images: curImages, //'https://picsum.photos/400', // 'https://source.unsplash.com/collection/473251',
            description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Unde non cupiditate quaerat expedita maxime dolores autem harum reiciendis consequatur distinctio mollitia voluptatem, accusantium incidunt earum necessitatibus tenetur, quas est sit!            Aspernatur eveniet sit, possimus blanditiis laudantium praesentium quas, quisquam similique nihil omnis veniam, cum distinctio odio. Veritatis perferendis quibusdam minus molestias adipisci atque minima obcaecati sint, illo dolorum deleniti. Nisi!',
            price, // Abkürzung für price: price
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            } 
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
    console.log('Database disconnected');
})
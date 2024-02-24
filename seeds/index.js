const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');
const axios = require('axios');
const Review = require('../models/review');
const User = require('../models/user');

const images = [];

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
        images.push(resp.data.urls.small);
        //console.log(`  image seeded ... ${resp.data.urls.small}'`);
      } catch (err) {
        console.error(err);
        break;
      }
    }
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

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
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
    console.log('deleting all reviews ...');
    await Review.deleteMany({});
    console.log('deleting all campgrounds ...');
    await Campground.deleteMany({});
    console.log('deleting all users ...')
    await User.deleteMany({});

    console.log('generate new users ...');
    let users = generateUser('timi','@generated.local',5);
    const password = 'verybad';
    for (let u of users) {
        const user = new User({email: u.mailaddress, username:u.username});
        const newUser = await User.register(user,password);
    }
    let user = new User({email:'powidl@mail.anywhere', username:'powidl'});
    let newUser = await User.register(user,password);
    defaultAuthor=user._id;
    console.log(`powidl's User._id='${defaultAuthor}'`);

    const camp = new Campground({
        author: defaultAuthor, // ObjectID of user powidl
        location: 'Pfaffstätten, Austria',
        title: 'Powidl Camp',
        image: 'https://images.unsplash.com/photo-1594060026447-83de545e0c22?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Unde non cupiditate quaerat expedita maxime dolores autem harum reiciendis consequatur distinctio mollitia voluptatem, accusantium incidunt earum necessitatibus tenetur, quas est sit!            Aspernatur eveniet sit, possimus blanditiis laudantium praesentium quas, quisquam similique nihil omnis veniam, cum distinctio odio. Veritatis perferendis quibusdam minus molestias adipisci atque minima obcaecati sint, illo dolorum deleniti. Nisi!',
        price:99 // Abkürzung für price: price
    })
    await camp.save();

    user = new User({email:'tim@mail.anywhere', username:'tim'});
    newUser = await User.register(user,password);

    console.log('generate new campgrounds ...');
    const maxImg=25;
    await seedImg(maxImg);
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const location = `${cities[random1000].city}, ${cities[random1000].state}`;
        const title = `${sample(descriptors)} ${sample(places)}`;
        const price = Math.floor(Math.random()*40+24);
        const imgSource = images[Math.floor(Math.random()*maxImg)];
        console.log(`Seeding '${title}' at '${location}'. Price = ${price} and image='${imgSource}'`);
        const camp = new Campground({
            author: defaultAuthor, // ObjectID of user powidl
            location: location,
            title: title,
            image: imgSource, //'https://picsum.photos/400', // 'https://source.unsplash.com/collection/473251',
            description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Unde non cupiditate quaerat expedita maxime dolores autem harum reiciendis consequatur distinctio mollitia voluptatem, accusantium incidunt earum necessitatibus tenetur, quas est sit!            Aspernatur eveniet sit, possimus blanditiis laudantium praesentium quas, quisquam similique nihil omnis veniam, cum distinctio odio. Veritatis perferendis quibusdam minus molestias adipisci atque minima obcaecati sint, illo dolorum deleniti. Nisi!',
            price // Abkürzung für price: price
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
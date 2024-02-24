const jsonFile = require('jsonfile');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const CampgroundSchema = new Schema({
    title: String,
    image: String,
    images: [
        { 
            url: String,
            filename: String
        }

    ],
    price: Number,
    description: String,
    location: String,
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    author: {
        type: Schema.Types.ObjectId,
        ref:'User'
    }
});

const Campground = mongoose.model('Campground', CampgroundSchema);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

async function main() {
    const campgrounds = await Campground.find({});
    const uniqueImages = [];
    for (let c of campgrounds) { 
        //console.log(c.image);
        if (c.image && !uniqueImages.includes(c.image)) {
            uniqueImages.push(c.image);
        }
    }
    let pics=[];
    let lastCampground = {};
    for (let c of campgrounds) {
        //console.log(ui);
        pics=[];
        if (c.image) { 
            pics.push({url: c.image, filename:''}); 
            let picCount = Math.floor(Math.random()*2.5) + (c.image ? 0 : 1);
            for (let i=0;i<picCount; i++) {
                pics.push({url: uniqueImages[Math.floor(Math.random()*(uniqueImages.length))],
                    filename:''});
            }
            c.images=pics;
            delete c.image;
            lastCampground = c;
            console.log(c);
            console.log('-----------------------------------------------------------');
        } else {
            console.log(`unverändert: ${c.images}`);
        }
    }
//    await Campground.findByIdAndUpdate(lastCampground._id,lastCampground);

    for (let c of campgrounds) {
        await Campground.findByIdAndUpdate(c._id,c);
    }
}

main().then(() => {
    mongoose.connection.close();
})
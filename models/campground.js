const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

/* das Schema für ein Bild, notwendig für das virtual Attribut thumbnail - wird aber nicht exportiert,
 sondern nur im CampgroundSchema verwendet - und wollte ich auch schon für die "Zerteilung" der 
 Validierung des Dokuments vor und nach Upload machen */
const ImageSchema = new Schema({
    url: String,
    filename: String
})

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
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

// Thumbnail-URL: (200x200, Seitenverhältnis beibehalten: w_200,h_200,c_limit, z. b: https://res.cloudinary.com/dqsqcmfl9/image/upload/w_200,h_200,c_limit/v1708860833/Yelpcamp/fhraqnfeq4z0ic8wj8yi.jpg
ImageSchema.methods.getThumbnail = function(px=200) { // weil ein virtual keine Parameter unterstützt, darum eine Instanzmethode machen
    // px Größe des thumbnails, Standardwert 200
    return this.url.replace('/upload',`/upload/w_${px},h_${px},c_limit`);
}

// Mongoose Middleware für Campgrounds
CampgroundSchema.post('findOneAndDelete',async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews // matcht alle Reviews, die in dem Array reviews im Campground enthalten sind
            }
        })    
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);
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

const opts = { toJSON: { virtuals: true }}; // damit virtuals beim JSON.stringify "mitgenommen werden", 
    // muss dann bei der Definition des Schemas auch noch als Parameter mitgegeben werden
const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type:[Number],
            required: true
        }
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    author: {
        type: Schema.Types.ObjectId,
        ref:'User'
    }
}, opts);

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

// //das funktioniert 
// CampgroundSchema.virtual('quaxi').get(function() {
//     console.log('getting quaxi');
//     return "I AM A POPUP TEXT!!!";
// })

CampgroundSchema.virtual('properties.popUpMarkup').get(function() {
    return `<a href="/campgrounds/${this._id}">${this.title}</a>` 
})

module.exports = mongoose.model('Campground', CampgroundSchema);
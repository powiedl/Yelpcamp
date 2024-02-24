const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    title: String,
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
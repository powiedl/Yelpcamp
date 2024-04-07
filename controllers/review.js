const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    review.timeStamp = Date.now();
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success','Successfully made a new review!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async(req,res) => {
    const {reviewId, id} = req.params;
    //res.send(`DELETE ME!! Review '${reviewId}' for campground '${id}'`);
    await Campground.findByIdAndUpdate(id,{ $pull: { reviews: reviewId }}); // The $pull operator removes from an existing array all instances of a value or values that match a specified condition.
    await Review.findByIdAndDelete(reviewId);
    req.flash('success','Successfully deleted a review!');
    res.redirect(`/campgrounds/${id}`);
};
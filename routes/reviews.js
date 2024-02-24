const express = require('express');
const router = express.Router({ mergeParams: true }); // damit man auch auf die Id aus dem Campground-Teil der "Basis-URL" zugreifen kann, weil die schon im außenstehenden app.use definiert wird
const reviews = require('../controllers/review');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn,isReviewAuthor,validateReview } = require('../middleware');

router.post('/', isLoggedIn,validateReview, catchAsync(reviews.createReview));

router.delete('/:reviewId',isLoggedIn,isReviewAuthor,catchAsync(reviews.deleteReview));
    
module.exports = router;
const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const jsonFile = require('jsonfile');
const axios = require('axios');

// #region all campgrounds
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
//    console.log('campgrounds[0].properties=',campgrounds[0].properties);
    res.render('campgrounds/index', { campgrounds })
};

module.exports.indexOfUser = async (req, res) => {
    const userId = req.user._id;
    const campgrounds = await Campground.find({author: userId});
//    console.log('campgrounds[0].properties=',campgrounds[0].properties);
    res.render('campgrounds/index', { campgrounds, scope:'my' })
};
// #endregion all campgrounds

// #region show one campground
module.exports.renderShowForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error','Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    jsonFile.writeFile('/tmp/campground-show.json',campground);
    res.render('campgrounds/show', { campground, isAuthenticated: req.isAuthenticated(),currentUser: res.locals.currentUser });
};
// #endregion show one campground

// #region new campground
module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new', { flashWidth:'small' });
};

module.exports.createCampground = async (req, res, next) => {
//    if (!req.body.campground) throw new ExpressError('Invalid Campground Data',400);
    const geoUrl=`https://api.geoapify.com/v1/geocode/search?text=${req.body.campground.location}&apiKey=${process.env.GEO_API_KEY}`
    const locationCords = await axios.get(geoUrl);
    const {features: [{geometry}]} = locationCords.data;
    // geometry = { type: 'Point', coordinates: [ 15.7504779, 47.8055874 ] }
    const campground = new Campground(req.body.campground);
    campground.geometry = geometry;
    campground.images = req.files.map( f => ({ url: f.path, filename: f.filename }))
    campground.author = req.user._id;
    await campground.save();
    req.flash('success','Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
};
// #endregion all campgrounds


// #region edit one campground
module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash('error','Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground, flashWidth:'small' });
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    //console.log(req.body);
    const geoUrl=`https://api.geoapify.com/v1/geocode/search?text=${req.body.campground.location}&apiKey=${process.env.GEO_API_KEY}`
    const locationCords = await axios.get(geoUrl);
    const {features: [{geometry}]} = locationCords.data;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map( f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs) // ... spread Operator, holt alle Elemente einzeln aus dem Array heraus
        // sonst hätte man ein Array in das Array eingefügt - und die Validation wäre fehlgeschlagen
    campground.geometry = geometry;
    await campground.save();
    if (req.body.deleteImages) {
        for (let delImgId of req.body.deleteImages) {
            const delImg = campground.images.id(delImgId);
            if (delImg) {
                await cloudinary.uploader.destroy(delImg.filename);
            } 
        }
        await campground.updateOne({$pull: { images: { _id: { $in: req.body.deleteImages }}}});
    }
    req.flash('success','Successfully updated a campground!');
    res.redirect(`/campgrounds/${campground._id}`)
};
// #endregion edit one campground

// #region delete one campground
module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Successfully deleted campground!');
    res.redirect('/campgrounds');
};
// #region delete one campground

const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const jsonFile = require('jsonfile');

// #region all campgrounds
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
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
    res.render('campgrounds/show', { campground });
};
// #endregion show one campground

// #region new campground
module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new', { flashWidth:'small' });
};

module.exports.createCampground = async (req, res, next) => {
//    if (!req.body.campground) throw new ExpressError('Invalid Campground Data',400);
    const campground = new Campground(req.body.campground);
    campground.images = req.files.map( f => ({ url: f.path, filename: f.filename }))
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
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
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map( f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs) // ... spread Operator, holt alle Elemente einzeln aus dem Array heraus
        // sonst hätte man ein Array in das Array eingefügt - und die Validation wäre fehlgeschlagen
    await campground.save();
    if (req.body.deleteImages) {
        for (let delImgId of req.body.deleteImages) {
            const delImg = campground.images.id(delImgId);
            if (delImg) {
                await cloudinary.uploader.destroy(delImg.filename);
            } else {
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

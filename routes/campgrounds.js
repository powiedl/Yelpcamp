const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync.js');
const { isLoggedIn,isAuthor,validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campground.js');

const multer  = require('multer') // um multipart Formulardaten verarbeiten zu können (z. b. wenn ein Form eine Datei uploaded)
const {storage} = require('../cloudinary');

//const upload = multer({ dest: 'uploads/' }) // wo sollen die Uploads gespeichert werden - am Ende in einem Cloudservice
const upload = multer({ storage }); // jetzt werden die Dateien in cloudinary gespeichert


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn,
        upload.array('image'),
        validateCampground, // eigentlich will man das VOR dem Upload machen 
            //- aber erst durch den Upload entstehen die Daten über die Bilder
        catchAsync(campgrounds.createCampground));
    // die untenstehende post route war zum Kennenlernen von multipart Forms
    // .post(upload.array('image'),(req,res) => {
    //     res.send({body:req.body, files:req.files});
    // })

router.route('/new')
    .get(isLoggedIn,campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.renderShowForm))
    .put(isLoggedIn, isAuthor,validateCampground,catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn,isAuthor,catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn,isAuthor,catchAsync(campgrounds.renderEditForm)); // man kann auch beide Versionen des routers mischen,
// und für nur ein Verb zahlt sich das router.route eigentlich nicht aus ...

/* so hat es ursprünglich ausgesehen 
router

router.get('/new', isLoggedIn,campgrounds.renderNewForm);
router.post('/', isLoggedIn,validateCampground,catchAsync(campgrounds.createCampground))

router.get('/:id', catchAsync(campgrounds.renderShowForm));
router.get('/:id/edit', isLoggedIn,isAuthor,catchAsync(campgrounds.renderEditForm));
router.put('/:id', isLoggedIn, isAuthor,validateCampground,catchAsync(campgrounds.updateCampground));

router.delete('/:id', isLoggedIn,isAuthor,catchAsync(campgrounds.deleteCampground));
*/

module.exports = router;
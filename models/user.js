const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    // kurioser Weise wird weder username noch password im Schema aufgenommen - zumindest hier in dieser Definition
    email: {
        type: String,
        required: true,
        unique: true // eMail-Adressen sind eindeutig
    },
    displayname: String
});

UserSchema.plugin(passportLocalMongoose); // dadurch wird ein Attribut username und password hinzugefügt - 
    // und es passieren auch sonst noch ein paar Dinge im Hintergrund (z.b. kümmert es sich darum, dass username eindeutig ist)
UserSchema.virtual('showname').get(function() {
    if (this.displayname) {
        return this.displayname;
    }
    return this.username;
})
module.exports = mongoose.model('User', UserSchema);
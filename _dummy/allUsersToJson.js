const User = require('../models/user');
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const jsonFile = require('jsonfile');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

async function main() {
    const users = await User.find({});
    jsonFile.writeFile('/tmp/users.json',users);
}

main().then(() => {
    mongoose.connection.close();
})

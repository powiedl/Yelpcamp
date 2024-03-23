const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
    timeStamp : { type : Date, default: Date.now },
    originalUrl: String,
    hostname: String,
    clientIp: String,
    otherIps: [String],
    method: String,
    protocol: String,
    username: String,
    appVersion: String
});

module.exports = mongoose.model('log',logSchema);

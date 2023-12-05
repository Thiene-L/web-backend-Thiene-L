const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authsSchema = new Schema({
    userId: {type: String},
    username: {type: String},
    displayName: {type: String},
    email: {type: String},
    phone: {type: String},
    dob: {type: Date},
    zipcode: {type: String},
    password: {type: String},
    auth: {type: Map, of: String}
});

const auths = mongoose.model('auths', authsSchema);

module.exports = auths;
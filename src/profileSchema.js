const mongoose = require('mongoose');
const Schema = mongoose.Schema;

profilesSchema = new Schema({
    username: {type: String},
    headline: {type: String},
    email: {type: String},
    zipcode: {type: String},
    phone: {type: String},
    dob: {type: Date},
    avatar: {
        type: String,
        default: 'https://www.w3schools.com/howto/img_avatar.png'
    },
    following: [{type: String}]
});

const profiles = mongoose.model('profile', profilesSchema);

module.exports = profiles;
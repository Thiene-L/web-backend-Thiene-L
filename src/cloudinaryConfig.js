const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dx3ht0vwa',
    api_key: '538747224164823',
    api_secret: 'WBd5YM8ZuORzz4CXw2qdiA2kFHc'
});

module.exports = cloudinary;
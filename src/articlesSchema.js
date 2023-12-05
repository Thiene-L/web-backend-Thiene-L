const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articlesSchema = new Schema({
    pid: {type: String,},
    author: {type: String,},
    text: {type: String},
    avatar: {type: String},
    date: {type: Date, default: Date.now()},
    comments: [{
        commentId: {type: Number},
        author: {type: String},
        text: {type: String}
    }]
});

const articles = mongoose.model('articles', articlesSchema)

module.exports = articles;
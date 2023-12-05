const profileRouter = require('./src/profile');
const followingRouter = require('./src/following');
const articleRouter = require('./src/articles');
const authRouter = require('./src/auth');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cors = require('cors');
const passport = require('passport');
const connectionString = 'mongodb+srv://bl73:L123x456@bl-homework.wkzszu9.mongodb.net/hw7?retryWrites=true&w=majority';

mongoose.connect(connectionString).then(() => console.log('Connected to database'));

mongoose.connection.on('open', function (err) {
    if (err) {
        console.log('Connected err', err)
    } else {
        console.log('Connected to database')

        const allowedOrigins = ['http://localhost:4200', 'https://bl-hw7.surge.sh', 'http://localhost:3000', 'https://accounts.google.com'];
        app.use(cors({
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        }));
        app.use(express.json());
        app.use(express.urlencoded({extended: true}))
        app.use(bodyParser.json());
        app.use(passport.initialize());
        app.use(cookieParser());
        app.use(authRouter());
        app.use(articleRouter());
        app.use(profileRouter());
        app.use(followingRouter());

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, (err) => {
            if (!err) {
                console.log('Server listening at http://localhost:3000')
            } else {
                console.log(err)
            }
        });
    }
});

module.exports = app;
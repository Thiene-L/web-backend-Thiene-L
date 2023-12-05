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
        app.use(session({
            name: 'sid',   //返回给客户端cookie的key。
            secret: 'monkeyKing', //参与加密的字符串（又称签名）
            saveUninitialized: false, //是否在存储内容之前创建session会话
            resave: true,//是否在每次请求时，强制重新保存session，即使他们没有变化（比较保险）
            // store: MongoStore.create({
            //     mongoUrl: connectionString,
            //     touchAfter: 24 * 3600, //修改频率（例：//在24小时之内只更新一次）
            //     ttl: 24 * 60 * 60 // session 的生存时间，这里设置为1天
            // }),
            cookie: {
                httpOnly: true, // 开启后前端无法通过 JS 操作cookie
                maxAge: 24 * 3600 * 1000, // 设置cookie的过期时间,cookie的key，cookie的value，均不在此处配置。
                // sameSite: 'None',
                // secure: true
            },
        }));

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
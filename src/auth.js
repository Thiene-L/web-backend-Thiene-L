const {Router} = require('express');
let router = new Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const {v4: uuid} = require('uuid');
const session = require("express-session");
const auths = require('./authSchema');
const articles = require('./articlesSchema');
const profiles = require('./profileSchema');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
        clientID: '94142100628-sbr3je2nnrumc35jr3935l2i50jlqpsd.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: "https://bl73-0e2710080106.herokuapp.com/auth/google/callback",
        passReqToCallback: true
    },
    async function (request, accessToken, refreshToken, profile, done) {
        try {
            // 获取用户信息
            const userId = profile.id;
            const displayName = profile.displayName;
            const email = profile.emails[0].value;
            const emailDomain = email.split('@')[1];
            const nameExtension = emailDomain.split('.')[0];
            const avatar = profile.photos[0].value;
            const provider = profile.provider;

            const username = profile.name.givenName + profile.name.familyName + '@' + provider;
            // 检查是否是从/link路由发起的请求
            if (request.session.isLinkingAccount) {
                const existingUser = await auths.findOne({userId: userId});

                // 如果第三方账号被登录过，则把所有文章移动到现在的账号里，然后删除所有内容，包括auths和profile
                if (existingUser) {
                    // 把所有文章移动到现在的账号里
                    await articles.updateMany({author: existingUser.username}, {$set: {author: request.session.username}});

                    // 把所有文章的comments.author是existingUser.username的改成request.session.username
                    await articles.updateMany({}, {$set: {"comments.$[elem].author": request.session.username}}, {arrayFilters: [{"elem.author": existingUser.username}]});

                    // 读取 existingUser 的关注列表
                    const existingUserFollowings = await profiles.findOne({username: existingUser.username}).select('following');
                    if (existingUserFollowings && existingUserFollowings.following.length > 0) {
                        // 更新 request.session.username 的关注列表，添加 existingUser 的关注者
                        await profiles.updateOne(
                            {username: request.session.username},
                            {$addToSet: {following: {$each: existingUserFollowings.following}}}
                        );
                    }

                    // 把所有关注 existingUser 的用户的关注列表里的 existingUser 改成 request.session.username
                    await profiles.updateMany({}, {$set: {"following.$[elem]": request.session.username}}, {arrayFilters: [{"elem": existingUser.username}]});

                    // 删除existingUser所有内容，包括auths和profile
                    await profiles.deleteOne({username: existingUser.username});
                    await auths.deleteOne({username: existingUser.username});
                }

                // 如果账号已经被别的用户链接
                const linkedUser = await auths.findOne({'auth.google': username});
                if (linkedUser && request.session.username !== linkedUser.username) {
                    console.log('This third-party account has already been linked.');
                    // 重定向到错误页面或显示错误消息
                    throw new Error('This third-party account has already been linked.');
                }

                // 获取当前登录用户并更新其auth信息
                const currentUser = await auths.findOne({username: request.session.username});
                if (currentUser) {
                    currentUser.auth.set(provider, username);
                    await currentUser.save();
                }
                return done(null, currentUser);
            } else {
                // 如果账号已经被链接，则正常登录链接账号
                const linkedUser = await auths.findOne({'auth.google': username});
                console.log('linkedUser:' + linkedUser);
                // 若果存在linkedUser，直接登录
                if (linkedUser !== null) {
                    console.log('User already linked');
                    // 导航到主页
                    done(null, linkedUser);
                    return;
                }
                // 处理正常的OAuth登录
                // 检查是否已经存在用户
                const existingUser = await auths.findOne({userId: userId});
                if (existingUser) {
                    console.log('User already exists');
                    done(null, existingUser);
                } else {
                    // 创建新用户
                    const newUser = await auths.create({
                        userId: userId,
                        username: username,
                        displayName: displayName,
                        email: email
                    });
                    // 创建profile
                    const newProfile = await profiles.create({
                        username: username,
                        headline: 'Happy!',
                        email: email,
                        avatar: avatar,
                    });
                    done(null, newUser);
                }
            }
        } catch (err) {
            console.error('Error authenticating with Google', err);
            return done(null, false, {authError: err}); // 出现错误时调用 done，并将错误信息放在 authError 字段中
        }
    }
));

passport.serializeUser((user, done) => {
    console.log(user);
    // 检查 user 对象中是否存在 id 属性
    if (user.id) {
        done(null, user.id);
        // 如果 user 对象中没有 id 或 userId，传递一个错误
    } else {
        done(new Error('No user ID found'));
    }

});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await auths.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

router.get('/auth/google',
    passport.authenticate('google', {scope: ['profile', 'email']}));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'https://bl73-0e2710080106.herokuapp.com' }),
    function (req, res, next) {
        // 如果没有错误，则继续处理成功的认证
        if (!req.authError) {
            const username = req.user.username;
            console.log('username: ' + username);

            // 成功认证，重定向回主页或其他页面
            req.session.username = username.toString();
            console.log('User logged in', username);
            res.redirect(`https://bl-hw7.surge.sh/main?username=${encodeURIComponent(username)}`);
        } else {
            // 如果有错误，将其传递给错误处理中间件
            next(req.authError);
        }
    },
    // 错误处理中间件
    function (err, req, res, next) {
        // 处理链接错误
        if (err && err.message === 'This third-party account has already been linked.') {
            // 重定向到错误页面或显示错误消息
            res.redirect('/error?message=account_already_linked');
        } else {
            // 调用默认的 Express 错误处理器
            next(err);
        }
    }
);

router.get('/', (req, res) => {
    console.log("Hello World!");
    return res.send('Hello World!');
});

router.post('/register', async (req, res) => {
    const {username, password, displayName, email, phone, dob, zipcode} = req.body;
    try {
        const existingUser = await auths.findOne({username});

        if (existingUser) {
            console.log('Username already exists');
            return res.status(409).send('Username already exists'); // 409 Conflict
        }

        // 生成盐和哈希密码
        const hash = await bcrypt.hash(password, saltRounds);

        const userId = uuid(); // 生成新用户的userId

        // 创建新用户记录并保存哈希密码
        const newUser = await auths.create({
            userId: userId,
            username: username,
            displayName: displayName,
            email: email,
            phone: phone,
            dob: dob,
            zipcode: zipcode,
            password: hash,
            auth: new Map()
        });

        const newProfile = await profiles.create({
            username: username,
            headline: 'Happy!',
            email: email,
            zipcode: zipcode,
            phone: phone,
            dob: dob
        });

        console.log('New user created', newUser);
        console.log('New profile created', newProfile)
        // res.redirect('https://bl73-0e2710080106.herokuapp.com/login');
        return res.send({result: 'success', username: username});
    } catch (err) {
        console.log('Error: ', err);
        res.status(500).send('Error processing your request');
    }
});

router.post('/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const user = await auths.findOne({username});

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found'); // 404 Not Found
        }

        // 比较密码
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.username = user.username.toString();
            console.log('User logged in');
            return res.send({username: username, result: 'success'});
        } else {
            console.log('Invalid password');
            return res.status(401).send('Invalid password'); // 401 Unauthorized
        }

    } catch (err) {
        console.log('Error logging in', err);
        return res.status(500).send('Error logging in');
    }
});

router.put('/logout', (req, res) => {
    // 销毁session
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                // 如果无法销毁session，返回错误信息
                console.error('Session destruction error:', err);
                return res.status(500).send('Error in destroying session');
            }

            // 清除所有cookies
            res.clearCookie('sid');
            res.clearCookie('username');
            res.clearCookie('userId');
            res.clearCookie('')

            // 如果session销毁成功且所有cookies清除，返回确认信息
            console.log('Logged out successfully');
            res.send('Logged out successfully');
        });
    } else {
        // 如果没有session，仅清除cookies
        res.clearCookie('sid');
        res.clearCookie('username');
        res.clearCookie('userId');

        // 返回确认信息
        console.log('Logged out successfully');
        res.send('Logged out successfully');
    }
});

router.put('/password', async (req, res) => {
    const {newPassword} = req.body;
    if (!newPassword) {
        return res.status(400).send('No new password provided');
    }
    const {username} = req.session;

    if (username) {
        try {
            // Generate new password hash
            const hash = await bcrypt.hash(newPassword, saltRounds);

            // Update password hash in the database
            await auths.updateOne({username: username}, {$set: {password: hash}});

            console.log('Password updated');
            return res.send('Password updated successfully');
        } catch (err) {
            console.log('Error updating password', err);
            return res.status(500).send('Error updating password');
        }
    } else {
        console.log('Not authenticated');
        return res.status(401).send('Not authenticated');
    }
});

router.post('/link/:id?', async (req, res) => {
    const username = req.params.id || req.session.username;
    const user = await auths.findOne({username: username});

    if (user && user.auth && user.auth.size > 0) {
        console.log('Provider already linked');
        return res.status(409).send('Provider already linked');
    }

    // 设置标记以指示用户正在尝试链接账户
    req.session.isLinkingAccount = true;
    req.session.username = username; // 确保我们知道要链接的账户

    console.log('Redirecting to Google OAuth');
    return res.status(200).json({redirect: 'https://bl73-0e2710080106.herokuapp.com/auth/google'});
});

// router.post('/link/:id?', async (req, res) => {
//     const username = req.params.id || req.session.username;
//
//     // 如果用户已经链接过账户
//     const user = await auths.findOne({username: username});
//     console.log(user.auth);
//     console.log(user.auth !== null);
//     // 检查 user.auth 是否包含键值对
//     if (user && user.auth && user.auth.size > 0) {
//         console.log('Provider already linked');
//         return res.status(409).send('Provider already linked');
//     }
//
//     // 如果用户没有链接过账户
//     // 重定向到第三方登录页面
//     console.log('Redirecting to Google OAuth');
//     return res.status(200).json({redirect: 'https://bl73-0e2710080106.herokuapp.com/auth/google'});
// });

router.post('/unlink/:id?', async (req, res) => {
    const username = req.params.id || req.session.username;
    const {provider} = req.body;
    const user = await auths.findOne({username: username});

    // 如果用户没有通过第三方链接，无法解绑
    if (!user || !user.auth || !user.auth.has(provider)) {
        console.log('Provider not found');
        return res.status(404).send('Provider not found');
    }

    // 如果用户已经通过第三方链接，解绑账户
    try {
        user.auth.delete('google');
        await user.save();
        console.log('Provider unlinked');
        return res.send('Provider unlinked');
    } catch (err) {
        console.error('Error unlinking provider', err);
        return res.status(500).send('Error unlinking provider');
    }
});


module.exports = function () {
    return router;
}
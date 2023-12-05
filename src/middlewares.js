function isLoggedIn(req, res, next) {
    if (!req.session) {
        console.log('No session found');
        return res.sendStatus(401); // Unauthorized
    }

    if (!req.session.username) {
        console.log('User is not logged in!');
        return res.sendStatus(401); // Unauthorized
    }

    // 用户已登录
    req.username = req.session.username;
    next();
}

module.exports = { isLoggedIn };
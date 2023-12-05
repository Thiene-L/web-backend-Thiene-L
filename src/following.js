const {Router} = require('express');
let router = new Router();
const auths = require('./authSchema');
const profiles = require('./profileSchema');
const {isLoggedIn} = require('./middlewares');

// router.use(isLoggedIn);

router.get('/following/:user?', async (req, res) => {
    const username = req.params.user || localStorage.getItem('username');

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const user = await profiles.findOne({username: username});

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        if (!user.following && user.following.length === 0) {
            console.log('No following found');
            return res.status(404).send('No following found');
        }

        console.log('Following found');
        return res.send({username: username, following: user.following});
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.put('/following/:user', async (req, res) => {
    const userToFollow = req.params.user; // 需要关注的用户
    const username = localStorage.getItem('username'); // 当前登录的用户

    if (!userToFollow) {
        console.log('No user specified to follow');
        return res.sendStatus(400);
    }

    if (!username) {
        console.log('No username found in cookies');
        return res.sendStatus(401);
    }

    try {
        // 检查 userToFollow 是否存在于数据库中
        const userExists = await profiles.findOne({username: userToFollow});
        if (!userExists) {
            return res.status(404).send('User to follow not found');
        }

        // 先找到当前用户的文档
        const currentUserProfile = await profiles.findOne({username: username});

        if (!currentUserProfile) {
            console.log('Current user profile not found');
            return res.status(404).send('Current user not found');
        }

        // 检查是否已经关注了用户
        if (currentUserProfile.following.includes(userToFollow)) {
            console.log('Already following the user');
            return res.status(400).send('Already following the user');
        }

        // 执行更新操作
        const updatedProfile = await profiles.findOneAndUpdate(
            {username: username},
            {$push: {following: userToFollow}},
            {new: true} // 返回更新后的文档
        );

        console.log('Following added');
        return res.send({username: username, following: updatedProfile.following});
    } catch (err) {
        console.error('Error updating following list', err);
        return res.status(500).send('Error updating following list');
    }
});

router.delete('/following/:user', async (req, res) => {
    const userToUnfollow = req.params.user;

    if (!userToUnfollow) {
        console.log('No user specified to unfollow');
        return res.sendStatus(400);
    }

    const username = localStorage.getItem('username');

    if (!username) {
        console.log('No username found in cookies');
        return res.sendStatus(401);
    }

    try {
        // 执行更新操作
        const updateResult = await profiles.updateOne(
            {username: username},
            {$pull: {following: userToUnfollow}}
        );

        // 检查是否有文档被更新
        if (updateResult.modifiedCount === 0) {
            console.log('User not found or not following');
            return res.status(404).send('User not found or not following');
        }

        console.log('Following removed');
        // 这里我们需要再次查询用户来获取最新的following列表
        const updatedUser = await profiles.findOne({username: username});
        return res.send({username: username, following: updatedUser.following});
    } catch (error) {
        console.error('Error finding user', error);
        return res.status(500).send('Error finding user');
    }
});

module.exports = function () {
    return router;
}
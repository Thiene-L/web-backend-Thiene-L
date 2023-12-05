const {Router} = require('express');
let router = new Router();
const auths = require('./authSchema');
const profiles = require('./profileSchema');
const {isLoggedIn} = require('./middlewares');
const cloudinary = require('./cloudinaryConfig');
const multer = require('multer');
const upload = multer({dest: 'uploads/'}); // 暂时保存上传的文件

router.use(isLoggedIn);

router.get('/headline/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    console.log('username: ' + username);

    try {
        const profile = await profiles.findOne({username: username});
        console.log('headlines found');
        console.log(profile);
        return res.send({username: username, headline: profile.headline});
    } catch (err) {
        console.error('Error finding headlines', err);
        return res.status(500).send('Error finding headlines');
    }
});

router.put('/headline', async (req, res) => {
    const {headline} = req.body;

    if (!headline) {
        console.log('No headline found');
        return res.sendStatus(400);
    }

    const {username} = req.session;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        await profiles.updateOne({username: username}, {$set: {headline: headline}});
        return res.send({username: username, headline: headline});
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.get('/email/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const user = await auths.findOne({username: username});

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        console.log('Email found');
        res.send({username: username, email: user.email});
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.put('/email', async (req, res) => {
    const {email} = req.body;
    const {username} = req.session;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        await auths.updateOne({username: username}, {$set: {email: email}});
        await profiles.updateOne({username: username}, {$set: {email: email}});
        console.log('Email updated');
        return res.send({username: username, email: email});
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.get('/zipcode/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const userToFind = await profiles.findOne({username: username});

        if (!userToFind) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        console.log('Zipcode found');
        return res.send({username: username, zipcode: userToFind.zipcode});
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.put('/zipcode', async (req, res) => {
    const {zipcode} = req.body;
    const {username} = req.session;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        await auths.updateOne({username: username}, {$set: {zipcode: zipcode}});
        await profiles.updateOne({username: username}, {$set: {zipcode: zipcode}});
        console.log('Zipcode updated');
        return res.send({username: username, zipcode: zipcode});
    } catch {
        console.error('Error updating zipcode');
        return res.status(500).send('Error updating zipcode');
    }
});

router.get('/dob/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const user = await auths.findOne({username: username});

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        if (user.dob) {
            const dobInMilliseconds = new Date(user.dob).getTime();
            return res.send({username: username, dob: dobInMilliseconds});
        } else {
            console.log('Date of birth not found');
            return res.status(404).send('Date of birth not found');
        }
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.get('/phone/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const user = await auths.findOne({username: username});

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        if (user.phone) {
            console.log('Phone number found');
            return res.send({username: username, phone: user.phone});
        } else {
            console.log('Phone number not found');
            return res.status(404).send('Phone number not found');
        }
    } catch {
        console.error('Error finding user');
        return res.status(500).send('Error finding user');
    }
});

router.put('/phone', async (req, res) => {
    const {phone} = req.body;

    if (!phone) {
        return res.status(400).send('No phone number provided');
    }

    const {username} = req.session;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        await auths.updateOne({username: username}, {$set: {phone: phone}});
        await profiles.updateOne({username: username}, {$set: {phone: phone}});
        console.log('Phone number updated');
        return res.send({username: username, phone: phone});
    } catch {
        console.error('Error updating phone number');
        return res.status(500).send('Error updating phone number');
    }
})

router.get('/avatar/:user?', async (req, res) => {
    const username = req.params.user || req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    try {
        const profile = await profiles.findOne({username: username});

        if (!profile || !profile.avatar) {
            console.log('Profile or avatar not found');
            return res.status(404).send('Profile or avatar not found');
        }

        const avatarUrl = cloudinary.url(profile.avatar, {
            secure: true
        });

        console.log('Avatar URL from Cloudinary:', avatarUrl);
        return res.send({username: username, avatar: avatarUrl});
    } catch {
        console.error('Error finding profile');
        return res.status(500).send('Error finding profile');
    }
});

router.put('/avatar', upload.single('userImage'), async (req, res) => {
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    const username = req.session.username;

    if (!username) {
        console.log('No username found');
        return res.sendStatus(401);
    }

    let imageUrl = null;

    // 上传图片到Cloudinary
    try {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.url;

        console.log('Avatar updated with Cloudinary');
    } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        return res.status(500).send('Error uploading image');
    }

    // 更新数据库
    try {
        await profiles.updateOne({username: username}, {$set: {avatar: imageUrl}});
        console.log('Avatar updated in database');
        return res.send({username: username, avatar: imageUrl});
    } catch {
        console.error('Error updating avatar in database');
        return res.status(500).send('Error updating avatar');
    }
});

module.exports = function () {
    return router;
}
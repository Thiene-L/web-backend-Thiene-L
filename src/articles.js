const {Router} = require('express');
let router = new Router();
const mongoose = require('mongoose');
const articles = require('./articlesSchema');
const profiles = require('./profileSchema');
const {status, send} = require("express/lib/response");
const {isLoggedIn} = require('./middlewares');
const cloudinary = require('./cloudinaryConfig');
const multer = require('multer');
const upload = multer({dest: 'uploads/'}); // 暂时保存上传的文件

// router.use(isLoggedIn);

function getArticlesByAuthors({authors, page, limit}) {
    const skip = (page - 1) * limit; // 计算跳过的文档数

    return articles.find({author: {$in: authors}})
        .sort({date: -1})
        .skip(skip) // 跳过之前的文档
        .limit(limit); // 限制返回的文档数
}

router.get('/articles/:id?', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // 获取当前页码，默认为1
        const limit = parseInt(req.query.limit) || 10; // 获取每页文章数，默认为10

        const username = req.session.username;
        console.log('username: ' + username);
        const userObj = await profiles.findOne({username: username});
        const usersToQuery = [username, ...userObj.following];

        const articles = await getArticlesByAuthors({authors: usersToQuery, page, limit});
        return res.json(articles);
    } catch (err) {
        console.error('Error finding articles', err);
        return res.status(500).send(err.message);
    }
});

// router.get('/articles/:id?', async (req, res) => {
//     const pid = req.params.id || req.session.username;
//
//     if (!pid) {
//         console.log('No username found');
//         return res.sendStatus(401).send('Unauthorized');
//     }
//
//     try {
//         const articlesFound = await articles.find({pid: pid});
//
//         if (!articlesFound.length) {
//             console.log('No articles found');
//             return res.status(404).send('No articles found');
//         }
//
//         console.log('Articles found');
//         return res.send(articlesFound);
//     } catch (err) {
//         console.error('Error finding articles', err);
//         return res.status(500).send('Error finding articles');
//     }
// });

router.put('/articles/:id', async (req, res) => {
    const articleId = req.params.id;
    const {text, commentId} = req.body; // 假设请求的正文中包含这些字段
    const {username} = req.session;

    // 查找文章
    try {
        const article = await articles.findOne({_id: articleId});

        if (!article) {
            console.log('Article not found');
            return res.status(404).send('Article not found');
        }

        // 如果未提供commentId，更新文章本身的text字段
        if (commentId === undefined) {

            // 如果用户不是文章的所有者，返回403错误
            if (article.author !== username) {
                console.log('Forbidden: User does not own the article');
                return res.status(403).send('Forbidden: User does not own the article');
            }

            try {
                await articles.updateOne({_id: articleId}, {$set: {text: text}});
                console.log('Article updated');
                const article = await articles.findOne({_id: articleId});
                return res.send(article);
            } catch {
                console.error('Error updating article');
                return res.status(500).send('Error updating article');
            }
        } else {
            // 如果提供了commentId
            // 如果commentId为-1，添加新评论
            if (commentId === -1) {
                const newComment = {
                    commentId: article.comments.length,
                    author: username,
                    text: text
                };
                article.comments.push(newComment);
                await article.save();
                console.log('Comment added');
                return res.send(article);

                // 如果commentId不为-1，更新评论
            } else if (commentId !== -1) {
                const commentIndex = article.comments.findIndex(c => c.commentId === commentId);

                if (commentIndex == null) {
                    console.log('Comment not found');
                    console.log(commentIndex);
                    return res.status(404).send('Comment not found');
                }

                // 如果评论作者不属于该用户
                if (article.comments[commentIndex].author !== username) {
                    console.log('Forbidden: User does not own the comment');
                    return res.status(403).send('Forbidden: User does not own the comment');
                }

                // 如果找到了评论且用户为评论的所有者，则更新该评论
                article.comments[commentIndex].text = text;
                await article.save();
                console.log('Comment updated');
                return res.send(article);

            } else {
                // 如果未找到评论，发送404错误
                console.log('Comment not found');
                return res.status(404).send('Comment not found');
            }
        }
    } catch (err) {
        console.log('Error finding article', err);
        return res.status(500).send('Error finding article');
    }
});

router.post('/article', upload.single('articleImage'), async (req, res) => {
    const {text} = req.body;
    const {username} = req.session;
    let imageUrl = null;

    // 如果请求中包含文件，上传文件到Cloudinary
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.url;
        } catch (err) {
            console.error('Error uploading to Cloudinary:', err);
            return res.status(500).send('Error uploading image');
        }
    }

    // 更新数据库
    try {
        const article = await articles.create({
            pid: username,
            author: username,
            text: text,
            avatar: imageUrl,
            date: new Date()
        });
        console.log('Article created');
        const allArticles = await articles.find({pid: username});
        return res.send(allArticles);
    } catch (err) {
        console.log('Error creating article', err);
        return res.status(500).send('Error creating article');
    }
});

module.exports = function () {
    return router;
}
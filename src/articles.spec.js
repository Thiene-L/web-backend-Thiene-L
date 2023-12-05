const baseUrl = 'http://localhost:3000';

describe("Auth API", () => {

    it("registers a new user", async () => {
        const response = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: "testUser",
                password: "123",
                displayName: "New User",
                email: "newuser@example.com",
                phone: "1234567890",
                dob: new Date().toISOString(),
                zipcode: "12345"
            })
        });
        if (response.status === 409) {
            return;
        }
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.username).toEqual('testUser');
        expect(data.result).toEqual('success');
    });

    it("logs in a user", async () => {
        const response = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testUser',
                password: '123'
            })
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.username).toEqual('testUser');
        expect(data.result).toEqual('success');
    });

    it("logs out a user", async () => {
        const response = await fetch(`${baseUrl}/logout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toBe(200);
    });
    afterAll(async () => {
        // 登出操作
        await fetch(`${baseUrl}/logout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});

describe('Article API', () => {

    let cookie;

    beforeAll(async () => {
        // 登录操作
        const response = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testUser',
                password: '123'
            })
        });

        cookie = response.headers.get('set-cookie');
    });

    it("POST/article", async () => {
        const newArticle = {
            text: 'This is a test article'
        };
        const response = await fetch(`${baseUrl}/article`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            },
            body: JSON.stringify(newArticle)
        });
        expect(response.status).toBe(200);
        const createdArticle = await response.json();
        createdArticle.forEach(article => {
            expect(article.author).toEqual('testUser');
        });
    });

    it ('GET/articles', async () => {
        const response = await fetch(`${baseUrl}/articles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            }
        });
        const articles = await response.json();
        // 确保每篇文章的作者都是 'testUser'
        articles.forEach(article => {
            expect(article.author).toEqual('testUser');
        });
        // 可以进一步检查状态码和返回的数组长度
        expect(response.status).toBe(200);
    });

    it("GET/articles/:id", async () => {
        const testArticleId = 'testUser';
        const response = await fetch(`${baseUrl}/articles/${testArticleId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            }
        });
        expect(response.status).toBe(200);
        const articles = await response.json();
        articles.forEach(article => {
            expect(article.author).toEqual('testUser');
        });
    });
});
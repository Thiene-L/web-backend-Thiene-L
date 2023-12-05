const baseUrl = 'http://localhost:3000';

describe("Profile API", () => {

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

    it ('GET/headline', async () => {
        const response = await fetch(`${baseUrl}/headline`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            }
        });
        const getHeadline = await response.json();
        expect(getHeadline.username).toEqual('testUser');
        // 可以进一步检查状态码和返回的数组长度
        expect(response.status).toBe(200);
    });

    it ('GET/headline/:id?', async () => {
        const testUsername = 'testUser';
        const response = await fetch(`${baseUrl}/headline/${testUsername}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            }
        });
        const getHeadline = await response.json();
        expect(getHeadline.username).toEqual('testUser');
        // 可以进一步检查状态码和返回的数组长度
        expect(response.status).toBe(200);
    });

    it ('PUT/headline', async () => {
        const response = await fetch(`${baseUrl}/headline`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie
            },
            body: JSON.stringify({
                headline: 'New headline'
            })
        });
        const newHeadline = await response.json();
        expect(newHeadline.username).toEqual('testUser');
        expect(response.status).toBe(200);
    });
});
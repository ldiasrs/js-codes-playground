import Supertest from 'supertest';
import app from './server.js';

test('Create user', async () => {
const res = await Supertest.request(app)
    .post('/user')
    .send({name: "John Doe", age: 25})
    .expect(200);
expect(res.body).toEqual({ success: true, message: 'user created' });
});
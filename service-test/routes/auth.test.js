const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

// beforeAll()는 test()가 실행 되기 전에 실행
beforeAll(async () => {
    // 테이블들을 생성된 채로 시작
    await sequelize.sync();
});

describe("POST /join", () => {
  test("로그인 안 했으면 가입", (done) => {
    request(app)
      .post("/auth/join")
      .send({
        email: "admin@admin.com",
        nick: "admin",
        password: "admin",
      })
      .expect("Location", "/")
      .expect(302, done);
  });
});

describe("POST /login", () => {
  test("로그인 수행", async (done) => {
    request(app)
      .post("/auth/login")
      .send({
        email: "admin@admin.com",
        password: "admin",
      })
      .expect("Location", "/")
      .expect(302, done);
  });
});

// describe("GET /logout", () => {

// });


// 모든 test()가 끝난 후
afterAll(async () => {
    await sequelize.sync({ force: true });
})
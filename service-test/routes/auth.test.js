const request = require("supertest");
const { sequelize } = require("../models");
const app = require("../app");

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
    // request.agent() 로그인을 유지한 상태에서 여러가지 테스트를 진행할 수 있음
  const agent = request.agent(app);
  beforeEach((done) => {
    agent
      .post("/auth/login")
      .send({
        email: "admin@admin.com",
        password: "admin",
      })
      .end(done);
  });

  test("이미 로그인했으면 redirect /", (done) => {
    const message = encodeURIComponent("로그인한 상태입니다.");
    agent
      .post("/auth/join")
      .send({
        email: "admin@admin.com",
        nick: "admin",
        password: "admin",
      })
      .expect("Location", `/?error=${message}`)
      .expect(302, done);
  });
});

describe("POST /login", () => {
  test("가입되지 않은 회원", async (done) => {
    const message = encodeURIComponent("가입되지 않은 회원입니다.");
    request(app)
      .post("/auth/login")
      .send({
        email: "zerohch1@gmail.com",
        password: "admin",
      })
      .expect("Location", `/?loginError=${message}`)
      .expect(302, done);
  });

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

  test("비밀번호 틀림", async (done) => {
    const message = encodeURIComponent("비밀번호가 일치하지 않습니다.");
    request(app)
      .post("/auth/login")
      .send({
        email: "admin@admin.com",
        password: "wrong",
      })
      .expect("Location", `/?loginError=${message}`)
      .expect(302, done);
  });
});

describe("GET /logout", () => {
  test("로그인 되어있지 않으면 403", async (done) => {
    request(app).get("/auth/logout").expect(403, done);
  });

  const agent = request.agent(app);
  beforeEach((done) => {
    agent
      .post("/auth/login")
      .send({
        email: "admin@admin.com",
        password: "admin",
      })
      .end(done);
  });

  test("로그아웃 수행", async (done) => {
    const message = encodeURIComponent("비밀번호가 일치하지 않습니다.");
    agent.get("/auth/logout").expect("Location", `/`).expect(302, done);
  });
});

// 모든 test()가 끝난 후
afterAll(async () => {
  await sequelize.sync({ force: true });
});
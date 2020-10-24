## JWT 토큰 발급 라우터

토큰 검사: jwt.verify()
토근 발급: jwt.sign()

routes/v1
- 버전 1인 뜻으로 v1.js
- 한 번 버전이 정해진 후에는 라우터를 함부로 수정하면 안 됨
- 다른 사람이 기존 API를 쓰고 있기 때문(그 사람에게 영향이 감)
- 수정 사항이 생기면 버전을 올려야 함

```
- POST /token에서 JWT 토큰 발급
- 먼저 도메인 검사 후 등록된 도메인이면 jwt.sign 메서드로 JWT 토큰 발급
- 첫 번째 인수로 페이로드를 넣고, 두 번째 인수는 JWT 비밀키, 세 번째 인수로 토큰 옵션(expiresln은 만료 시간, issure은 발급자)
- expiresln은 1m, 60*1000같은 밀리초 단위도 가능
- GET /test 라우터에서 토큰 인증 테스트 가능
- 라우터의 응답은 일정한 형식으로 해야 사용자들이 헷갈리지 않음
```


```javascript
// api-server/routes/v1

const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('./middlewares');
const { Domain, User } = require('../models');

const router = express.Router();

// 토큰 발급 라우터
router.post('/token', async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }
    const token = jwt.sign({
      id: domain.User.id,
      nick: domain.User.nick,
      // 토큰은 JWT_SECRET이 다르거나 expiresIn 유효 기간이 지나면 에러 발생
    }, process.env.JWT_SECRET, {
      expiresIn: '1m', // 1분
      issuer: 'nodebird', // 누가 발급해줬는지
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

// 토큰 제대로 발급 됐는지 테스트 라우터
router.get('/test', verifyToken, (req, res) => {
  res.json(req.decoded);
});

module.exports = router;
```

```javascript
// nodecat/routes/index

router.get('/test', async (req, res, next) => { // 토큰 테스트 라우터
  try {
    if (!req.session.jwt) { // 세션에 토큰이 없으면 토큰 발급 시도
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET,
      });
      if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공
        req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
      } else { // 토큰 발급 실패
        return res.json(tokenResult.data); // 발급 실패 사유 응답
      }
    }
    // 발급받은 토큰 테스트
    const result = await axios.get('http://localhost:8002/v1/test', {
      headers: { authorization: req.session.jwt },
    });
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) { // 토큰 만료 시
      return res.json(error.response.data);
    }
    return next(error);
  }
});
```

---

## JWT

인증을 위한 JWT
- NodeBird가 아닌 다른 클라이언트가 데이터를 가져가게 하려면 인증 과정이 필요함
- JWT(JSON Web Token)을 사용함

- 헤더, 페이로드, 시그니처로 구성
- 헤더: 토근 종류와 해시 알고리즘 정보가 들어있음
- 페이로드: 토근의 내용물이 인코딩된 부분
- 시그니처: 일련의 문자열로, 시그니처를 통해 토큰이 변조되었는지 여부 확인
시그니처는 JWT 비밀키로 만들어지고, 비밀키가 노출되면 토근 위조 가능

JWT에 민감한 내용을 넣으면 안 된다. 페이로드 내용을 볼 수 있기 때문.

- 그래도 사용하는 이유: 토근 변조 불가능하고, 내용물이 들어있기 때문.
- 내용물이 들어있으므로 데이터베이스 조회를 하지 않을 수 있음(데이터베이스 조회는 비용이 큰 작업)
- 노출되어도 좋은 정보만 넣어야 함
- 용령이 커서 요청 시 데이터(패킷) 양이 증가한다는 단점이 있음


```javascript
// routes/middlewares

exports.verifyToken = (req, res, next) => {
  try {
    // verify가 실패하는 경우는 토근이 위조된 경우 또는 토큰 유효기간 만료
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') { // 유효기간 초과
      return res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다',
      });
    }
    return res.status(401).json({
      code: 401,
      message: '유효하지 않은 토큰입니다',
    });
  }
};
```

- decoded에 페이로드를 넣어 다음 미들웨어에서 쓸 수 있게 함

---
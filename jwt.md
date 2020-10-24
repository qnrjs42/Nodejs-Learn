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
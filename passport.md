## 카카오 로그인

https://developers.kakao.com/

1. 로그인
2. 내 애플리케이션 - 애플리케이션 추가하기
3. 앱 설정 탭 - 플랫폼 - Web - 플랫폼 등록 - http://localhost:8001 등록
4. 제품 설명 탭 - 활성화 설정 - 상태 On 
5. 제품 설명 탭 - Redirect URI - Redirect URI 등록 - http://localhost:8001/auth/kakao/callback
6. 제품 설명 탭 - 동의 항목 - 개인정보 보호항목 - 프로필 정보, 카카오계정 등등 필요한 정보 동의
7. 앱 설정 탭 - 앱 키 - REST API 키 복사
8. .env - KAKAO_ID=RES API 붙여넣기 (예: KAKAO_ID=123456789ABC)

### 로그인 과정
- 1. 로그인 요청
- 2. routes/auth/kakao - router.get('/kakao', passport.authenticate('kakao')); 호출
- 3. 카카오 로그인 페이지로 이동
- 4. 카카오가 콜백 받아서 routes/auth/login - router.get('/kakao/callback', passport.authenticate('kakao', 호출
- 5. passport/kakaoStrategy 이동
- 6. 카카오에서 보내준 profile으로 DB에 카카오로 등록된 id가 있는지 조회
- 7. 성공 시 유저 정보 리턴, 실패 시 회원 가입 및 로그인 하여 유저 정보 리턴
- 9. passport/index - passport.serializeUser() 실행. 메서드 호출 시 넘겨준 user의 id만 서버 세션에 저장
- 10. 다시 routes/auth/login - req.login() 에러 있으면 출력 없으면 넘어감
- 11. 세션 쿠키 브라우저로 넘겨주면서 메인 페이지로 이동하여 로그인 성공

---

## 로그인 미들웨어

```javascript
// routes/middlewares

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send('로그인 필요');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent('로그인한 상태입니다.');
    res.redirect(`/?error=${message}`);
  }
};
```

isLoggedIn: 로그인 했으면 통과
isNotLoggedIn: 로그인 하지 않았으면 통과

---

## passport

```javascript
npm i passport passport-local bcrypt passport-kakao
```

### 로그인 과정
- 1. 로그인 요청
- 2. routes/auth/login - passport.authenticate('local') 호출
- 3. passport/localStrategy 이동
- 4. 입력한 이메일이 DB에 있는지 조회, 있으면 입력한 패스워드와 DB 패스워드를 bcrypt로 비교
- 5. 성공 시 유저 정보 리턴, 실패 시 에러 메시지 리턴
- 6. 다시 routes/auth/login - passport.authenticate() 서버 에러 있으면 출력 없으면 넘어감
- 7. 로그인 실패 시 에러 메시지와 함께 프론트로 전송. 성공 시 req.login(user, ) 호출
- 8. passport/index - passport.serializeUser() 실행. 메서드 호출 시 넘겨준 user의 id만 서버 세션에 저장
- 9. 다시 routes/auth/login - req.login() 에러 있으면 출력 없으면 넘어감
- 10. 세션 쿠키 브라우저로 넘겨주면서 메인 페이지로 이동하여 로그인 성공


```javascript
// routes/auth - login
passport.authenticate('local', (authError, user, info) => {

// passport/localStrategy
done(null, exUser);
done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
done(error);
```

1. 로그인 성공 시
- authError: done(null);
- user: done(null, exUser);

2. 로그인 실패 시
- authError: done(null);
- user: done(null, exUser);
- info: done(null, false, { message: '비밀번호가 일치하지 않습니다.' });

3. 서버 에러 시
- authError: done(error);


### 로그인 이후 과정
- 1. 모든 요청에 app.js - passport.session() 미들웨어가 passport.deserializeUser 메서드 호출<br/>
connect.sid로 id 유추하여 passport.deserializeUser((id,))를 넘겨줌
- 2. req.session에 저장된 아이디로 데이터베이스에서 사용자 조회
- 3. 조회된 사용자 정보를 req.user에 저장
- 4. 라우터에서 req.user 객체 사용 가능

---
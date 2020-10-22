const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
      // 입력한 이메일이 기존에 있는 이메일인지 검사
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
        // 있다면 이미 가입된 이메일이라고 알림
      return res.redirect('/join?error=exist');
    }
    // 입력한 패스워드를 bcrypt 해시화, 12 salt
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    // 유저 생성하고 메인페이지로 이동
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
    // passport/localStrategy로 감
    // (authError, user, info)은 done()으로 보낸 값
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      // 로그인 실패한 경우 메시지를 프론트로 돌려 줌
      return res.redirect(`/?loginError=${info.message}`);
    }
    // req.login 하는 순간 passport/index로 이동
    return req.login(user, (loginError) => {
      if (loginError) {
          // 에러가 있었으면 에러 표시
        console.error(loginError);
        return next(loginError);
      }
      // 세션 쿠키를 브라우저로 보내주면서 로그인 성공
      return res.redirect('/');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
  // 서버에 세션쿠키를 지우고 메인 페이지로 이동
  req.logout(); 
  req.session.destroy();
  res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;
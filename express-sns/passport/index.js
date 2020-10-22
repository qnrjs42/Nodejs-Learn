const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    // routes/auth/login에서 req.login(user 한게 여기로 옴
  passport.serializeUser((user, done) => {
    done(null, user.id); // 세션에 user.id만 저장
    // done()이 되면 routes/auth/login에서 (loginError) => { 으로 넘어감
  });


  // req.session에 저장된 사용자 아이디 바탕으로 DB 조회로 사용자 정보 얻어낸 후 req.user에 저장
  passport.deserializeUser((id, done) => {
    User.findOne({ where: { id } })
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  local();
  kakao();
};
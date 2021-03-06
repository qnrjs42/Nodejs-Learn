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

  // 예) { id: 3, 'connect.sid': 48646465213546 }

  // req.session에 저장된 사용자 아이디 바탕으로 DB 조회로 사용자 정보 얻어낸 후 req.user에 저장
  passport.deserializeUser((id, done) => {
    User.findOne({
      where: { id },
      include: [{
        model: User,
        attributes: ['id', 'nick'],
        as: 'Followers', // 팔로워 목록
      }, {
        model: User,
        attributes: ['id', 'nick'],
        as: 'Followings', // 팔로잉 목록
      }],
    })
      .then(user => done(null, user))
      .catch(err => done(err));
  });


  local();
  kakao();
};
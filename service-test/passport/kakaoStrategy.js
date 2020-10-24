const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID, // .env KAKAO_ID
    callbackURL: '/auth/kakao/callback', // 카카오 로그인 후 카카오가 결과를 전송해줄 URL
    // accessToken, refreshToken: 로그인 성공 후 카카오가 보내준 토큰(여기서는 사용하지 않음, 'Oauth2'로 사용)
    // profile: 카카오가 보내준 유저 정보
    // profile의 정보를 바탕으로 회원가입
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('kakao profile', profile);
    try {
        // 카카오로 회원가입한 사람 있나 조회
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' },
      });
      if (exUser) {
        done(null, exUser);
      } else {
        // 가입된 사람이 없다면 회원가입 시키고 바로 로그인
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};

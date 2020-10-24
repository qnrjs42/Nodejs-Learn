const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email', // req.body.email | 'email'과 req.body.email 일치 해야 함
    passwordField: 'password', // req.body.password | 'password'과 req.body.password 일치 해야 함

    // async (email, password 와 바로 위에 코드 'email'과 'password'가 일치해야 함
    // 즉, req.body.email = usernameField: 'email', async (email)
  }, async (email, password, done) => {
    try {
      // 입력한 이메일이 있는지 검색
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {
        // 입력한 패스워드와 DB에 있는 패스워드를 bcrypt로 비교
        const result = await bcrypt.compare(password, exUser.password);

        // done(서버 에러, 성공했을 때, 실패했을 때)

        if (result) {
          done(null, exUser);
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};
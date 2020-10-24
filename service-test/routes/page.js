const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

router.use((req, res, next) => {
  // req.user는 passport/index - passport.deserializeUser에서 생성된다.
  // /page/ 요청에 모두 req.user가 들어가있음
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});

router.get('/profile', (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird' });
});

router.get('/join', (req, res) => {
  res.render('join', { title: '회원가입 - NodeBird' });
});

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// GET /hashtag?hashtag=노드
router.get('/hashtag', async (req, res, next) => {
  const query = decodeURIComponent(req.query.hashtag);
  if (!query) {
    return res.redirect('/');
  }
  try {
    // 해시태그 존재하는지 조회
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      // 해시태그 있으면 게시글의 작성자(id, nick만)까지 가져옴
      posts = await hashtag.getPosts({ include: [{ model: User, attributes: ['id', 'nick'] }] });
    }

    return res.render('main', {
      title: `${query} 검색 결과 | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
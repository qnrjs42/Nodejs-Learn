const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();
router.use(async (req, res, next) => {
  const domain = await Domain.findOne({
    // req.get('origin) | nodecat/routes - axios.defaults.headers.origin
    where: { host: url.parse(req.get('origin')).host }
  });
  if(domain) {
    cors({
    origin: true,
    credentials: true,
  })(req, res, next);
  } else {
    next();
  }
});

// 토큰 발급 라우터
router.post('/token', apiLimiter, async (req, res) => {
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
    }, process.env.JWT_SECRET, {
      expiresIn: '1m', // 1분
      issuer: 'nodebird',
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
router.get('/test', verifyToken, apiLimiter, (req, res) => {
  res.json(req.decoded);
});

// nodebird 데이터 보내주는 라우터
router.get('/posts/my', verifyToken, apiLimiter, (req, res) => {
  Post.findAll({ where: { userId: req.decoded.id } })
    .then((posts) => {
      res.json({
        code: 200,
        payload: posts,
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
});

// 해시태그로 검색하는 라우터
router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });

    if(!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다.',
      });
    }
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch(err) {
    console.error(err);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

module.exports = router;
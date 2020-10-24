const express = require('express');
const axios = require('axios');

const router = express.Router();

const URL = 'http://localhost:8002/v2'; // 토큰 발급 URL
axios.defaults.headers.origin = 'http://localhost:4000'; // origin 헤더 추가

// 토큰 자동 재발급
const request = async (req, api) => {
  try {
    if (!req.session.jwt) { // 세션에 토큰이 없으면 토큰 발급 시도
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      // 토큰 발급 성공
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }

    // 원래 보내고 싶었던 주소로 요청을 보냄
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },
    }); // API 요청

  } catch (error) {
    if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
      delete req.session.jwt;
      // 토큰 만료 되었을 때 토큰 재발급
      return request(req, api);
    } // 419 외의 다른 에러면
    return error.response;
  }
};

router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my'); // api-server/routes/v1 - /posts/my
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(
      req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`, // api-server/routes/v1 - /posts/hashtag/노드
    );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

router.get('/', (req, res) => {
  res.render('main', { key: process.env.CLIENT_SECRET });
  
})

module.exports = router;
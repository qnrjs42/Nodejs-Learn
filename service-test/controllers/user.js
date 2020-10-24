const User = require('../models/user');

exports.addFollowing = async (req, res, next) => {
  try {
    // 내가 누구인지 조회
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      // /user/1/follow - 1이 req.params.id | 내가 1번 사용자를 팔로잉
      // setFollowings | 팔로잉 목록 수정 | 기존 데이터 모두 제거 후 새로 그림
      // removFollowings | 팔로잉 제거
      // getFollowings | 팔로잉 목록 가져오기
      // addFollowings 복수로 하여 여러 개 등록 가능 [1, 2, 3, ...]
      await user.addFollowings([parseInt(req.params.id, 10)]);
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

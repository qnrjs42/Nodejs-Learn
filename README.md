
## express 모든 라우터 요청에 공통 변수

```javascript
// routes/page

router.use((req, res, next) => {
  // /page/ 요청에 모두 req.user가 들어가있음
  res.locals.user = req.user;
  next();
});

router.get('/profile', (req, res) => {
    req.user;
});
router.get('/join', (req, res) => {
    req.user;
});
router.get('/', async (req, res, next) => {
    req.user;
});
```

---

## multer

form 태그의 enctype이 multipart/form-data
- body-parser로는 요청 본문을 해석할 수 없다.

```html
<form id="twit-form" action="/post" method="post" enctype="multipart/form-data">...</form>
```

multer
- multer로 multipart/form-data 해석할 수 있다.
- 이미지를 먼저 업로드하고, 이미지가 저장된 경로를 반환
- 게시글 form을 submit할 때는 이미지 자체 대신 경로를 전송

```javascript
// app.js

app.use('/img', express.static(path.join(__dirname, 'uploads')));
```

```javascript
// routes/post

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/'); // uploads 폴더에 저장
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext); // 파일명 + 현재 날짜 + 확장자
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// upload.single('img') | 요청 본문의 img에 담긴 이미지 하나를 읽어 설정대로 저장하는 미들웨어
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    // 저장된 파일에 대한 정보는 req.file 객체에 담김
  console.log(req.file);
  // 정보를 프론트로 넘겨줌
  res.json({ url: `/img/${req.file.filename}` });
});

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});
```


이미지와 게시글 요청을 따로 받는 이유<br/>
이미지 크기가 클 경우 서버가 압축하는데 시간이 소요되므로 그 시간동안 글 작성하면 효율적<br/>
이미지 먼저 올리고 글 작성하는 경우: 이미지 업로드(10초) + 글 작성(10초) = 게시글 바로 업로드<br/>
글 작성하고 이미지 업로드하는 경우: 글 작성(10초) + 이미지 업로드(10초) = 이미지 압축 끝날 때 까지 기다리고 업로드<br/>

---

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

```javascript
// app.js
const passportConfig = require('./passport');
sequelize.sync({ force: false })
.then(() => {
    console.log('데이터베이스 연결 성공');
})
.catch((err) => {
    console.error(err);
});
// sequelize 밑에다가 함수 실행
passportConfig();
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

## 시퀄라이즈 - 데이터베이스 연결 팁

```javascript
sequelize.sync({ force: false })
.then(() => {
    console.log('데이터베이스 연결 성공');
})
.catch((err) => {
    console.error(err);
});
```

force: true일 경우 연결할 때마다 테이블을 지웠다가 재생성하므로 데이터가 날라간다.
실무에서는 절대로 true하면 안 된다.

alter: true일 경우 데이터는 유지하고 컬럼을 바뀌긴 하지만 가끔가다 컬럼과 데이터가 맞지 않아 에러가 발생할 수 있다.


테이블이 생성되지 않는 경우 model에 오타가 있을 확률이 있다.
force: true로 하여 지우는데 foreignKey가 참조되어 제대로 지워지지 않는 경우가 있으므로
MySQL Workbench에서 지운다.

---

## 시퀄라이즈 같은 테이블 다:다 관계

```javascript
db.User.belongsToMany(db.User, {
    foreignKey: 'followingId',
    as: 'Followers',
    through: 'Follow',
});
db.User.belongsToMany(db.User, {
    foreignKey: 'followerId',
    as: 'Followings',
    through: 'Follow',
});
```

팔로잉, 팔로워

foreignKey: 외래키
as: 컬럼에 대한 별명
through: 중간 테이블명


다:다 관계 이므로 중간 테이블 through: 'Follow'

foreignKey를 안 넣어주면 기본적으로 UserId가 참조된다.

UserId면 누가 followingId이고, followerId인지 구별할 수 없다.

팔로워: 나를 팔로우 하는 사람들
팔로잉: 내가 팔로우 하는 사람들

followerId  |   followingId
    1       |       3
    4       |       3
    5       |       3
    2       |       1
    1       |       2
    4       |       1

foreignKey: 'followingId', as: 'Followers'<br/>
그 사람의 팔로워들을 가져오려할 때<br/>
-> 3번을 검색하여 팔로워들을 찾음

foreignKey: 'followerId', as: 'Followings',<br/>
팔로잉들을 가져오려할 때<br/>
-> 1번을 검색하여 팔로잉들을 찾음

---

## 시퀄라이즈 데이터베이스 생성 시 주의사항

1. npx sequelize init

```javascript
// config/config.json

"development": {
    "username": "root",
    "password": "1234",
    "database": "nodejsbook-nodebird",
    "host": "127.0.0.1",
    "dialect": "mysql"
},

```

username, password, database까지 지정해주고 저장까지 마무리 한 다음 2번을 진행한다.

2. npx sequelize db:create

MySQL Workbench를 가보면 nodejsbook-nodebird 스키마가 생성된 것을 볼 수 있다.

---

```javascript
const dotenv = require('dotenv');

dotenv.config();
```

dotenv는 최대한 최상단에 위치하는게 좋다.

```javascript
process.env.NODE_ENV !== 'production' ? err : {};
```

개발 모드일 경우 에러 상세 정보까지 출력하고,
배포 모드일 경우 에러 출력 안 함

---

## NoSQL

MySQL같은 SQL 데이터베이스와는 다른 유형의 데이터
NoSQL의 대표주자인 mongoDB(몽고디비) 사용

SQL(MySQL)
- 규칙에 맞는 데이터 입력
- 테이블 간 JOIN 지원
- 안전성, 일관성
- 용어(테이블, ROW, COLUMN)

NoSQL(mongoDB)
- 자유로운 데이터 입력
- 컬렉션 간 JOIN 미지원
- 확장성, 가용성
- 용어(컬렉션, 다큐먼트, 필드)

JOIN: 관계가 있는 테이블끼리 데이터를 합치는 기능
빅데이터, 메시징(로그), 세션 관리 등(비정형 데이터)에는 mongoDB 사용하면 좋음

---

## 시퀄라이즈 실습

```javascript
// routes/comments.js

/*
    req.body 구성
    {
        id: "2",
        comment: "123123"
    }
*/

const comment = await Comment.create({
    commenter: req.body.id,
    comment: req.body.comment,
});
```

```
Executing (default): INSERT INTO `comments` (`id`,`comment`,`created_at`,`commenter`) VALUES (DEFAULT,?,?,?);
```
(DEFAULT,?,?,?): ?는 사용자 입력 부분으로, 보안 위협을 제거함으로써 ?으로 대체된다.

---


## 시퀄라이즈로 데이터베이스 생성(콘솔)

```
npx sequelize db:create
```

위의 명령어를 입력할 경우 config/config.json 파일보고 데이터베이스를 생성한다.

---

테이블을 지울 때 참조관계가 있을 경우

belongsTo가 있는 테이블부터 지운다.

---

## 시퀄라이즈 쿼리

### 생성
```SQL
-- SQL
INSERT INTO nodejs.users (name, age, married, comment) VALUES ('zero', 24, 0, '자기소개1');
```
```javascript
// javascript
const { User } = require('../models');
User.create({
    name: 'zero',
    age: 24,
    married: false,
    comment: '자기소개1',
});
```

### 조회
```SQL
-- SQL
SELECT * FROM nodejs.users;
```
```javascript
// javascript
User.findAll({});
```

```SQL
-- SQL
SELECT name, married FROM nodejs.users; 
```
```javascript
// javascript
User.findAll({
    attributes: ['name', 'married'],
});
```

### 조회 조건
```SQL
-- SQL
SELECT name, age FROM nodejs.users WHERE married = 1 AND age > 30;
```
```javascript
// javascript
const { Op } = require('sequelize');
const { User } = require('../models');
User.findAll({
    attributes: ['name', 'age'],
    where: {
        married: 1,
        age: { [Op.gt]: 30 },
    },
});
```

```SQL
-- SQL
SELECT id, name FROM nodejs.users WHERE married = 0 OR age > 30;
```
```javascript
// javascript
const { Op } = require('sequelize');
const { User } = require('../models');
User.findAll({
    attributes: ['id', 'name'],
    where: {
        [Op.or]: [
            { married: 0 }, 
            { age: { [Op.gt]: 30 }}
        ],
    },
});
```

gt: <, lt: >, gte: >=, lte: <=

### 조회 ORDER BY
```SQL
-- SQL
SELECT id, name FROM nodejs.users ORDER BY age DESC;
```
```javascript
// javascript
const { User } = require('../models');
User.findAll({
    attributes: ['id', 'name'],
    order: [['age', 'DESC']],
});
```

```SQL
-- SQL
SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1;
```
```javascript
// javascript
const { User } = require('../models');
User.findAll({
    attributes: ['id', 'name'],
    order: [['age', 'DESC']],
    limit: 1,
});
```

```SQL
-- SQL
SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1 OFFSET 1;
```
```javascript
// javascript
const { User } = require('../models');
User.findAll({
    attributes: ['id', 'name'],
    order: ['age', 'DESC'],
    limit: 1,
    offset: 1,
});
```

### 수정
```SQL
-- SQL
UPDATE nodejs.users SET comment = '바꿀 내용' WHERE id = 2;
```
```javascript
// javascript
const { User } = require('../models');
User.update({
    comment: '바꿀 내용',
}, {
    where: { id: 2 }
});
```

### 삭제
```SQL
-- SQL
DELETE FROM nodejs.users WHERE id = 2;
```
```javascript
// javascript
const { User } = require('../models');
User.destory({
    where: { id: 2 },
});
```

---

## 시퀄라이즈 테이블 관계

user 모델과 comments 모델 간의 관계 정의
- 1:N 관계 (사용자 한 명이 댓글 여러 개 작성)
- 시퀄라이즈에서는 1:N 관계를 hanMany (사용자.hasMany(댓글))
- 반대의 입장에서는 belongsTo(댓글.belongsTo(사용자))
- belongsTo가 있는 테이블에 컬럼이 생김(댓글 테이블에 commenter 컬럼)

### 1:N 관계

```javascript
static associate(db) {
    db.User.hasMany(db.Comment, { foreignKey: "commenter", sourceKey: "id" });
}
```

User.hasMany : User 모델은 많이 갖고 있다. 라고 해석
foreignKey(남의 컬럼), sourceKey(나의 컬럼)
Comment 모델의 commenter라는 컬럼이 User의 id를 참조하고 있다.


```javascript
static associate(db) {
    db.Comment.belongsTo(db.User, { foreignKey: "commenter", targetKey: "id" });
}
```

Comment.belongsTo : Comment 모델은 속해 있다. 라고 해석
foreignKey(나의 컬럼), targetKey(남의 컬럼)


### 1:1 관계

```javascript
db.User.hasOne(db.Info, { foreignKey: "UserId", sourceKey: "id" });
db.Info.belongsTo(db.User, { foreignKey: "UserId", targetKey: "id" });
```

1:1 관계는 하나의 테이블에서 두 개 이상 테이블로 쪼갰을 때 사용한다.

1:1 관계일 때 누가 hasOne이고 belongsTo인지는 스스로 정해줘야 한다.
foreignKey를 누가 갖고 있는지에 따라.
위에 문법에서는 Info가 UserId컬럼을 갖고 있다.


### 다:다 관계

```javascript
db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
```

예) 게시글과 해시태그 테이블
하나의 게시글이 여러 개의 해시태그를 가질 수 있고 하나의 해시태그가 여러 개의 게시글을 가질 수 있음

DB 특성상 다:다 관계는 중간 테이블이 생긴다.


---

## 시퀄라이즈 모델

```javascript
module.exports = class User extends Sequelize.Model {
    ...
```

User는 MySQL의 테이블명과 같다.

시퀄라이즈에서는 id가 자동으로 AUTO_INCREMENT 해준다.


```javscript
type: Sequelize.DATE
```

MySQL DATETIME -> Sequelize.DATE
MySQL DATE -> Sequelize.DATEONLY


```javascript
{
    sequelize,
    timestamps: false,
    underscored: false,
    paranoid: false,
    modelName: "User",
    tableName: "users",
    charset: "utf8",
    collate: "utf8_general_ci",
}
```

시퀄라이즈에서는 기본적으로 2개 더 넣어준다.
timestamps: false일 경우 createdAt, updatedAt을 넣어준다.
createdAt: 생성할 때 현재 시간
updatedAt: 수정할 때 현재 시간
timestamps: true면 createdAt, updatedAt 자동으로 현재 시간을 맞춰준다.

underscored: true일 경우 created_at, updated_at (취향차이, 스네이크케이스, 카멜케이스)

paranoid: true일 경우 deletedAt 자동으로 생성 (회원정보 3년 5년 저장하는 중간에 복구하기 위해)

modelName: "User" 시퀄라이즈는 모델명을 소문자와 복수형으로하여 테이블명을 만듦 (User -> users, Bird -> birds, Post -> posts)

charset: "utf8mb4"는 이모티콘까지 사용할 수 있음

---

## 시퀄라이즈

MySQL 작업을 쉽게 할 수 있도록 도와주는 라이브러리
- ORM : Object Relational Mapping: 객체와 데이터를 매핑(1대1 짝지음)
- MySQL 이외에도 다른 RDB(Maria, Postgre, SQLite, MSSQL)와도 호환 가능
- 자바스크립트 문법으로 데이터베이스 조작 가능

```javascript
npm i express morgan nunjucks sequelize sequelize--cli mysql2
npm i -D nodemon

npx sequelize init
```

---

## MySQL CRUD

Create<br/>
Read<br/>
Update<br/>
Delete<br/>

INSERT INTO 테이블 (컬럼명들) VALUES (값들)
```SQL
mysql> INSERT INTO nodejs.users (name, age, married, comment) VALUES ('zero', 24, 0, '자기소개1');
mysql> INSERT INTO nodejs.users (name, age, married, comment) VALUES ('nero', 32, 1, '자기소개2');

mysql> INSERT INTO nodejs.comments (commenter, comment) VALUES (1, '안녕하세요 zero의 댓글입니다.');
```


SELECT 컬럼 FROM 테이블명
```SQL
mysql> SELECT * FROM nodejs.users;

mysql> SELECT name, married FROM nodejs.users;

mysql> SELECT name, married FROM nodejs.users WHERE married = 1 AND age > 30;

mysql> SELECT id, name FROM nodejs.users WHERE married = 0 OR age > 30;
```


ORDER BY
- DESC 내림차순, ASC 오름차순
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC;
```

LIMIT | 조회할 개수 제한
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1;
```

OFFSET | 앞의 row들 스킵 가능(0부터 셈)
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1 OFFSET 1;
```

UPDATE 테이블명 SET 컬럼=새 값 WHERE 조건
```SQL
mysql> UPDATE nodejs. users SET comment = '바꿀 내용' WHERE id = 2;
```

DELETE FROM 테이블명 WHERE 조건
```SQL
mysql> DELETE FROM nodejs.users WHERE id = 2;
```

---

## MySQL 외래키 (foregin key)

댓글 테이블은 사용자 테이블과 관계가 있다(사용자가 댓글을 달기 때문)
- 외래키를 두어 두 테이블이 관계가 있다는 것을 표시

FOREIGN KEY (컬럼명)  REFERENCES 데이터베이스명.테이블명 (컬럼)
FOREIGN KEY (commenter) REFERENCES nodejs.users (id)
- 댓글 테이블에는 commenter 컬럼이 생기고 사용자 테이블의 id값이 저장됨
- commenter 컬럼이 users 테이블의 id 컬럼을 참조해서 그 컬럼이 값이 있어야만 등록할 수 있음

ON DELETE CASCADE, ON UPDATE CASCADE
- 사용자 테이블의 row가 지워지고 수정될 때 댓글 테이블의 연관된 row들도 같이 지워지고 수정됨
- 데이터를 일치시키기 위해 사용하는 옵션 (CASCADE 대신 SET NULL과 NO ACTION도 있음)
- CASCADE: 만약 id가 1번인 사용자가 탈퇴 시에 그 사람이 쓴 댓글 까지 지움
- SET NULL: 만약 id가 1번인 사용자가 탈퇴 시에 그 사람 댓글은 남겨두고 commenter만 NULL
- NO ACTION: 만약 id가 1번인 사용자가 탈퇴 시에 그냥 그대로 둠(작성자, 댓글 유지)

---

## MySQL 테이블 생성

users 테이블 생성
```SQL
mysql> CREATE TABLE nodejs.users (
    -> id INT NOT NULL AUTO_INCREMENT,
    -> name VARCHAR(20) NOT NULL,
    -> age INT UNSIGNED NOT NULL,
    -> married TINYINT NOT NULL,
    -> comment TEXT NULL,
    -> created_at DATETIME NOT NULL DEFAULT now(),
    -> PRIMARY KEY(id),
    -> UNIQUE INDEX name_UNIQUE (name ASC))
    -> COMMENT = '사용자 정보'
    -> DEFAULT CHARACTER SET = utf8
    -> ENGINE = InnoDB;
```

comments 테이블 생성
```SQL
mysql> CREATE TABLE nodejs.comments (
    -> id INT NOT NULL AUTO_INCREMENT,
    -> commenter INT NOT NULL,
    -> comment VARCHAR(100) NOT NULL,
    -> created_at DATETIME NOT NULL DEFAULT now(),
    -> PRIMARY KEY(id),
    -> INDEX commenter_idx (commenter ASC),
    -> CONSTRAINT comment
    -> FOREIGN KEY (commenter)
    -> REFERENCES nodejs.users (id)
    -> ON DELETE CASCADE
    -> ON UPDATE CASCADE)
    -> COMMENT = '댓글'
    -> DEFAULT CHARSET = utf8mb4
    -> ENGINE = InnoDB;
```

테이블 제대로 생성 됐는지 확인
```SQL
mysql> SHOW TABLES;
mysql> DESC users;
mysql> DESC comments;
```

CREATE TABLE [데이터베이스명.테이블명]

INT: 정수 자료형(FLOAT, DOUBLE은 실수)
VARCHAR: 문자열 자료형, 가변 길이(CHAR은 고정 길이)
TEXT: 긴 문자열
DATETIME: 날짜 자료형
TINYINT: -128 ~ 127까지 저장하지만 여기서는 1 또는 0만 저장하는 Bool 값

NOT_NULL: 빈 값은 받지 않음(NULL은 빈 값 허용)
AUTO_INCREMENT: 숫자 자료형인 경우 다음 row가 저장될 때 자동으로 1 증가
UNSIGNED: 0과 양수만 허용
ZEROFILL: 숫자의 자리 수가 고정된 경우 빈 자리에 0을 넣음
DEFAULT now(): 날짜 컬럼의 기본 값을 현재 시간으로

UNIQUE INDEX name_UNIQUE (name ASC): name을 고유값으로 지정하고 자주 검색하니 INDEX 키워드 붙힘

PRIMARY KEY(id) : id를 기본 값으로 지정 (겹치지 않는 데이터)
INDEX commenter_idx (commenter ASC): 자주 검색되는 데이터 지정하면 검색 속도가 빨라짐 (오름차순)
CONSTRAINT comment: comment에 제약을 걸음

---

## MySQL 데이터베이스 생성

```SQL
mysql> CREATE SCHEMA `nodejs` DEFAULT CHARACTER SET utf8;
```
-> nodejs 데이터베이스 생성
```SQL
mysql> use nodejs;
```
-> nodejs 데이터베이스 선택

---

## 데이터베이스

서버에 모든 데이터를 저장하면 비용이 많이 들기 때문에

보안 위협이 없는 데이터들은 웬만하면 클라이언트에 저장

MySQL 관계형 데이터베이스
- 데이터베이스: 관련성을 가지며 중복이 없는 데이터들의 집합
- DBMS: 데이터베이스를 관리하는 시스템
- RDBMS: 관계형 데이터베이스를 관리하는 시스템
- 서버의 하드 디스크, SSD 등의 저장 매체에 데이터를 저장
- 서버 종료 여부와 상관 없이 데이터를 계속 사용 가능
- 여러 사람이 동시 접근 가능, 권한 분할 가능

---

## express res 응답

res.end, res.json, res.redirect, res.render, res.send, res.sendFile

위의 응답 함수는 요청당 한 번만 사용한다. 중복 사용 시 에러 출력

---

## express 라우터 그룹화

```javascript
router.get('/about', (req, res) => {
    res.send('GET, Express');
});
router.post('/about', (req, res) => {
    res.send('POST, Express');
});
```

```javascript
router.route('/about')
    .get((req, res) => {
        res.send('GET, Express');
    })
    .post((req, res) => {
        res.send('POST, Express');
    });
```

---

## express multer

- storage: 저장할 공간 정보
- diskStorage: 하드디스크에 업로드 파일 저장
- destination: 저장할 경로
- filename: 저장할 파일명(파일명+날짜+확장자)
- Limits: 파일 개수나 파일 사이즈 제한

실제 서버 운영 시 서버 디스크 대신 S3같은 스토리지 서비스에 저장하는게 좋음
- storage 설정만 바꿔주면 됨


```javascript
const multer = require("multer");

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads/");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
```

- upload.single(): 하나의 파일 업로드할 때
- upload.none(): 파일은 업로드 하지 않을 때
- upload.array(): 여러 개 파일 업로드할 때
- req.file: 업로드 정보 저장

```javascript
app.post("/upload", upload.single("image"), (req, res) => {
  console.log(req.file);
  res.send("ok");
});
app.post("/upload", upload.none(), (req, res) => {
  console.log(req.body);
  res.send("ok");
});
app.post("/upload", upload.array('many'), (req, res) => {
  console.log(req.files, req.body);
  res.send("ok");
});
```

---

## express 미들웨어 안에 미들웨어 넣기(미들웨어 확장)

```javascript
app.use('/', (req, res, next) => {
    if(req.session.id) {
        // 로그인을 했다면 사진이나 파일을 프론트로 전달 가능
        express.static(__dirname, 'public')(req, res, next)
    } else {
        // 로그인 안 했으면 그냥 넘어감
        next();
    }
});
```

---

## express 미들웨어간 데이터 전달

app.set하면 서버 켜지는 내내 데이터 공유

잘못된 접근 방법
```javascript
app.use((req, res, next) => {
  app.set('hello', '계좌비밀번호');
});

app.get("/", (req, res, next) => {
  app.get('hello');
});
```

해결방법
```javascript
app.use((req, res, next) => {
  req.data = '비밀번호';
});

app.get("/", (req, res, next) => {
  req.data // 비밀번호
});
```


---

## express session

- resave: 요청이 왔을 때 세션에 수정사항이 생기지 않아도 다시 저장할지 여부
- saveUninitialized: 세션에 저장할 내역이 없더라도 세션을 저장할지 여부
- secret: cookieParser('secretpassword')의 인수와 같게 설정
- name: 브라우저 - 쿠키 이름 ('coonect.sid' 디폴트 값)


req.session.name = 'qnrjs42'; // 세션 등록
req.sessionID; // 세션 아이디 확인
req.session.destroy(); // 세션 모두 제거

```javascript
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'secretpassword',
    cookie: {
        httpOnly: true,
    },
    name: 'connect.sid',
}));


```

---

## express static

css, html, js 정적 파일

localhost:3000/index.html -> localhost:3000/public/index.html

public 폴더 안에 파일이 있어야 함 없으면 next

보안 위협 제거

```javascript
app.use(morgan("dev"));
// static은 morgan 밑에 또는 상단에 위치한다.
app.use(express.static(path.join(__dirname, 'public')));
```

하지만 서비스에 따라 다르기 때문에 위치 순서를 유도리있게 설정한다.

---

## express bodyParser

클라이언트에서 'name'을 보냈을 떄 req.body.name

폼에서 이미지나 파일 보낼 때는 urlencoded가 처리를 못해서 multer라는 모듈을 써야 한다.

```javascript
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    req.body.name
});
```

---

## cookie-parser

알아서 쿠키를 파싱이 되어 있다.

```javascript
app.use(cookieParser());

app.get('/', (req, res) => {
    req.cookies // { mycookei: 'test' }

    // 쿠키 생성
    res.cookie('name', encodeURIComponent(name), {
        expires: new Date(),
        httpOnly: true,
        path: '/',
    });

    // 쿠키 삭제
    res.clearCookie("name", encodeURIComponent(name), {
      httpOnly: true,
      path: "/",
    });
});
```

---

## morgan

배포모드에서 에러나면 IP, 정확한 시간, 주소, 브라우저 정보까지 알 수 있다.

```javascript
// 개발모드
app.use(morgan('dev'));

// 배포모드
app.use(morgan('combined'));
```

---

## express body-parser 최신 사람 구별 방법

express 쓸 때 body-parser 쓰는 사람은 옛날 사람.

안 쓰면 최신 사람.

---

## express next('route')

next('route')는 같은 라우터에서 실행 되지 않고 다음 라우터로 넘어간다.

즉, '실행될까?'는 실행 되지 않고, '실행이 되네?' 라우터로 넘어간다.

```javascript
app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, "index.html"));
    next('route');
}, (req, res) => {
    console.log('실행될까?');
});

app.get('/', (req, res) => {
    console.log('실행이 되네?');
})
```

---

## express HTTP 상태 코드

기본적으로 res.send()는 200번 코드를 넘겨준다.

```javascript
app.use((req, res, next) => {
  // res.send('404페이지');
  res.status(404).send('404페이지');
});
```

HTTP 상태 코드만 보고 보안 위협을 할 수 있기 때문에 조심히 써야한다.

200번대 코드만 잘 써줘도 되고, 400번대는 404로 퉁치면 된다.

---

## express 에러 미들웨어

꼭 4개의 매개변수를 써야한다.

```javascript
app.use((err, req, res, next) => {
    console.error(err);
});
```

---

하나의 라우터에서 여러 개의 send나 json이 중첩되면 에러 발생.
Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are send to the client

```javascript
app.post("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
    res.send("hello express");
    res.json({ hello: 'hi' });
});
```

next(err) next()안에 인수가 들어가면 에러로 처리한다.

그래서 에러 처리 미들웨어로 넘어간다.

---

```javascript
app.use((req, res, next) => {
    console.log('모든 요청에 실행');
    next();
}, (req, res, next) => {
    try{
        throw new Error('에러 발생');
    }catch(err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
});
```

---

## express 라우터 매개변수(와일드 카드)

```javascript
app.get('/category/:name', (req, res) => {
    res.send(`hello ${req.params.name}`);
});
```

와일드카드는 다른 라우터들보다 아래에 위치

---

## express

app.use()는 모든 요청에서 실행

미들웨어는 next() 해줘야 다음 코드를 실행

```javascript
app.use((req, res, next) => {
    console.log('모든 요청에 실행');
    next();
});
```

---

## SemVer 버저닝

노드 패키지 버전은 SemVer(유의적 버저닝) 방식을 따름
- Major(주 버전), Minor(부 버전), Patch(수 버전)

- 노드에서 배포할 때 항상 버전을 올려야 함
- Major는 하위 버전과 호환되지 않은 수정 사항 생겼을 때 올림
- Minor는 하위 버전과 호환되는 수정 사항이 생겼을 때 올림
- Patch는 기능에 버그를 해결했을 때 올림

---

## cluster

기본적으로 싱글 스레드인 노드가 CPU 코어를 모두 사용할 수 있게 해주는 모듈
- 포트 공유하는 노드 프로세스 여러 개 둘 수 있음
- 요청이 많을 때 병렬로 실행된 서버의 개수만큼 요청을 분산
- 서버에 무리가 덜 감
- 코어가 8개인 서버: 보통은 코어 하나만 활용
- cluster로 코어 하나당 노드 프로세스 하나를 배정 가능
- 성능이 8배가 되는 것은 아니지만 개선
- 단점: 컴퓨터 자원(메모리, 세션) 공유 못 함
- Redis 등 별도 서버로 해결

---

## https, http2

https
웹 서버에 SSL 암호화를 추가하는 모듈

실무에서 필수

무료 SSL 인증기관: letsencrypt

http2
- SSL 암호화와 최신 HTTP 프로토콜인 http/2 사용하는 모듈
- 요청 및 응답 방식이 기존 http/1.1보다 개선
- 웹의 속도 개선

---

## 쿠키

키=값의 쌍
- name=qnrjs42
- 매 요청마다 서버에 동봉해서 보냄
- 서버는 쿠키를 읽어 누구인지 파악

---

## REST API
(Representational State Transfer)

/index.html이면 index.html을 보내달라는 뜻

GET: 서버 자원 가져올 때
POST: 서버 자원을 새로 등록할 때
PUT: 서버 자원 요청에 들어있는 자원으로 치환하고자할 때 (전체 수정)
PATCH: 서버 자원 일부만 수정하고자할 때 (부분 수정)
DELETE: 서버 자원을 삭제할 때

RESTful
- REST API를 사용한 주소 체계를 이용하는 서버

200: 단순하게 성공
201: 생성함을 성공

---

## 프로세스 강제 종료

윈도우: netstat -ano | 포트
        taskkill /pid 프로세스아이디 /f

맥/리눅스: lsof -i tcp:포트
           kill -9 프로세스아이디

$ node
process.pid
-> 프로세스 아이디

---

## 예외 처리

- 노드 스레드가 멈춤.
- 노드는 싱글 스레드라 스레드가 멈추면 프로세스가 멈춤.

promise에 catch 항상 작성.
async/await - try/catch 항상 작성.

에러 처리하면 콘솔에서는 에러 표시를 하지만 서비스는 계속 유지


```javascript
process.on('uncaughtException', (err) => {
    console.error('예기치 못한 에러', err);
});
```

uncaughtException 에러 처리는 에러 내용 기록용으로만 사용.


---

## 스레드풀

fs. crypto, zlib 모듈의 메서드를 실행할 때는 백그라운드에서 동시에 실행
- 스레드풀이 동시에 처리

스레드 개수 설정
윈도우: SET UV_THREADPOOL_SIZE=8
리눅스: UV_THREADPOOL_SIZE=8

---

## 버퍼와 스트림

버퍼: 일정한 크기로 모아두는 데이터

스트림: 데이터의 흐름

스트림이 효율적. 
스트림이 메모리를 적게 사용.

스트림 장점: 1MB씩 보내씩 보내서 1MB씩 받아서 1GB로 복구로하는 형식.<br />
데이터가 흘러가는 모양이 pipe라 함. 

---

## child_process

다른 언어를 불러올 수 있다.

노드가 다른 언어 대신 실행하는게 아니라 이것 좀 실행해달라고 하는 것이기 때문에

다른 언어는 설치가 되어있어야 한다.

---

## worker_threads (노드 14버전 부터 가능)

노드에서 멀티 스레드 방식으로 작업 가능

하지만 노드에서는 비추천. 다른 언어에서 사용하는게 나을 수도

---

## 암호화

단방향 암호화 crypto (hash)

암호화는 멀티 스레드 사용

md5, sha1은 취약점이 발견되어 사용하지 않음

대칭형 암호화 AES
비 대칭형 암호화 RSA


util.deprecate() 이 함수를 쓸 때마다 경고 출력
함수를 함부로 제거하지 않고 경고를 출력하고 시간이 지난 뒤에
사람들이 안 쓸 때 버전 업데이트하면서 함수 제거

util.promisify() 콜백 패턴을 프로미스 패턴으로 변경


---

## path

```javascript
    path.join(__dirname, '/example.js');
    path.resolve(__dirname, '/example.js');
```

```
// 실행결과

c:\users\exam\desktop\node-learn\example.js // join: 상대경로
c:\example.js // resolve: 절대경로
```

---

## os

```javascript
const os = require('os');

console.log(os.cpus());
```

cpu 정보(클럭, 코어, 스피드 등)를 확인할 수 있다.

---

## process

우선 순위 nextTick(1) - Promise(2) - setTimeout - setImmediate

setTimeout, setImmediate 환경에 따라 누가 먼저 실행될지 결정된다.


```javascript
setImmediate(() => {
    console.log('immediate');
});
process.nextTick(() => {
    console.log('nextTick');
});
setTimeout(() => {
    console.log('timeout');
}, 0);
Promise.resolve().then(() => console.log('promise'));
```

```javascript
// 실행 결과

nextTick
promise
timeout
immediate
```


---

## require

require는 가장 위에 올 필요는 없지만,
import는 가장 위에 와야함

---

## 모듈

require - module.exports
import - export default (최신 버전)

 module.exports와 export default 똑같이 보이지만 동작이 다를 수 있다.
 대부분은 바뀌는 경우가 있지만 안 바뀌는 경우도 있으니 참고.

```javascript
// module/example1.js

const odd = '홀수';
const even = '짝수';
 
module.exports = { odd, even };
// export default { odd, even };
```

```javascript
// module/example2.js

const value = require('./example1');
// import { odd, even } from './example1';
console.log(value.odd, value.even);

// 구조 분해 할당
const { odd, even } = require('./example1');
console.log(oddm even);
```


---

## REPL

Read
Evaluate
Print
Loop

---

## 프로미스

프로미스: 내용이 실행은 되었지만 결과를 아직 반환하지 않은 객체
- then 붙이면 결과를 반환
- 실행이 완료되지 않았으면 완료된 후에 then 내부 함수가 실행

Resolve(성공리턴값) -> then
Reject(실패리턴값) -> catch
Finally 부분은 무조건 실행

Promise.all(배열): 여러 개의 프로미스를 동시에 실행
- 하나라도 실패 시 catch
- allSettled로 실패한 것만 추려낼 수 있음


async/await은 promise 성질을 가지고 있음

async/await은 try/catch로 감싸줘야 함

---

## 이벤트 루프

호출 스택 -> 백그라운드 -> 태스크 큐 -> 호출 스택

setTimeout()이 0초라도 백그라운드로 이동함
Promise 백그라운드

우선순위 Promise(1등) - setTimeout(2등)

```javascript
function oneMore() {
    console.log('one more');
}
function run() {
    console.log('run run');
    setTimeout(() => {
        console.log('wow');
    }, 0);
    new Promise((resolve) => {
        resolve('hi');
    })
    .then(console.log);
    oneMore();
}

setTimeout(run, 5000);

// 실행 결과
/*
    run run
    one more
    hi
    wow
*/
```

---

## 호출 스택

밑에서부터 쌓여서 위에서부터 꺼냄

- Anonymous는 가상의 전역 컨텍스트
- 함수 호출 순서대로 쌓이고, 역순으로 실행
- 함수 실행 완료 시 스택에서 빠짐
- LIFO 구조라서 스택이라 불림

---

## 노드 서버 장단점

장점
- 멀티 스레드 방식에 비해 컴퓨터 자원을 적게 사용
- I/O 작업이 많은 서버로 적합
- 멀티 스레드 방식보다 쉬움
- 웹 서버가 내장되어 있음
- 자바스크립트 사용
- JSON 형식과 호환 쉬움

단점
- 싱글 스레드라서 CPU 코어 하나만 사용
- CPU 작업이 많은 서버로는 부적합
- 하나뿐인 스레드가 멈추지 않도록 관리해야 함
- 서버 규모가 커졌을 때 서버를 관리하기 어려움
- 어중간한 성능

---

## 프로세스 vs 스레드

- 프로세스: 운영체제에서 할당하는 작업의 단위, 프로세스 간 자원 공유 X
- 스레드: 프로세스 내에서 실행되는 작업의 단위, 부모 프로세스 자원 공유

- 노드 프로세스는 멀티 스레드지만 직접 다룰 수 있는 스레드는 하나라서 싱글 스레드라고 표현

- 하지만 노드는 싱글 스레드가 아님

- 노드는 주로 멀티 스레드 대신 멀티 프로세스 활용

- 노드는 14버전부터 멀티 스레드 사용 가능

---

## 논블로킹

논 블로킹: 오래 걸리는 함수를 백그라운드로 보내서 다음 코드가 먼저 실행되게 하고,
나중에 오래 걸리는 함수를 실행

- 논 블로킹 방식 하에서 일부 코드는 백그라운드에서 병렬로 실행
- 일부 코드: I/O 작업(파일 시스템 접근, 네트워크 요청), 압축, 암호화
- 나머지 코드는 블로킹 방식으로 실행
- I/O 작업이 많을 때 노드 활용성이 극대화

동기 - 블로킹
비동기 - 논 블로킹
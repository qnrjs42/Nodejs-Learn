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
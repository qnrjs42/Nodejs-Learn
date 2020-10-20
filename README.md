
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
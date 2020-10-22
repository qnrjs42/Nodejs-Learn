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
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();

app.set('port', process.env.PORT || 3000);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.cookie('name', encodeURIComponent(name), {
        expires: new Date(),
        httpOnly: true,
        path: '/',
    });
    res.clearCookie("name", encodeURIComponent(name), {
      httpOnly: true,
      path: "/",
    });
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/", (req, res) => {
  res.send("hello express");
});

app.get("/about", (req, res) => {
  res.send("hello express");
});

app.get("/category/:name", (req, res) => {
  res.send(`hello wildcard`);
});

app.use((req, res, next) => {
  res.status(404).send('404페이지');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(200).send('에러 처리 미들웨어')
});

app.listen(app.get('port'), () => {
    console.log('익스프레스 서버 실행');
})
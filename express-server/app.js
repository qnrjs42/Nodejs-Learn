const express = require('express');
const path = require('path');

const app = express();

app.set('port', process.env.PORT || 3000);

app.use((req, res, next) => {
    console.log('모든 요청에 실행');
    next();
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/category/:name', (req, res) => {
    res.send(`hello wildcard`);
})

app.post("/", (req, res) => {
  res.send("hello express");
});

app.get("/about", (req, res) => {
  res.send("hello express");
});

app.use((req, res, next) => {
  res.status(404).send('404페이지');
});

app.use((err, req, res, next) => {
    console.error(err);
});

app.listen(app.get('port'), () => {
    console.log('익스프레스 서버 실행');
})
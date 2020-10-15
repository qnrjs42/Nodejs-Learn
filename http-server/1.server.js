const http = require('http');


http.createServer((req, res) => {
    res.write('<h1>Hello Node!</h1>');
    res.write("<h1>Hello Server!</h1>");
    res.end("<h1>Hello</h1>");
})
.listen(8080, () => {
    console.log('8080번 포트에서 서버 대기 중');
})
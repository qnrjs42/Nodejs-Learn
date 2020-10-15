const fs = require('fs');
const zlib = require('zlib');

const readStream = fs.createReadStream('./readme2.txt', { highWaterMark: 16 });
const zlibStream = zlib.createGzip(); // 압축 스트림
// const writeStream = fs.createWriteStream("./writeme4.txt");
const writeStream = fs.createWriteStream("./writeme4.txt.gz");
// pipe를 통해 파일 복사
// readStream.pipe(writeStream);

// gzip으로 압축
readStream.pipe(zlibStream).pipe(writeStream);
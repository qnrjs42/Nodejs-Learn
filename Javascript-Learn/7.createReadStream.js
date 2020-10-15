const fs = require('fs');
// stream은 기본 값으로 읽는 바이트 수는 64KB -> 64000
// 16B로 수정해서 조각
const readStream = fs.createReadStream('./readme2.txt', { highWaterMark: 16 });

// 스트림은 조각조각 내서 순서대로 보내준다.
const data = [];
readStream.on('data', (chunk) => {
    data.push(chunk);
    console.log('data:', chunk, chunk.length);

})
readStream.on('end', () => {
    console.log('end: ', Buffer.concat(data).toString())
})
readStream.on("error", (err) => {
  console.log("error: ", err);
});
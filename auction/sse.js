const SSE = require("sse");

module.exports = (server) => {
    // express 서버와 연결
  const sse = new SSE(server);
  sse.on("connection", (client) => {
    // 서버센트이벤트 연결
    // 클라이언트에게 시간 정보 전달 | sse는 문자열만 보내줄 수 있음
    setInterval(() => {
      client.send(Date.now().toString());
    }, 1000);
  });
};

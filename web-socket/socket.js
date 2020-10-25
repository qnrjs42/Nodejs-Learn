const SocketIO = require("socket.io");

module.exports = (server) => {
  const io = SocketIO(server, { path: "/socket.io" });

  io.on("connection", (socket) => {
    // 웹소켓 연결 시
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log("새로운 클라이언트 접속!", ip, socket.id, req.ip);
    socket.on("disconnect", () => {
      // 연결 종료 시
      console.log("클라이언트 접속 해제", ip, socket.id);
      clearInterval(socket.interval);
    });
    socket.on("error", (error) => {
      // 에러 시
      console.error(error);
    });
    socket.on("reply", (data) => {
      // 클라이언트로부터 메시지
      console.log(data);
    });
    socket.interval = setInterval(() => {
      // 3초마다 클라이언트로 메시지 전송
      socket.emit("news", "Hello Socket.IO"); // 이벤트 이름, 메시지
    }, 3000);
  });
};

// const WebSocket = require("ws");

// module.exports = (server) => {
//     // 전달받은 express server와 websocket server 연결
//   const wss = new WebSocket.Server({ server });

//   wss.on("connection", (ws, req) => {
//     // 웹소켓 연결 시
//     const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // IP 파악 | 프록시 사용 시 IP 변조되는 상황 방지 x-forwarded-for
//     console.log("새로운 클라이언트 접속", ip); // ::1 | localhost IPv6 형태
//     ws.on("message", (message) => {
//       // 클라이언트로부터 메시지
//       console.log(message);
//     });
//     ws.on("error", (error) => {
//       // 에러 시
//       console.error(error);
//     });
//     ws.on("close", () => {
//       // 연결 종료 시 | 브라우저가 창을 닫을 때
//       console.log("클라이언트 접속 해제", ip);
//       clearInterval(ws.interval); // 연결 끊기면 3초마다 연결 보내는 것도 없앰 (자원 낭비 방지)
//     });

//     ws.interval = setInterval(() => {
//       // 3초마다 클라이언트로 메시지 전송
//       if (ws.readyState === ws.OPEN) { // 연결된 상태
//         ws.send("서버에서 클라이언트로 메시지를 보냅니다.");
//       }
//     }, 3000);
//   });
// };

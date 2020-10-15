
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
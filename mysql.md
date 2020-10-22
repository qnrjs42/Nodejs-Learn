## MySQL CRUD

Create<br/>
Read<br/>
Update<br/>
Delete<br/>

INSERT INTO 테이블 (컬럼명들) VALUES (값들)
```SQL
mysql> INSERT INTO nodejs.users (name, age, married, comment) VALUES ('zero', 24, 0, '자기소개1');
mysql> INSERT INTO nodejs.users (name, age, married, comment) VALUES ('nero', 32, 1, '자기소개2');

mysql> INSERT INTO nodejs.comments (commenter, comment) VALUES (1, '안녕하세요 zero의 댓글입니다.');
```


SELECT 컬럼 FROM 테이블명
```SQL
mysql> SELECT * FROM nodejs.users;

mysql> SELECT name, married FROM nodejs.users;

mysql> SELECT name, married FROM nodejs.users WHERE married = 1 AND age > 30;

mysql> SELECT id, name FROM nodejs.users WHERE married = 0 OR age > 30;
```


ORDER BY
- DESC 내림차순, ASC 오름차순
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC;
```

LIMIT | 조회할 개수 제한
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1;
```

OFFSET | 앞의 row들 스킵 가능(0부터 셈)
```SQL
mysql> SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1 OFFSET 1;
```

UPDATE 테이블명 SET 컬럼=새 값 WHERE 조건
```SQL
mysql> UPDATE nodejs. users SET comment = '바꿀 내용' WHERE id = 2;
```

DELETE FROM 테이블명 WHERE 조건
```SQL
mysql> DELETE FROM nodejs.users WHERE id = 2;
```

---

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
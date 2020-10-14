const condition = true;

const promise = new Promise((resolve, reject) => {
    if(condition) {
        resolve('성공');
    } else {
        reject('실패');
    }
});

promise.then((message) => {
    console.log(message)
})
.catch((error) => {
    console.error(error)
});


async function main() {
    try {
        const result = await promise;
        return result;
    } catch(err) {
        console.error(err)
    }
}

// 아래 두 코드는 똑같다
main.then((name) => {console.log(name)});
const name = await main()
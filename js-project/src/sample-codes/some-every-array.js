export  class User {
    constructor(name, age) {
        this.name = name
        this.age = age
    }
}

const leo = new User("Leo", 38)
const am = new User("am", 7)
const mauricio = new User("Mauricio", 32)

const users = []
users.push(leo)
users.push(am)
users.push(mauricio)

const isAllBiggerThan18YearOld = users.every(user => user.age >= 18);
console.log(`isAllBiggerThan18YearOld: ${isAllBiggerThan18YearOld}`); //false

let isSomeoneBiggerThan18YearOld = users.some(user => user.age >= 18);
console.log(`isSomeoneBiggerThan18YearOld: ${isSomeoneBiggerThan18YearOld}`); //true
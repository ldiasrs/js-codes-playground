export  class User {
    constructor(name, age, dog) {
        this.name = name
        this.age = age
        this.dog = dog
    }
}

export class Dog {
    constructor(name) {
        this.name = name
    }
}

export function printUser(user) {
    console.log(JSON.stringify(user))
}

const leo = new User("Leo", 38, new Dog("Luna"))

printUser(leo)
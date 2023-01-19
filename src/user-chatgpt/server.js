import express, { json } from 'express';
import SQLite from 'sqlite3';
import path from 'path' ;
const app = express();

// Connect to the SQLite database
const db = new SQLite.Database('users.db');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', path.join(process.cwd(), 'public'));

// Create the users table if it doesn't exist

function createTableAndInsertData() {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)`, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('users table created');
        insertTestData();
    });
}

function insertTestData() {
    const testData = [
        ['John Doe', 25],
        ['Jane Smith', 32],
        ['Bob Johnson', 18],
        ['Emily Davis', 22]
    ];
    testData.forEach(user => {
        db.run(`INSERT INTO users (name, age) VALUES (?,?)`, user, function(err) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`user ${user[0]} inserted`);
        });
    });
}
createTableAndInsertData();


app.use(json());

app.post('/user', (req, res) => {
    const { name, age } = req.body;
    // Insert the user into the users table
    db.run(`INSERT INTO users (name, age) VALUES (?, ?)`, [name, age], function(err) {
        if (err) {
            res.status(500).send("Error while saving user");
            return;
        }
        res.send("User created");
    });
});

app.get('/users', (req, res) => {
    // Retrieve all users from the users table
    db.all(`SELECT name, age FROM users`, (err, rows) => {
        if (err) {
            res.status(500).send("Error while retrieving users");
            return;
        }
        res.render('users', { users: rows });
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});

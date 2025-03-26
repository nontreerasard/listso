const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'listso',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createUser(username, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        console.log('User created successfully!');
    } catch (error) {
        console.error('Error creating user:', error.message);
    } finally {
        await pool.end();
    }
}

rl.question('Enter username: ', (username) => {
    rl.question('Enter password: ', async (password) => {
        await createUser(username, password);
        rl.close();
    });
});
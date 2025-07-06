// hash.js
import bcrypt from 'bcrypt';

const password = 'etiene'; // 👈 your plain password
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log("Hashed password:", hash);
});

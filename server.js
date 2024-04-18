const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', //changes per system
    database: 'project' //set to the schema name in your mySQL
});

app.use(session({
    secret: 'TommyBahama2024', //this is supposed to be a long randomly generated string but for this instance its fine
    resave: false,
    saveUninitialized: true
}));

connection.connect(err => {
    if(err) {
        console.error('Error connecting to the database:', err)
        return;
    }
});

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({error: 'Unauthorized'});
    }
}

app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.json());

//http://localhost:3000/

//collect all users from the database 
app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (error, results) => {
        if(error) {
            console.error("Error querying database:", error);
            res.status(500).send('Error querying database');
            return;
        }
        res.json(results);
    });
});

//function for deleting the requested user in the DB
app.delete('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    connection.query('DELETE FROM users WHERE id = ?', [userId], (error, results) => {
        if(error) {
            console.error("Error deleting user:", error);
            res.status(500).send('Error deleting user');
        }
        //we were successful if we got here, gotta remove their pets
        connection.query('DELETE FROM pets WHERE OwnedBy = ?', [userId], (error, results) => {
            if(error) {
                console.error("Error deleting pets associated with the user:", error);
                return res.status(500).send('Error deleting associated pets');
            }
        });
    });
});

//update a user's info
app.put('/users/:ID', (req, res) => {
    console.log("Session userdata is comprised of:", req.session.userData);
    const userID = req.session.userData.id;
    const userData = req.body;

    const {username, pass, email} = userData;
    if(!username || !pass || !email) {
        return res.status(400).send('Missing Fields from the form');
    }

    const updateFields = Object.keys(userData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(userData);
    updateValues.push(userID);

    //update query using userData and username
    connection.query(`UPDATE users SET ${updateFields} WHERE id = ?`, updateValues, (error, results) => {
        if(error) {
            console.error("Error updating user:", error);
            return res.status(500).send('Error updating user');
        }
        return res.status(200).json({message: 'User updated successfully!'});
    });
});

//get the account info tied to the given ID value
app.get('/users/:ID', (req, res) => {
    const ID = req.params.ID;

    connection.query('SELECT * FROM users WHERE id = ?', [ID], (error, results) => {
        if(error) {
            console.error("Error querying database:", error);
            res.status(500).send('Error querying database');
            return;
        }
        res.json(results);
    });
});

//add a pet to the DB
app.post('/pets', (req, res) => {
    const {Title, Species, Breed, Price} = req.body;
    
    const values = [Title, Species, Breed, Price];
    console.log(values);
    connection.query('INSERT INTO pets(Title, Species, Breed, Price) VALUES (?,?,?,?)', values, (error, results) => {
        if(error) {
            console.error('Error adding pet:', error);
            return res.status(500).json({message: 'Error adding pet'});
        }
        res.status(201).json({message:'Pet added successfully!'});
    });
});

//get all pets in the DB not currently owned
app.get('/pets', (req, res) => {
    connection.query('SELECT * FROM pets WHERE OwnedBy IS NULL', (error, results) => {
        if(error) {
            console.error("Error querying database:", error);
            res.status(500).send('Error querying database');
            return;
        }
        res.json(results);
    });
});

//pull all pets currently owned by a specific ID
app.get('/pets/person/:ownerID', (req, res) => {
    const ownerID = req.params.ownerID;
    connection.query('SELECT * FROM pets WHERE OwnedBy = ?', [ownerID], (error, results) => {
        if(error) {
            console.error("Error querying database:", error);
            res.status(500).send('Error querying database');
            return;
        }
        res.json(results);
    });
});


//delete pets (owned by the logged in account, need an idless one for admins later)
app.delete('/pets/delete/:Title', (req, res) => {
    const petName = req.params.Title;
    const sessionData = req.session.userData; //for the logged in user's ID
    const userID = sessionData.id;
    connection.query('DELETE FROM pets WHERE id = ? AND Title = ?', [userId, Title], (error, results) => {
        if(error) {
            console.error("Error deleting pet:", error);
            res.status(500).send('Error deleting pet');
            return;
        }
        res.sendStatus(200); //successfully deleted
    });
});

//pull pets of a specific name from the tables
app.get('/pets/title/:Title', (req, res) => {
    const name =  req.params.Title;
    connection.query('SELECT * FROM pets WHERE Title = ?', [name], (error, results) => {
        if(error) {
            console.error("Error querying database:", error);
            res.status(500).send('Error querying database');
            return;
        }
        res.json(results);
    });
});

//current session user purchases pet by setting its ownedby value to the users ID
app.put('/purchase/:petID', (req, res) => {
    const petID = req.params.petID;
    const userID = req.session.userData.id;
    connection.query('UPDATE pets SET OwnedBy = ? WHERE PetID = ?', [userID, petID], (error, results) => {
        if(error) {
            console.error("Error updating pet ownership:", error);
            res.status(500).send("Error updating pet's ownership");
            return;
        }
        res.status(200).send("Pet purchased by user!");
    });
});

//potential return function for users
app.put('/return/:petID', (req, res) => {
    const petID = req.params.petID;
    connection.query('UPDATE pets SET OwnedBy = NULL WHERE PetID = ?', [petID], (error, results) => {
        if(error) {
            console.error("Error updating pet ownership:", error);
            res.status(500).send("Error updating pet's ownership");
            return;
        }
        res.status(200).send("Pet returned by user!");
    });
});

app.post('/Login', (req, res) => {
    const { username, password } = req.body;

    //SQL check to see if we have an account
    connection.query('SELECT * FROM users WHERE username = ? AND pass = ?', [username, password], (error, results) => {
        if(error) {
            console.error("Error querying the database:", error);
            res.status(500).send("Error querying the database");
            return;
        }

        if(results.length == 1) {
            //might have to verify these are written correctly
            const userData = results[0]; //first result
            
            req.session.userData = {
                id: userData.id,
                username: userData.username,
                isAdmin: userData.administrator
            }
            res.json({
                message: 'Login Successful!',
                userData: {
                id: userData.id,
                username: userData.username,
                isAdmin: userData.administrator
                }
            });
        } else {
            res.status(401).json({error: 'Invalid login, please try again.'});
        }
    });
});

app.post('/Logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            console.error('Error destroying session:', err);
            res.status(500).json({error: 'Server Error'});
        } else {
            res.json({message: 'Logout Successful'});
        }
    });
});

app.post('/Register', (req, res) => {
    const { username, password, email, admin} = req.body;

    connection.query('INSERT INTO users (username, pass, email, administrator) VALUES (?,?,?,?)', [username, password, email, admin], (error, results) => {
        if(error) {
            console.error("Error inserting into user table: ", error);
            res.status(500).send("Error creating user");
        } else {
            res.status(401).json({error: 'user creation failed, please try again.'});
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
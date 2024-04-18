CREATE TABLE users (
	id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(70) NOT NULL,
    pass VARCHAR(70) NOT NULL,
    email VARCHAR(300) NOT NULL,
    administrator BOOLEAN NOT NULL,
    UNIQUE(username),
    UNIQUE(email)
);

CREATE TABLE pets (
	PetID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(100) NOT NULL,
    Species VARCHAR(20) NOT NULL,
    Breed VARCHAR(40),
    Price DECIMAL, 
    OwnedBy INT
);

/* dummy data for initialization */
INSERT INTO pets(Title,Species,Breed,Price) VALUES ("Bobby","Dog","German Shephard", 150);
INSERT INTO pets(Title,Species,Breed,Price) VALUES ("Jeeves","Cat","Maine Coon", 300);
INSERT INTO pets(Title,Species,Price) VALUES ("Estra","Ferret", 50);
INSERT INTO pets(Title,Species,Breed,Price) VALUES ("Marlow","Dog","Pug", 200.50);
INSERT INTO pets(Title,Species,Breed,Price) VALUES ("Geralt","Cat","Siamese", 30.75);
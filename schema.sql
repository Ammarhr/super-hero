DROP TABLE IF EXISTS hero;

CREATE TABLE hero(
	id SERIAL PRIMARY KEY,
	name VARCHAR(50),
	full_name VARCHAR(100),
	image VARCHAR(255),
	place_of_birth VARCHAR(30),
	work_occupation TEXT,
	idCharacter NUMERIC
);
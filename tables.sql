USE xskuta04;

CREATE TABLE users (
	id int NOT NULL AUTO_INCREMENT,
	name varchar(255) NOT NULL,
	pass varchar(255) NOT NULL,
	admin bool,
	team_id int DEFAULT NULL,		-- NULL user has no team, ID of team
	description varchar(255) DEFAULT '',
	date_of_birth TIMESTAMP,
	PRIMARY KEY (id)
)ENGINE=InnoDB;

CREATE TABLE teams(
	id int NOT NULL AUTO_INCREMENT,
	name varchar(255) NOT NULL,
	creator_id int,
	description varchar(255) DEFAULT '',
	PRIMARY KEY (id)
)ENGINE=InnoDB;


CREATE TABLE team_requests(
	id int NOT NULL AUTO_INCREMENT,
	team_id int,
	user_id int,
	PRIMARY KEY (id)
)ENGINE=InnoDB;

CREATE TABLE tournaments(
	id int NOT NULL AUTO_INCREMENT,
	name varchar(255) NOT NULL,
	date_created TIMESTAMP,
	number_of_players int, 		-- 4, 8, 16, 32, 64
	team_type int, 			-- 0 PvP, 1 Team 2v2, 2 Team 3v3, 3 Team 4v4
	register_fee int,
	description varchar(500),
	creator_id int,			-- False means that it was just created and true means the players were accepted and matches created
	referee_id int,
	tournament_start timestamp,
	created boolean,
	PRIMARY KEY (id)
)ENGINE=InnoDB;

CREATE TABLE tournament_registrations(
	id int NOT NULL AUTO_INCREMENT,
	id_match int,
	type bool,			-- NULL = Referee, FALSE(0) Team, TRUE(1) Player
	user_1 int DEFAULT NULL,	-- First player
	user_2 int DEFAULT NULL,	-- Second player
	team_1 int DEFAULT NULL,	-- First player
	team_2 int DEFAULT NULL,	-- Second player
	allowed bool DEFAULT FALSE,
	PRIMARY KEY (id)
)ENGINE=InnoDB;

CREATE TABLE matches(
	id int NOT NULL AUTO_INCREMENT,
	tournament_id int,		-- Id tournamentu
	team_user bool,			-- FALSE(0) means team, TRUE(1) means user
	user_1 int DEFAULT NULL,
	user_2 int DEFAULT NULL,
	team_1 int DEFAULT NULL,
	team_2 int DEFAULT NULL,
	tournament_row int,		-- Riadok
	tournament_column int,		-- Stlpec
	PRIMARY KEY (id)
)ENGINE=InnoDB;

CREATE TABLE match_events(
	id int NOT NULL AUTO_INCREMENT,
	match_id int,			-- ID zapasu
	team_id int DEFAULT NULL,	-- ID Teamu ktorý dal gol
	scorer_id int,			-- Id hraca ktory skoroval
	assister_id int DEFAULT NULL, 	-- ID hraca ktory assistoval
	PRIMARY KEY (id)
)ENGINE=InnoDB;

ALTER TABLE users ADD FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE teams ADD FOREIGN KEY (creator_id) REFERENCES users(id);

ALTER TABLE team_requests ADD FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE team_requests ADD FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE tournaments ADD FOREIGN KEY (creator_id) REFERENCES users(id);
ALTER TABLE tournaments ADD FOREIGN KEY (referee_id) REFERENCES users(id);

ALTER TABLE tournament_registrations ADD FOREIGN KEY (user_1) REFERENCES users(id);
ALTER TABLE tournament_registrations ADD FOREIGN KEY (user_2) REFERENCES users(id);
ALTER TABLE tournament_registrations ADD FOREIGN KEY (team_1) REFERENCES teams(id);
ALTER TABLE tournament_registrations ADD FOREIGN KEY (team_2) REFERENCES teams(id);

ALTER TABLE matches ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
ALTER TABLE matches ADD FOREIGN KEY (user_1) REFERENCES users(id);
ALTER TABLE matches ADD FOREIGN KEY (user_2) REFERENCES users(id);
ALTER TABLE matches ADD FOREIGN KEY (team_1) REFERENCES teams(id);
ALTER TABLE matches ADD FOREIGN KEY (team_2) REFERENCES teams(id);

ALTER TABLE match_events ADD FOREIGN KEY (match_id) REFERENCES matches(id);
ALTER TABLE match_events ADD FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE match_events ADD FOREIGN KEY (scorer_id) REFERENCES users(id);
ALTER TABLE match_events ADD FOREIGN KEY (assister_id) REFERENCES users(id);
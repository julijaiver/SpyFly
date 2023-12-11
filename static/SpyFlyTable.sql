#DATABASE PART FOR THE PROJECT:

create DATABASE spy_fly;
use spy_fly;
source #add your own flight_game path from your laptop
SET FOREIGN_KEY_CHECKS = 0;
drop TABLE game CASCADE;
drop TABLE goal CASCADE;
drop TABLE goal_reached;
SET FOREIGN_KEY_CHECKS = 1;

create table game (
id int auto_increment,
screen_name varchar(40) null,
location varchar(40),
battery_power int null,
score int null,
primary key (id),
foreign key (location) references airport(ident))
charset = latin1;

create table goal (
id int not null,
name varchar(10) not null,
points int not null,
probability int null,
primary key (id))
charset = latin1;

insert into goal (id, name, points, probability)
values (1, 'Sunny', 5, 24),
       (2, 'Cloudy', 10, 15),
	   (3, 'Suspicious', 15, 8),
	   (4, 'Caught', 0, 2);
		

create table spying_location (
id int auto_increment,
game int null,
goal int not null,
airport varchar(11) not null,
visited tinyint(1) default 0 null,
primary key (id),
foreign key (game) references game(id),
foreign key (goal) references goal(id),
foreign key (airport) references airport(ident));

#delete unnessary columns from the airport and country table:

ALTER TABLE airport
DROP COLUMN elevation_ft;

ALTER TABLE airport
DROP COLUMN iso_region;

ALTER TABLE airport
DROP COLUMN municipality;

ALTER TABLE airport
DROP COLUMN scheduled_service;

ALTER TABLE airport
DROP COLUMN gps_code;

ALTER TABLE airport
DROP COLUMN iata_code;

ALTER TABLE airport
DROP COLUMN local_code;

ALTER TABLE airport
DROP COLUMN home_link;

ALTER TABLE airport
DROP COLUMN wikipedia_link;

ALTER TABLE airport
DROP COLUMN keywords;

ALTER TABLE country
DROP COLUMN wikipedia_link;

ALTER TABLE country
DROP COLUMN keywords;

# QUERIES NEEDED FOR THE PROJECT, %s means variables

# RANDOMLY SELECT 50 AIRPORTS IN ONE CONTINENT. EXAMPLE: EU AIRPORTS:

select iso_country, ident, name, type, latitude_deg, longitude_deg
from airport 
where iso_country in(select iso_country from airport where continent = "EU")
and ident in(select min(ident) from airport where continent = "EU" 
and not type = "closed" group by iso_country)
order by rand()
limit 50;

#create new game 

insert into game (screen_name,location,battery_power,score) values (%s,%s,%s,%s);

#get data from goal table

select * from goal;

#insert data from the current game to spying_location table 
insert into spying_location(game, goal, airport) values(%s,%s,%s);

#get info about an airport with icao 
select country.name, ident, airport.name, latitude_deg, longitude_deg from airport,country where
airport.iso_country = country.iso_country and ident = %s;

#set the airport as visited when player has visited there in the spy_location table
update spying_location set visited = 1 where game = %s and airport = %s;

#update location,battery_power, and score in the game table
update game set location = %s, battery_power = %s,score = %s;

#under the suspicious circumstance,if the player choose to escape, deduct the 15 scores gained and set the airport as not visited
update game set score = %s;
update spying_location set visited = 0;



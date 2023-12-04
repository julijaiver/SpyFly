from continent import Continent
import config
import random
from airport import Airport

#Class for storing games
class Game:
    allGames=[]
    def __init__(self,location,battery,score,game_id,continent,player):
        self.location = location
        self.battery = battery
        self.score = score
        self.game_id = game_id

        if game_id is None:
            self.continent = Continent(continent)
            self.player = player
            self.location= self.continent.airports_in_game[0].ident
            self.airport_name = self.continent.airports_in_game[0].name
            self.longitude = self.continent.airports_in_game[0].longitude_deg
            self.latitude = self.continent.airports_in_game[0].latitude_deg
            self.battery=6000
            self.score=0
            self.game_id= new_game(self.player,self.location,self.continent.airports_in_game)
            Game.allGames.append(self)

    @classmethod
    def find_game_by_id(cls,game_id):
        for game in cls.allGames:
            if game.game_id == game_id:
                return game

    def update_game(self,location,battery,score):
        self.location=location
        self.battery=battery
        self.score=score
        airport_info= Airport.find_airport_info(location)
        self.airport_name=airport_info['name']
        self.latitude=airport_info['lat']
        self.longitude=airport_info['lon']
        airport_visited(self.game_id, self.location)
        location_update(self.location, self.battery, self.score, self.game_id)

    def return_data(self):
        data={
            'current_airport':self.location,
            'airport_name':self.airport_name,
            'game_id':self.game_id,
            'latitude':self.latitude,
            'longitude':self.longitude
        }
        return data


# new game
def new_game(player_name, current_airport, all_airports):
    sql = "insert into game(screen_name, location, battery_power, score) values (%s, %s , 6000, 0);"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql, (player_name, current_airport))
    game_id = cursor.lastrowid

    # Adding goals
    goals = get_goals()
    goal_list = []
    for goal in goals:
        for i in range(0, goal['probability'], 1):
            goal_list.append(goal['id'])

    # Excluding starting airport
    game_airport = all_airports[1:].copy()
    random.shuffle(game_airport)

    for i, goal_id in enumerate(goal_list):
        if i < len(game_airport):
            sql = "insert into spying_location (game, goal, airport) values (%s, %s, %s);"
            cursor = config.conn.cursor(dictionary=True)
            cursor.execute(sql, (game_id, goal_id, game_airport[i].ident))

    return game_id


# fetch goals
def get_goals():
    sql = "select * from goal;"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql)
    result = cursor.fetchall()
    return result

# Set airport as visited
def airport_visited(game, airport):
    sql = f"update spying_location set visited = 1 where game = %s and airport = %s;"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql, (game, airport))


# update location,battery_power,score
def location_update(icao, bat_power, score, id):
    sql = f"update game set location = %s, battery_power = %s, score = %s where id = %s;"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql, (icao, bat_power, score, id))

#fetch screen name with game id
def fetch_screen_name_by_id(id):
    sql = f"select screen_name from game where id= %s;"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql,(id,))
    result = cursor.fetchone()
    return result

#fetch continent with current location
def fetch_continent_by_id(location):
    sql = "select continent from airport where ident= '"+location+"';"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql)
    result = cursor.fetchone()
    return result
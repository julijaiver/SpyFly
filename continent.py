import config
from airport import Airport

#Continent class for storing continents and the selected 50 airports.
class Continent:
    def __init__(self,name):
        self.name = name
        self.airports_in_game= []
        for airport in get_airports(self.name):
            airport_info= Airport(airport['ident'])
            self.airports_in_game.append(airport_info)


# fetch airports from different continents
def get_airports(cont):
    sql = " select ident from airport where continent ='" + cont + "' and not type = 'closed' group by iso_country order by rand() limit 50; "
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql)
    result = cursor.fetchall()
    return result

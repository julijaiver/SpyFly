import config

#create class airport to store airports
class Airport:
    airports =[]
    def __init__(self,icao,data=None):
        self.ident=icao
        self.data=data

        if self.data is None:
            self.data=airport_info=get_airport_info(self.ident)
            if(len(airport_info)) == 1:
                self.name = airport_info[0]['name']
                self.latitude_deg = airport_info[0]['latitude_deg']
                self.longitude_deg = airport_info[0]['longitude_deg']
                Airport.airports.append(self)
        else:
            self.name= self.data['name']
            self.latitude_deg= float(self.data[0]['latitude_deg'])
            self.longitude_deg = float(self.data[0]['longitude_deg'])

    @classmethod
    def find_airport_info(cls,icao):
        for airport in cls.airports:
            if airport.ident == icao:
                airport_info ={'name':airport.name,'lat':airport.latitude_deg,'lon':airport.longitude_deg}
                return airport_info

# Get airport information
def get_airport_info(icao):
    sql = " select country.name, ident, airport.name, latitude_deg, longitude_deg from airport, country "
    sql += " where airport.iso_country = country.iso_country and ident = '" + icao + "'"
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql)
    result = cursor.fetchall()
    return result


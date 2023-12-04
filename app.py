import json
import config
import os

from dotenv import load_dotenv
import mysql.connector
from flask import Flask, redirect, url_for, request,render_template,jsonify
from flask_cors import CORS
from geopy import distance

import game
from airport import Airport


from game import Game
load_dotenv()

#setting flask application
app=Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

#connection to database
config.conn = mysql.connector.connect(
         host=os.environ.get('HOST'),
         port= 3306,
         database=os.environ.get('DB_NAME'),
         user=os.environ.get('DB_USER'),
         password=os.environ.get('DB_PASS'),
         autocommit=True
         )


def fly(location,game_id,battery,score,continent=None,player=None):
    # create game or update game information
    returnables = {}
    if(game_id is None):
        game = Game(location,battery,score,game_id,continent,player)
    else:
        game = Game.find_game_by_id(game_id)
        game.update_game(location,battery,score)

    achievable_airports = airports_in_range(game.location,game.continent.airports_in_game,game.battery,game.game_id)
    returnables = {"game":game.return_data(),"airports_in_range":achievable_airports}
    return returnables

# get airports in range:
def airports_in_range(icao, airports, remaining_battery,game_id):
    in_range = []
    for i, airport in enumerate(airports):
        if(i>=1):
            distance = airport_distance(icao, airport.ident)
            sql = (f"SELECT visited FROM spying_location WHERE game = %s AND airport = %s;")
            cursor = config.conn.cursor()
            cursor.execute(sql,(game_id,airport.ident))
            airport_visited = cursor.fetchone()
            if (distance <= remaining_battery and not distance == 0 and not airport_visited[0] == 1):
                in_range.append({'airport_data':airport.data, 'distance':distance})
    return in_range

# Distance between airports
def airport_distance(starting, end):
    start = Airport(starting)
    ending = Airport(end)
    start_coordinates = (start.latitude_deg, start.longitude_deg)
    end_coordinates = (ending.latitude_deg, ending.longitude_deg)

    return int(distance.distance(start_coordinates, end_coordinates).km)

# What goal is in the location
def location_goal(game_id, location):
    sql = (f"select spying_location.id, goal.id as goal, name, points from spying_location "
           f"inner join goal on goal.id = spying_location.goal where game = %s and airport = %s; ")
    cursor = config.conn.cursor(dictionary=True)
    cursor.execute(sql, (game_id, location))
    result = cursor.fetchone()
    return result

#create home page route
@app.route('/')
def home():
    return render_template('test2.html')


#create route for new game
@app.route('/newgame', methods=['GET','POST'])
def newgame():
    try:
        if request.is_json:
            data = request.get_json()
            continent= data.get('continent')
            player_name= data.get('player')
            gameStart = fly(None,None,None,None,continent,player_name)
            return jsonify(gameStart),200
        else:
            return jsonify({"error": "Invalid content type. Expected 'application/json'"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/checkgoal', methods=['GET','POST'])
def checkgoal():
    try:
        if request.is_json:
            data = request.get_json()
            destination= data.get('destination')
            game_id = data.get('game_id')
            goal= location_goal(game_id,destination)['goal']
            result={
                "goal":goal,
            }

            return jsonify(result),200
        else:
            return jsonify({"error": "Invalid content type. Expected 'application/json'"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/flyto', methods=['GET','POST'])
def flyto():
    try:
        if request.is_json:
            data = request.get_json()
            battery= data.get('battery')
            location = data.get('location')
            game_id=data.get('game_id')
            score = data.get('score')
            fly_to = fly(location, game_id, battery, score)
            return jsonify(fly_to),200
        else:
            return jsonify({"error": "Invalid content type. Expected 'application/json'"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000, debug=True)

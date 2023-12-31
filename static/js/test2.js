'use strict';

// global variables
let player_name;
let continent;
let airports_in_range;
let game_id;
let current_airport_icao;
let current_airport_info;
let current_airport_name;
let battery= 6000;
let score=0;
let gameOver = false;
let map;
const overlay = document.querySelector('.overlay');
const popup = document.querySelector('.popup');

rank();

//functions needed for the game.
//initialize the map.
function initializeMap() {
    //clear the existing markers on the map.
    if(map){
        map.eachLayer(layer =>{
            layer.remove();
        });
        map.off();
        map.remove();
    }

    //check if there is any airports in the range. If not, then game over is true.
    if(airports_in_range.length === 0){
        alert('Unfortunately you have insufficient battery to travel to another airport.')
        gameOver=true;
        endGame();
    }

    //adding markers to the map
    map = L.map('map').setView([current_airport_info.latitude, current_airport_info.longitude], 5);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20,
    }).addTo(map);

    let redMarker = L.icon({
        iconUrl: 'static/photos/roundMarker.png',
        iconSize: [50, 50],
        iconAnchor: [25, 20]
    });

    let greenMarker = L.icon({
        iconUrl: 'static/photos/marker2.png',
        iconSize: [50, 50],
        iconAnchor: [25, 20]
    });
        let marker;

        marker = L.marker([current_airport_info.latitude, current_airport_info.longitude], {icon: greenMarker}).addTo(map);
        marker.bindPopup(`You are here: <br>${current_airport_info.airport_name}</br>`);
        marker.openPopup();

        //iterates the airport and add them into the maps.
        for(let airport of airports_in_range){
            marker = L.marker([airport.airport_data[0]['latitude_deg'], airport.airport_data[0]['longitude_deg']], {icon: redMarker}).addTo(map);
            const popupContent = document.createElement('div');
            const h4 = document.createElement('h4');
            h4.innerHTML = `Name: ${airport.airport_data[0]['name']};`
            popupContent.append(h4);
            const p = document.createElement('p');
            p.innerHTML = `Distance: ${airport.distance.toFixed(2)} km`;
            popupContent.append(p);
            const flyButton = document.createElement('button');
            flyButton.classList.add('popup-button');
            flyButton.innerHTML = 'FLY';
            popupContent.append(flyButton);
            marker.bindPopup(popupContent);

            //check the goal of destination airport and fly to the airport.
            flyButton.addEventListener('click',async function(){
                await goal_check(airport);
                await flyto();
                initializeMap();
            })
        }

        // Function to close the popup
    function closeMarkerPopup() {
            if (!map.getBounds().contains(marker.getLatLng())) {
                marker.closePopup();
            }
    }

    // Event listeners for the marker and popup
    marker.on('mouseover', function () {
        marker.openPopup();
    });

    marker.on('mouseout', function () {
        closeMarkerPopup();
    });

    marker.getPopup().on('mouseout', function () {
        closeMarkerPopup();
    });
}

//function for showing the popup
function showPopup(id) {
    const popup = document.querySelector(`#${id}`);
    overlay.style.display = 'block';
    popup.style.display = 'block';
}
//function for closing the popup
function closePopup(id) {
    const popup = document.querySelector(`#${id}`);
    overlay.style.display = 'none';
    popup.style.display = 'none';
}
//update information on screen
function updateScreenInfo(){
    document.querySelector("#player_name").innerText = player_name;
    document.querySelector("#level").innerText = document.querySelector(`label[for=${continent}]`).innerText;
    document.querySelector("#airport_name").innerText = current_airport_name;
    document.querySelector("#icao_code").innerText = current_airport_icao;
    document.querySelector("#battery").innerText = battery.toFixed(2).toString();
    document.querySelector("#score").innerHTML = score.toString();
}

//create new game
async function newGame(){
        const data = {
        body: JSON.stringify({
            continent: continent,
            player: player_name
        }),
        method: 'POST',
        headers: {
              'Content-type': 'application/json',
        },
    }

    // send the data to flask
    try {
      const result = await fetchData('http://127.0.0.1:5000/newgame',data)
       airports_in_range = result.airports_in_range;
       game_id=result.game.game_id;
       current_airport_info=result.game;
       current_airport_icao=current_airport_info.current_airport;
       current_airport_name=current_airport_info.airport_name;

   } catch (e) {
      console.log('error', e);
   }
}

//function for returning dictionary format of airport_name, battery, and score.
function goal_outcome_return(airport_name,battery,score){
    return {'airport_name':airport_name,'battery':battery,'score':score};
}

//function for updating the info based on goals and return the goal outcome.
function goal_outcome(goal,airport_name,battery,score,distance){
    current_airport_name=airport_name;
    battery = battery-distance;
    if (goal === 1) {
        alert(`Weather seems to be clear and sunny in ${current_airport_name}. You get 5 points!`);
        score = score+5;
        return goal_outcome_return(current_airport_name,battery,score);
    } else if (goal === 2) {
        battery = battery-(distance*0.15);
        if(battery>=0){
            alert(`Weather seems to be cloudy in ${current_airport_name} You get 10 points but use 15% more battery`);
            score=score+10;
            return goal_outcome_return(current_airport_name,battery,score);
        }else {
            alert('You did not make it to the destination because of the bad weather.');
            battery = 0;
            current_airport_name="";
            gameOver = true;
            return goal_outcome_return(current_airport_name,battery,score);
        }
    } else if (goal === 3) {
        if (confirm(`${current_airport_name} seems suspicious. 
        Do you want to play a minigame with a possibility to gain points and extra battery power and risk getting caught?`)) {
            startQuiz();
            overlay.style.display = 'block';
            quizPopupContainer.style.display = 'block';
            return goal_outcome_return(current_airport_name,battery,score);
        } else {
            alert("You didn't risk getting caught but you spend battery travelling here.");
            return goal_outcome_return(current_airport_name,battery,score);
        }
    }else{
        showPopup('gotCaught');
        gameOver = true;
        //endGame();
    }
}

//async function for fetching data via url
async function fetchData (url,data) {
    const response = await fetch(url,data);
    if (!response.ok) throw new Error('Invalid server input');
    const json_result = await response.json();
    return json_result
}

//async function for retrieving player's name and hide popup.
async function nameFormSubmit(evt) {
    evt.preventDefault();
    player_name = document.querySelector('#playersName').value;
    //const nameDisplay = document.querySelector('#displayName');
    //nameDisplay.append(name);
    popup.style.display = 'none';
}

//async function for checking the goal in airport from the backend.
async function goal_check(airport){
    if(!airports_in_range){
        // gameOver = true;
        // endGame();
        await newGame();
    }
    const goal_data = {
    body: JSON.stringify({
    destination: airport.airport_data[0]['ident'],
    game_id:game_id
    }),
    method: 'POST',
    headers: {
        'Content-type': 'application/json'
    },
    }
    try {
        const result = await fetchData('http://127.0.0.1:5000/checkgoal', goal_data);
        const goal_in_airport = parseInt(result.goal);
        const goal_outcome_result = goal_outcome(goal_in_airport, airport.airport_data[0]['name'], battery, score, airport.distance);
        if (goal_outcome_result['airport_name'] === "") {
            current_airport_icao = "";
        }
        current_airport_icao = airport.airport_data[0]['ident'];
        battery = goal_outcome_result['battery'];
        score = goal_outcome_result['score'];
        updateScreenInfo();
    }catch (e) {
        console.log('error', e);
    }
}

//async function to flyto the destination airport and sending data to the backend and update sql.
async function flyto(){
    const data = {
                        body: JSON.stringify({
                            battery: battery,
                            location:current_airport_icao,
                            game_id:game_id,
                            score:score,
                        }),
                        method: 'POST',
                        headers: {
                            'Content-type': 'application/json',
                        },
                    }

                    // send the data to flask
                    try {
                  const result = await fetchData('http://127.0.0.1:5000/flyto',data)
                   airports_in_range = result.airports_in_range;
                   current_airport_info=result.game;
               } catch (e) {
                  console.log('error', e);
               }
}



//async function to retrieve rank info from sql.
async function rank(){
    try{
        const response = await fetch('http://127.0.0.1:5000/rank');
        if (!response.ok) throw new Error('Invalid server input');
        const json_result = await response.json();
        return json_result;
    } catch (e) {
        console.log('error', e);
    }
}

async function attachRank(){
      const topTen = await rank();
      for (let i=0; i<topTen.length; i++){
          let tableRow = document.createElement('tr');
          let tableData1 = document.createElement('td');
          let tableData2 = document.createElement('td');
          let tableData3 = document.createElement('td');
          tableData1.innerText = i+1;
          tableData2.innerText = topTen[i].screen_name;
          tableData3.innerText = topTen[i].score;
          tableRow.appendChild(tableData1);
          tableRow.appendChild(tableData2);
          tableRow.appendChild(tableData3);
          document.querySelector('#rankInfo').appendChild(tableRow);
      }
}

//using external API (Quiz game) for our project.
async function fetchQuizData() {
    const url = 'https://quiz26.p.rapidapi.com/questions';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '0bcfba0575msh265ffc8fae19293p1b0791jsn53f45254bb4c',
            'X-RapidAPI-Host': 'quiz26.p.rapidapi.com'
        }
    };

    try {
        return fetchData(url, options);
    } catch (error) {
        throw new Error(error);
    }
}

// getting random questions from the quiz API and created our own quiz styles
function displayRandQuestion() {
    if (quizData.length === 0) {
        console.log('No more questions.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * quizData.length);
    currentQuestionData = quizData[randomIndex];
    quizData.splice(randomIndex, 1); // Remove the selected question from the array

    const questionDiv = document.createElement('div');
    questionDiv.classList.add('popup-content');
    questionDiv.innerHTML = `<h3>${currentQuestionData.question}</h3>`;

    const options = Object.keys(currentQuestionData).filter(key => key !== 'question' && key !== 'answer');
    options.forEach(optionKey => {
        const optionLabel = document.createElement('label');
        const optionInput = document.createElement('input');
        optionInput.type = 'radio';
        optionInput.name = 'answer';
        optionInput.value = optionKey;

        optionLabel.appendChild(optionInput);
        optionLabel.appendChild(document.createTextNode(currentQuestionData[optionKey]));
        questionDiv.appendChild(optionLabel);
        questionDiv.appendChild(document.createElement('br'));
    });

    quizContent.innerHTML = ''; // Clears previous question
    quizContent.appendChild(questionDiv);
}

//make quiz popup visible and display quiz questions.
async function startQuiz() {
    try {
        quizData = await fetchQuizData();
        displayRandQuestion();
        quizPopupContainer.classList.add('visible'); // Adds 'visible' class to trigger animation
    } catch (error) {
        console.error(error);
    }
}


//function to check the answer and display consequent results based on wrong/correct answer.
function checkAnswers() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        const selectedValue = selectedAnswer.value;
        const correctAnswer = currentQuestionData.answer;

        if (selectedValue === correctAnswer) {
            alert('Congratulations! You get 15 points and battery power');
            overlay.style.display = 'none';
            quizPopupContainer.style.display = 'none';
            score += 15;
            battery += 500;
            flyto();
            updateScreenInfo();

        } else {
            overlay.style.display = 'none';
            quizPopupContainer.style.display = 'none';
            showPopup('gotCaught');
            gameOver = true;
            document.querySelector('#caughtButton').addEventListener('click', function() {
                endGame();
            })
        }
    } else {
        alert('Please select an answer.');
    }
}

//function for ending game and checking the score.
function endGame() {
    if (gameOver) {
        if (score >= 100) {
            document.querySelector('#successPoints').innerHTML = `You have ${score} points!`;
            //alert(`Game over. You have ${score} points. Your mission was successful!`);
            showPopup('missionSuccess');
            document.querySelector("#successButton").addEventListener('click',function(){
                location.reload();
            })
        } else {
            document.querySelector('#unsuccessPoints').innerHTML = `You have ${score} points! You need 100!`;
            //alert(`Game over. You have ${score} points. That's not enough for a successful mission. Try again!`);
            showPopup('missionNotSuccess');
            document.querySelector("#unsuccessButton").addEventListener('click',function(){
                location.reload();
            })
        }
    }
}

//main program starts here.

attachRank();
document.addEventListener('DOMContentLoaded', function () {
       showPopup('startPopContainer');
});

const nameForm = document.querySelector('#playerForm');
nameForm.addEventListener('submit', nameFormSubmit);

const submitNameButton = document.querySelector('#submitName');
submitNameButton.addEventListener('click', function () {
    showPopup('difficultyPopContainer');
})


//get continent
const submitDifficultyButton = document.querySelector('#submitContinent');


submitDifficultyButton.addEventListener('click', async function() {
    continent = document.querySelector('input[name="Difficulty"]:checked').id;
    await newGame();
    updateScreenInfo();
    closePopup('difficultyPopContainer');
    initializeMap();
});



//showPopup('missionSuccess');
//success button.eventlistener. when clicked game starts again (if points == leaderboard then show)

//showPopup('gotCaught');

const quizPopupContainer = document.querySelector('#quizPopup');
const quizContent = document.querySelector('#quizContent');
const submitButton = document.querySelector('#submitQuiz');
let quizData = []; // Holds the quiz data array
let currentQuestionData; // Holds the current question data
//later to be changed to different event

submitButton.addEventListener('click', function() {
    checkAnswers();
});

const startOverButton = document.querySelector('#caughtButton');
startOverButton.addEventListener('click', function () {
    closePopup('gotCaught');
    gameOver = true;
    endGame();
    // location.reload();
    // gameOver=false;
})

// --- Page Functions ---


// Switch display to game page
function switchGame() {
  let x = document.getElementById('game-page');
  let y = document.getElementById('about-page');
  let z = document.getElementById('leaderboard');

  x.style.display = 'flex';

  y.style.display = 'none';

  z.style.display = 'none';
}

// Switch display to about page
function switchAbout() {
  let x = document.getElementById('game-page');
  let y = document.getElementById('about-page');
  let z = document.getElementById('leaderboard');

  x.style.display = 'none';

  y.style.display = 'block';

  z.style.display = 'none';
}

// Switch display to leaderboard page
function switchTop() {
  let x = document.getElementById('game-page');
  let y = document.getElementById('about-page');
  let z = document.getElementById('leaderboard');


  x.style.display = 'none';

  y.style.display = 'none';

  z.style.display = 'block';
}
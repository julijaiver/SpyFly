'use strict';

// global variables
let player_name;
let continent;
let airports_in_range;
let game_id;
let current_airport;
let current_airport_info;
const overlay = document.querySelector('.overlay');
const popup = document.querySelector('.popup');
function initializeMap() {
    const map = L.map('map').setView([51.505, -0.09], 7);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20,
    }).addTo(map);

    const redMarker = L.icon({
        iconUrl: 'static/photos/roundMarker.png',
        iconSize: [50, 50],
        iconAnchor: [25, 20]
    });

    const greenMarker = L.icon({
        iconUrl: 'static/photos/marker2.png',
        iconSize: [50, 50],
        iconAnchor: [25, 20]
    });

    let active = false;
    let marker;

    if (active) {
        marker = L.marker([51.505, -0.09], {icon: greenMarker}).addTo(map);
        marker.bindPopup(`You are here: <br>//airport name</br>`);
        marker.openPopup();
    } else {
        marker = L.marker([51.505, -0.09], {icon: redMarker}).addTo(map);
        const popupContent = document.createElement('div');
        const h4 = document.createElement('h4');
        h4.innerHTML = `//airport name`;
        popupContent.append(h4);
        const p = document.createElement('p');
        p.innerHTML = `Distance: //range`;
        popupContent.append(p);
        const flyButton = document.createElement('button');
        flyButton.classList.add('popup-button');
        flyButton.innerHTML = 'FLY';
        popupContent.append(flyButton);
        marker.bindPopup(popupContent);
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

//Popup doesn't close when mouse goes off


// Need to set initial coordinates with database random loc.
//const map = L.map('map').setView([51.505, -0.09], 13);

function showPopup(id) {
    const popup = document.querySelector(`#${id}`);
    overlay.style.display = 'block';
    popup.style.display = 'block';
}
function closePopup(id) {
    const popup = document.querySelector(`#${id}`);
    overlay.style.display = 'none';
    popup.style.display = 'none';
}

async function nameFormSubmit(evt) {
    evt.preventDefault();
    player_name = document.querySelector('#playersName').value;
    //const nameDisplay = document.querySelector('#displayName');
    //nameDisplay.append(name);
    popup.style.display = 'none';


     //ajax to connect to flask
//     try {
//         await fetch('/name', {
//             method: 'POST',
//             headers: {
//             'Content-Type': 'application/json'
//         },
//             body: JSON.stringify({name: name})
//         })
//             .then(response => {
//                 if (response.ok) {
//                     overlay.style.display = 'none';
//                     const popup = document.querySelector('#startPopContainer');
//                     popup.style.display = 'none';
//                 } else {
//                     throw new Error('Submission failed.');
//                 }
//             })
//     } catch (error) {
//         alert('Error: ' + error.message);
//     }
 }


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
    console.log('data:',data);

    // send the data to flask
    try {
      const response = await fetch('http://127.0.0.1:5000/newgame', data);
      if (!response.ok) throw new Error('Invalid input!');
      const result = await response.json();
      console.log('result',result);
       airports_in_range = result.airports_in_range;
       game_id=result.game.game_id;
       current_airport_info=result.game
       console.log(game_id)
       console.log(current_airport_info)
       console.log(airports_in_range)

   } catch (e) {
      console.log('error', e);
   }
}
submitDifficultyButton.addEventListener('click', async function() {
    continent = document.querySelector('input[name="Difficulty"]:checked').id;
    await newGame();
    closePopup('difficultyPopContainer');
    initializeMap();
});




//showPopup('missionSuccess');
//success button.eventlistener. when clicked game starts again (if points == leaderboard then show)

//showPopup('gotCaught');

const quizButton = document.querySelector('#quizButton');
const quizPopupContainer = document.querySelector('#quizPopup');
const quizContent = document.querySelector('#quizContent');
const submitButton = document.querySelector('#submitQuiz');
let quizData = []; // Holds the quiz data array
let currentQuestionData; // Holds the current question data
//later to be changed to different event

async function fetchQuizData() {
    const url = 'https://quiz26.p.rapidapi.com/questions';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '009ecb696dmshe46f2fac8aecfccp1f6ec3jsnae92dcd0a865',
            'X-RapidAPI-Host': 'quiz26.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        throw new Error(error);
    }
}

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

async function startQuiz() {
    try {
        quizData = await fetchQuizData();
        displayRandQuestion();
        quizPopupContainer.classList.add('visible'); // Adds 'visible' class to trigger animation
    } catch (error) {
        console.error(error);
    }
}
quizButton.addEventListener('click', function() {
    startQuiz();
    overlay.style.display = 'block'; // Show the dark overlay
    quizPopupContainer.style.display = 'block'; // Show the popup window
});

function checkAnswers() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        const selectedValue = selectedAnswer.value;
        const correctAnswer = currentQuestionData.answer;

        if (selectedValue === correctAnswer) {
            alert('Congratulations! You get 15 points and battery power');
            //Adding points to the number on screen
            overlay.style.display = 'none';
            quizPopupContainer.style.display = 'none';
        } else {
            overlay.style.display = 'none';
            quizPopupContainer.style.display = 'none';
            showPopup('gotCaught');
        }
    } else {
        alert('Please select an answer.');
    }
}

submitButton.addEventListener('click', function() {
    checkAnswers();
});



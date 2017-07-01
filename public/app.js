const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
// const morgan = require('morgan');
const session = require('express-session');

var fileStream = require('fs');

const app = express();

app.engine('mustache', mustache());

app.set('views', './views');
app.set('view engine', 'mustache');

var imagepaths = [
  'hangman0.png',
  'hangman1.png',
  'hangman2.png',
  'hangman3.png',
  'hangman4.png',
  'hangman5.png',
  'hangman6.png',
  'hangman7.png',
  '131.png',
];
var word = [];
var words_hidden = [];
const words = fileStream.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

var random = Math.floor((Math.random() * (words.length - 1)));
var newWord = words[random];
console.log("newword is:", newWord); // new word to guess

var hidden_fields = {}; // array that stores hidden fields for new word to guess
var newWord_hidden = new Array(newWord.length); // array created based on length of new word to guess

for (var i = 0; i < newWord_hidden.length; i++) { // add _ for each letter to be guessed from new word
  newWord_hidden[i] = "_ ";
}
hidden_fields.hiddenWord = newWord_hidden;
hidden_fields.attemptedLetters = [];

app.use(express.static('public'));

app.use(express.static('/usr/share/dict/words'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "secret code",
  resave: false,
  saveUninitialized: true,
}))
app.use(expressValidator());
// app.use(morgan('common', { stream: fileStream.createWriteStream(`./logs/${new Date()}.log`)}));
var j = 0
var imagepath = imagepaths[j];

app.get('/', (request, response) => {
  request.session.newWord = newWord;
  request.session.hiddenWord = newWord_hidden;
  request.session.attemptedLetters = [];
  request.session.trials = 8;

  var renderModel = {
    hiddenWord: request.session.hiddenWord,
    attemptedLetters: request.session.attemptedLetters,
    trials: request.session.trials,
    imagepath: imagepath
  }
  // console.log('renderModel is: ',renderModel);
  response.render('index', renderModel);
});
// checks if the the letter provided  matches one or more of the letters in the word
app.post('/', (request, response) => {
  // console.log(request.session);
  var letter = request.body.letter; // the letter provided by the user
  letter = letter.toLowerCase();

  var hit = false;

  for (var i = 0; i < newWord.length; i++) {
    if (newWord[i] === letter) {
      request.session.hiddenWord[i] = letter;
      hit = true;
    }
  }
  if (hit == false) {
    request.session.attemptedLetters.push(letter);
    request.session.trials -= 1;
    j += 1;

  }
  var renderModel = {
    hiddenWord: request.session.hiddenWord,
    attemptedLetters: request.session.attemptedLetters,
    trials: request.session.trials,
    imagepath: imagepaths[j]

  }
  console.log(renderModel);

  var winner = true;
  for (var i = 0; i < request.session.hiddenWord.length; i++) {
    if (request.session.hiddenWord[i] === "_ ") {
      winner = false;
    }
  }
  if (winner) {
    var renderModel = {
      hiddenWord: request.session.hiddenWord,
      attemptedLetters: request.session.attemptedLetters,
      trials: request.session.trials,
      imagepath: '02.jpg'
    }
    response.render('index', renderModel);
  }

  //once you got 8 wrong letters, you lose
  if (request.session.trials === 0) {
    var renderModel = {
      hiddenWord: request.session.hiddenWord,
      attemptedLetters: request.session.attemptedLetters,
	  answer: 'The word was '+ newWord,
      trials: request.session.trials,
      imagepath: '131.jpg',
    }
    response.render('index', renderModel);
  }
  response.render('index', renderModel);
});
app.listen(3000);
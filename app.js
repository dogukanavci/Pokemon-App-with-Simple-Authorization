const express = require('express');
var app = express();
var ejs = require('ejs');
var bodyParser = require('body-parser');
const request=require('request');
const fs = require('fs');
var data = fs.readFileSync('credentials.json');
var cred = JSON.parse(data);
var pokeimg = require('pokemon-images');

//required if using body-parser
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('assets'));

app.get('/', function (req, res) {
	res.render('index',{signupmsg:null, loginmsg:null});
})

app.get('/login', function (req, res) {
	res.render('index',{signupmsg:null, loginmsg:null});
})

app.post('/login', function (req, res) {
	let username = req.body.usr;
	let password = req.body.psw;
  if (cred[username] !== password) {
    res.render('index',{signupmsg:null, loginmsg: "Password or username is incorrect"});
    return;
  }
	res.redirect('/app/' + username);
})

app.post('/', function (req, res) {
	let username = req.body.usr;
	let password = req.body.psw;
  let repeatedPassword = req.body.psw2;
  if (password !== repeatedPassword) {
    res.render('index',{signupmsg:"Passwords do not match", loginmsg: null});
    return;
  }
  if (cred[username] !== undefined) {
    res.render('index',{signupmsg:"Username exists", loginmsg: null});
    return;
  }
	cred[username] = password;
	var data = JSON.stringify(cred);
	fs.writeFile('credentials.json', data, finished);
	function finished(err) {
    /*
		console.log('added to the database')
		res.redirect('/app/' + username);
    */
    res.render('index',{signupmsg:"Account succesfully created. Please Login", loginmsg: null});
	}
})


//actual application
app.get('/app/:username', function(req, res){
    res.render('app',{data: null,imgurl: null,other: null, error: null, name: req.params.username})
});

app.post('/app/:username', function(req, res){
    var pokemon = req.body.pokemon.toLowerCase();
    let url = 'https://pokeapi.co/api/v2/pokemon-species/'+ pokemon +'/';
    request(url, function (err, response, body) {
    if(response.body == "Not Found"){
      res.render('app', {data: null,imgurl: null, other: null, error: 'You wrote an incorrect pokemon name', name: req.params.username});
    } else {
      let data;
      if (response.body != "Not Found") {
        data = JSON.parse(body);
      }
      else {
        res.render('app', {data: null,imgurl: null, other: null, error: 'You wrote an incorrect pokemon name', name: req.params.username});
      }
      let imgurl;
      try{
        imgurl = pokeimg.getSprite(pokemon);
      }
      catch(e){
        console.log(e);
        imgurl = 'http://placekitten.com/100/100';
      }
      let flavortexts = data.flavor_text_entries;
      let flavortext = '';
      for (let o of flavortexts) {
        if (o.language.name == "en") {
            flavortext += o.flavor_text;
        }
      }
      let color, evolvesfrom,habitat,growthrate,shape,dataText = '';
      if (data.color) {
        color = ' It is colored ' + data.color.name;
        dataText += color;
      }
      if (data.evolves_from_species) {
       evolvesfrom = '\n and it evolves from ' + data.evolves_from_species.name;
       dataText += evolvesfrom;
      }
      if (data.habitat) {
       habitat = '\n . Its habitat is ' + data.habitat.name;
       dataText += habitat;
      }
      if (data.growth_rate) {
       growthrate = '\n . Its growth rate is ' + data.growth_rate.name;
       dataText += growthrate;
      }
      if (data.shape) {
       shape = '\n . It is shaped like a ' + data.shape.name;
       dataText += shape;
      }
      res.render('app', {data: flavortext,imgurl: imgurl,other: dataText, error: null, name: req.params.username});
    }
  });
})

app.listen(3000, function(){
    console.log('app is running on port 3000')
})

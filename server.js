'use strict';
require('dotenv').config();
require('ejs');

const express = require('express');
const superagent = require('superagent');
const cors = require('cors')
const methodOverride = require('method-override')
const PORT = process.env.PORT || 3000;
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', getStarted);
app.post('/search', searchHero);
app.post('/favorite', addToFav);
app.get('/getData', getData);
app.get('/details/:id', getDetails);
app.delete('/delete/:id', deleteData);
app.put('/update/:id', updateData);

function getStarted(req, res) {
    res.render('./home');
}

function searchHero(req, res) {
    let herosArray = [];
    let key = process.env.SUPER_HERO_KEY;
    let name = req.body.search_character;
    name = name.replace(/\s/g, '%20');
    let url = `https://superheroapi.com/api/${key}/search/${name}`;
    superagent.get(url).then(heros => {
        //         console.log('blanlanlanlanaln', heros.body.results);
        if (heros.body.results) {

            heros.body.results.map(searchResults => {
                let heros = new Hero(searchResults);
                herosArray.push(heros);
                //   herosArray.sort((a, b) => {
                //           if (a.full_name.toLowerCase() < b.full_name.toLowerCase()) return -1;
                //           if (a.full_name.toLowerCase() > b.full_name.toLowerCase()) return 1;
                //           return herosArray;
                //       })
                herosArray.sort((a, b) => {
                        if (a.strength < b.strength) return -1;
                        if (a.strength > b.strength) return 1;
                        return herosArray;
                    })
                    //   console.log('newwwwwwwwwwwwwww', heros)
            })
            res.render('./search-results', { heroRising: herosArray });
        } else {
            res.render('./errors');
        }
    })

}

function addToFav(req, res) {
    let chId = req.body.idCharacter;
    //     console.log('amaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaar', chId)
    let sql = `SELECT * FROM hero WHERE idCharacter = $1;`
    let val = [chId];
    client.query(sql, val).then(check => {
        //         console.log('baaaaaaaaaaaaaaaaaaaaaaa', check.rows[0])
        if (check.rowCount > 0) {
            res.render('./database', { data: check.rows });
        } else {
            let {
                name,
                full_name,
                image,
                place_of_birth,
                work_occupation,
                idCharacter
            } = req.body;
            let SQL = `INSERT INTO hero (name,full_name,image,place_of_birth,work_occupation,idCharacter) VALUES ($1,$2,$3,$4,$5,$6);`;
            let safeValues = [name, full_name, image, place_of_birth, work_occupation, idCharacter];
            client.query(SQL, safeValues).then(() => {
                res.redirect('/getData');
            })
        }
    })
}

function getData(req, res) {
    let SQL = `SELECT * FROM hero;`
    client.query(SQL)

    .then(result => {
        res.render('./database', { data: result.rows })
    })
}

function getDetails(req, res) {
    let SQL = `SELECT * FROM hero WHERE id = $1;`;
    let val = [req.params.id];
    //     console.log('baaaaaaaaaaaaaaaaaaaaaaa', val)
    client.query(SQL, val).then(results => {
        //         console.log('baaaaaaaaaaaaaaaaaaaaaaa', results.rows[0])
        res.render('./details', { data: results.rows[0] })
    })
}

function deleteData(req, res) {
    let SQL = `DELETE FROM hero WHERE id = $1;`;
    let val = [req.params.id]
    client.query(SQL, val).then(() => {
        res.redirect('/getData');
    })
}

function updateData(req, res) {
    let {
        name,
        full_name,
        image,
        place_of_birth,
        work_occupation,
        idCharacter
    } = req.body;
    let idCh = req.params.id;
    //     console.log('asdadasdasddclds,cld,c', req.params.id)
    let SQL = `UPDATE hero SET name=$1,full_name=$2,image=$3,place_of_birth=$4,work_occupation=$5,idCharacter=$6 WHERE id=$7;`;
    let safeValues = [name, full_name, image, place_of_birth, work_occupation, idCharacter, idCh];
    client.query(SQL, safeValues).then(() => {
        res.redirect(`/details/${idCh}`);
    })
}



function Hero(data) {
    this.idCharacter = data.id;
    this.name = data.name;
    this.intelligence = data.powerstats.intelligence;
    this.strength = data.powerstats.strength;
    this.speed = data.powerstats.speed;
    this.durability = data.powerstats.durability;
    this.power = data.powerstats.power;
    this.combat = data.powerstats.combat;
    this.full_name = data.biography["full-name"];
    this.aliases = data.biography.aliases; //array
    this.place_of_birth = data.biography['place-of-birth'];
    this.first_apce = data.biography['first-appearance'];
    this.publisher = data.biography.publisher;
    this.appearance = data.appearance.gender;
    this.race = data.appearance.race;
    this.height = data.appearance.height; //array
    this.weight = data.appearance.weight; //array
    this.eye = data.appearance['eye-color'];
    this.hair = data.appearance['hair-color'];
    this.work_occupation = data.work.occupation;
    this.base = data.work.base;
    this.connections_group = data.connections['group-affiliation'];
    this.connections_relatives = data.connections.relatives;
    this.image = data.image.url;
}
app.use('*', (request, response) => {
    response.render('./errors');
})

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('in PORT' + PORT);
    })
})
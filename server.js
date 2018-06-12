const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    connectionString : 'process.env.DATABASE_URL',
    ssl: true
    // user : 'postgres',
    // password : 'cbit1234',
    // database : 'Face-Rec'
  } 
});

var bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send('App working...!');
})

app.post('/signin', (req, res) => {
	const{ email, password} = req.body;
	if(!email || !password){
		return res.status(400).json('Incorrect form submission')
	}
	db.select('email', 'hash').from('login').where('email', '=', email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if(isValid){
				return db.select('*').from('users')
					.where('email', '=', email)
					.then(user =>{
						res.json(user[0])
					})
					.catch(err => res.status(400).json('Unable to find user'))
			}else {
				res.status(400).json('Wrong credentials')
			}
		})
		.catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res) => {
	const {name, email, password} = req.body;
	if(!email || !name || !password){
		return res.status(400).json('Incorrect form submission')
	}
	var hash = bcrypt.hashSync(password, saltRounds);	
	db.transaction(trx =>{
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {	
			return trx('users')
			.returning('*')
			.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date
			})
			.then(user => {
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json("Unable to register"))
})

// app.get('/profile/:id', (req, res) => {
// 	const { id } = req.params;
// 	db.select('*').from('users').where({
// 		Id: id
// 	})
// 	.then(user => {
// 		if(user.length){
// 			res.json(user[0])
// 		}else{
// 			res.status(400).json('user not found')
// 		}
// 	})
// 	.catch.status(400).json('user not found')
// })

// app.put('/image', (req, res) => {
// 	const { id } = req.body;
// 	let found = false;
// 	database.users.forEach(user => {
// 		if(user.id === id){
// 			found = true;
// 			user.entries++
// 			return res.json(user.entries)
// 		}
// 	})
// 	if(!found){
// 		res.status(404).json('user not found')
// 	}
// })

app.listen(process.env.PORT || 3000, () => {
	console.log(`server running at port ${process.env.PORT}`)
})
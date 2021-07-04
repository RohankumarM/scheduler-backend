const express = require('express');
const mysql = require('mysql');

const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { query } = require('express');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

const db = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: '',
});

// db.connect((err) => {
//   if (err) {
//     throw err;
//   }
//   console.log("connected to db");
// });

app.post('/addBatch', (req, res) => {
  let name = req.body.name;
  let topic = req.body.topic;
  let batch = req.body.batch;
  let date = req.body.date;
  let startTime = req.body.startTime;
  let endTime = req.body.endTime;

  let batchCollision = false;

  if(name === null || topic === null || batch === null){
    throw new Error("Cannot be blank");
  }

  let sqlSelect = `SELECT * FROM teacherbatches WHERE Name='${name}'`;
  db.query(sqlSelect, (err, result) => {
    if (err) throw err;
    let data = Object.values(JSON.parse(JSON.stringify(result)));

    data.forEach(info => {
      let dt = `${new Date(info.Date).getFullYear()}-${('0' + (new Date(info.Date).getMonth() + 1)).slice(-2)}-${new Date(info.Date).getDate()}`;
      let startT = info.StartTime;
      let endT = info.EndTime;

      let verifyStartTime = new Date(`${dt} ${startT}`).toTimeString();
      let verifyEndTime = new Date(`${dt} ${endT}`).toTimeString();

      let newSTime = new Date(`${date} ${startTime}`).toTimeString();
      let newETime = new Date(`${date} ${endTime}`).toTimeString();

      if (dt === date && ((verifyStartTime < newSTime && newSTime < verifyEndTime) ||
        (verifyStartTime < newETime && newETime < verifyEndTime))) {
        batchCollision = true;
      } else {
        batchCollision = batchCollision || false;
      }
    });

    if (!batchCollision) {
      let addRecord = { name, topic, batch, date, startTime, endTime };

      let sql = 'INSERT INTO teacherbatches SET ?'
      let query = db.query(sql, addRecord, (err, result) => {
        if (err) throw err;
        let response = Object.values(JSON.parse(JSON.stringify(result)));
        res.send({ message: response[2] });
        res.status(201);
      });
    } else {
      res.send({ message: 'Batch collision occurred!' });
      res.status(400);
    }

  });
});

app.delete('/deleteBatch/:id', (req, res) => {
  let id = req.params.id;

  let sql = `DELETE FROM teacherbatches WHERE TID=${id}`;
  let query = db.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).send('Successfully deleted record');
  });
});

app.get('/getRecords?:date', (req, res) => {

  let receivedDate = req.query.date;
  let sql = `SELECT * FROM teacherbatches WHERE Date="${receivedDate}"`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    let response = Object.values(JSON.parse(JSON.stringify(result)));
    res.send(response);
    res.status(200);
  })
});

app.get('/getAllRecords', (req, res) => {

  let sql = "SELECT * FROM teacherbatches";
  db.query(sql, (err, result) => {
    if (err) throw err;
    let response = Object.values(JSON.parse(JSON.stringify(result)));
    res.send(response);
    res.status(200);
  })
});

const port  = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is listening on port 5000");
});

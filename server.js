require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})

const urlSchema = new mongoose.Schema({ url: String })
const UrlModel = mongoose.model('UrlModel', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  let urlResult;

  urlModel.findOne({
    url: req.body.url
  }, function(err, result) {
    if (err) console.error(err);
    urlResult = result.results;
  })

  if (urlResult !== null) {

    res.json({
      original_url: urlData.url,
      short_url: urlData._id
    })

  } else {

    const urlDoc = new urlModel()
    urlDoc.url = urlData.url

    urlDoc.save(function(err, result) {
      if (err) console.error(err);
      res.json({
        original_url: result.url,
        short_url: result._id
      })
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

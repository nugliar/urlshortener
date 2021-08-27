require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})

const urlSchema = new mongoose.Schema({
  url: String,
  cleanUrl: String,
  idx: Number
})
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

app.get('/api/clear', function(req, res) {
  UrlModel.remove({}, function(err, result) {
    if (err) return next(err);
    res.send('done')
  })
})

app.get('/api/shorturl/:id', function(req, res, cb) {
  UrlModel.findOne({
    idx: req.params.id
  }, function(err, result) {
    if (err) {
      return next(err);
    }
    if (result) {
      res.redirect(result.url);
    } else {
      return cb(new Error('No short URL found for the given input'));
    }
  })
})

app.post('/api/shorturl', function(req, res, cb) {
  let urlData;

  console.log(req.body.url);

  try {
    urlData = new URL(req.body.url)
    const protocol = urlData.protocol;

    if (!(protocol === 'http:' || protocol === 'https:')) {
      throw new Error();
    }
  } catch (err) {
    return cb(new Error('invalid url', {cause: err}));
  }

  const hostName = urlData.hostname || ''
  const pathName = urlData.pathname || ''
  const href = [hostName, ...pathName.split('/').filter(i => i)].join('/')

  dns.lookup(hostName, function(err) {
    if (err) {
      return cb(new Error('invalid url', {cause: err}));
    }

    UrlModel.estimatedDocumentCount(function(err, count) {
      if (err) return cb(err);

      UrlModel.findOne({
        cleanUrl: href
      }, function(err, result) {

        if (err) return cb(err);

        if (result) {
          res.json({
            original_url: result.url,
            short_url: result.idx
          })

        } else {

          const urlDoc = new UrlModel();
          urlDoc.url = req.body.url;
          urlDoc.cleanUrl = href;
          urlDoc.idx = count + 1;

          urlDoc.save(function(err, result) {

            if (err) return cb(err);

            res.json({
              original_url: result.url,
              short_url: count + 1
            })
          })
        }
      })
    })
  })
})

app.use(function(err, req, res, next) {

  if (err) {
    res
      .status(err.status || 500)
      .json({
        error: err.message || 'Server Error',
      })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

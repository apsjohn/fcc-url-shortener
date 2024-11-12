require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json());
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
const shortUrlObj = {};
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/', (req, res) => {
  let InputUrl = req.body.url;
  res.redirect('/api/shorturl/');
  res.json(storeUrl(InputUrl));
});

app.get('/api/shorturl/:surl', (req, res) => {
  let InputSurl = req.params.surl;
  if (!isNaN(InputSurl)) {
    res.json({error:    "Wrong format"});
    return;
  }

  let surl = shortUrlObj[InputSurl] || null;
  if (surl) {
    res.redirect(surl);
  } else {
    res.status(404).json({error: "No short URL found for the given input"});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

function storeUrl(url) {
  const pattern = /^(http:\/\/|https:\/\/)(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]+$/;
  if (!pattern.test(url)) {
    return { error: 'invalid url' };
  }

  shortUrlObj[Object.keys(shortUrlObj).length + 1] = url;
  return {original_url : url, short_url : Object.keys(shortUrlObj).length};
}


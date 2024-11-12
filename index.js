require('dotenv').config();

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in .env file");
}

const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// POST route to shorten URL
app.post('/api/shorturl', async (req, res) => {
  const inputUrl = req.body.url;

  try {
    const hostname = new URL(inputUrl).hostname;
    
    // Check if the hostname exists using DNS
    dns.lookup(hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      } else {
        try {
          // Check if the URL already exists in the database
          let doc = await Url.findOne({ original_url: inputUrl });
          if (doc) {
            res.json({ original_url: doc.original_url, short_url: doc.short_url });
          } else {
            // Get the current count to determine the new short URL
            const count = await Url.countDocuments({});
            const newUrl = new Url({ original_url: inputUrl, short_url: count + 1 });
            const savedDoc = await newUrl.save();
            res.json({ original_url: savedDoc.original_url, short_url: savedDoc.short_url });
          }
        } catch (dbError) {
          res.status(500).json({ error: 'Database error' });
        }
      }
    });
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }
});

// GET route to redirect to original URL
app.get('/api/shorturl/:surl', async (req, res) => {
  const shortUrl = parseInt(req.params.surl);

  try {
    const doc = await Url.findOne({ short_url: shortUrl });
    if (doc) {
      res.redirect(doc.original_url);
    } else {
      res.status(404).json({ error: "No short URL found for the given input" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
    origin: ['https://job-portal-97a97.web.app',
       'https://volunteer-servers.vercel.app',
       'https://b11a11-server-side-sarkerabid21.vercel.app'],
    credentials: true
}));


app.use(express.json());
// app.use(cookieParser());
app.use(cookieParser());

const loger = (req, res, next) => {
    console.log('inside the logger middleware')
    next();
}

const verifyToken = (req , res, next) =>{

    const token = req?.cookies.token;
    console.log('cookie in the middleware',token);
if(!token){
    return res.status(401).send({message: 'unauthorized access'})
}
jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) =>{
    if(err){
        return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded
     next();
    // console.log(decoded)
})
   
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gc9ahnr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    // await client.connect();

    const volunteerCollection = client.db('jobVolunteer').collection('volunteer');
const donationsCollection = client.db('jobVolunteer').collection('donations');

    // jwt token api
    
    app.post('/jwt', async(req, res) =>{

        const userData =req.body;
        const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {expiresIn: '1d'})

// set token
res.cookie('token', token, {
    httpOnly: true,
    secure: true,           
    sameSite: 'None'        
});

        res.send({success: true})

    })
    // volunteer api
   app.get('/volunteer', async (req, res) => {
  const email = req.query.email;
  const search = req.query.search;

  const query = {};

  if (email) {
    query.organizerEmail = email;
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' }; 
  }

  const cursor = volunteerCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

    app.delete('/volunteer/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await volunteerCollection.deleteOne(query);
  res.send(result);
});

// update
app.get('/volunteer/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await volunteerCollection.findOne(query);
  res.send(result);
});
app.put('/volunteer/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: updatedData,
  };
  const result = await volunteerCollection.updateOne(filter, updateDoc);
  res.send(result);
});




    app.post('/volunteer', async(req,res) =>{
        const newNeeds = req.body;
        console.log(newNeeds);
        const result = await volunteerCollection.insertOne(newNeeds);
        res.send(result);
    })





app.get('/volunteer/volunteer-posts/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await volunteerCollection.findOne(query);
  res.send(result);
});

// 
app.get('/myRequests', loger, verifyToken, async(req, res) => {
  console.log('Decoded:', req.decoded);
  console.log('Email query:', req.query.email);

  const email = req.query.email;

  if(email !== req.decoded.email){
    return res.status(403).send({ message: 'forbidden access' });
  }

  const query = { volunteerEmail: email };
  const result = await volunteerRequestsCollection.find(query).toArray();
  res.send(result);
});

app.delete('/myRequests/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  const result = await volunteerRequestsCollection.deleteOne(query);
  res.send(result);
});
// Get all donations
// Get all donations
app.get('/donations', async (req, res) => {
  try {
    const country = req.query.country;
    const query = country
      ? { country: { $regex: new RegExp(`^${country}$`, 'i') } }
      : {};

    const donations = await donationsCollection
      .find(query)
      .sort({ _id: -1 }) // নতুন ডাটা আগে দেখাবে
      .toArray();

    res.send(donations);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch donations' });
  }
});



const volunteerRequestsCollection = client.db('jobVolunteer').collection('volunteerRequests');


app.post('/volunteer/volunteer-requests', async (req, res) => {
  const data = req.body;


  const result = await volunteerRequestsCollection.insertOne(data);

  res.send({ success: true, message: 'Volunteer request submitted', insertedId: result.insertedId });
});
app.patch('/volunteer/volunteer-posts/:id', async (req, res) => {
  const id = req.params.id;

  const result = await volunteerCollection.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { volunteersNeeded: -1 } }
  );

  res.send(result);
});

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Volunteer.')
})

app.listen(port, () => {
  console.log(`Volunteer app listening on port ${port}`)
})
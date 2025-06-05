const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());



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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const volunteerCollection = client.db('jobVolunteer').collection('volunteer');
    // volunteer api
    app.get('/volunteer',async(req, res) =>{
        const cursor = volunteerCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    app.get('/volunteer/:id', async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await volunteerCollection.findOne(query);
        res.send(result);
    })
app.get('/volunteer/volunteer-posts/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await volunteerCollection.findOne(query);
  res.send(result);
});
app.delete('/myRequests/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await volunteerRequestsCollection.deleteOne(query);
  res.send(result);
});

// 
app.get('/myRequests', async(req, res) =>{
const email = req.query.email;

const query ={
volunteerEmail: email
}
const result = await volunteerRequestsCollection.find(query).toArray()
res.send(result);
})

const volunteerRequestsCollection = client.db('jobVolunteer').collection('volunteerRequests');

// Submit a new volunteer request
app.post('/volunteer/volunteer-requests', async (req, res) => {
  const data = req.body;

  // Insert request data into volunteerRequests collection
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

// 






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const SSLCommerzPayment = require('sslcommerz-lts');
const store_id = process.env.STORE_ID || 'works68f72bdcef703';
const store_passwd = process.env.STORE_PASS || 'works68f72bdcef703@ssl';
const is_live = process.env.SSL_MODE === 'live' ? true : false;

app.use(cors({
    origin: ['http://localhost:5174',
        'http://localhost:5179',
        'https://helpora-8741c8.netlify.app',
        'https://volunteer-server-blush.vercel.app',
        'https://job-portal-97a97.web.app',
        'https://volunteer-servers.vercel.app',
        'https://b11a11-server-side-sarkerabid21.vercel.app',],
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
// backend: server.js or app.js


    // Route: Get donations by country (case insensitive)
    // Route to get all donations (no filter)
    app.get('/donations', async (req, res) => {
      try {
        const donations = await donationsCollection.find({}).toArray();
        res.send(donations);
      } catch (err) {
        console.error('Error fetching donations:', err);
        res.status(500).send({ error: 'Failed to fetch donations' });
      }
    });


// যদি আপনি আগেরটা রাখতে চান তাহলে এটা রাখতে পারেন
// app.get('/donations', async (req, res) => {...});






const volunteerRequestsCollection = client.db('jobVolunteer').collection('volunteerRequests');


app.post('/volunteer/volunteer-requests', async (req, res) => {
  const data = req.body;


  const result = await volunteerRequestsCollection.insertOne(data);

  res.send({ success: true, message: 'Volunteer request submitted', insertedId: result.insertedId });
});
// ✅ Create Payment Session
app.post('/create-payment', async (req, res) => {
  const { donationId, amount, donorName, donorEmail } = req.body;

  const tran_id = new ObjectId().toString();

  const data = {
    total_amount: amount,
    currency: 'BDT',
    tran_id,
    success_url: 'https://helpora-8741c8.netlify.app/paymentsuccess', // React page
  fail_url: 'https://helpora-8741c8.netlify.app/paymentfailed',     // React page
  cancel_url: 'https://helpora-8741c8.netlify.app/paymentcancelled',
    ipn_url: 'https://helpora-8741c8.netlify.app/payment/ipn',
    shipping_method: 'NO',
    product_name: 'Donation Payment',
    product_category: 'Donation',
    product_profile: 'general',
    cus_name: donorName || 'Anonymous Donor',
    cus_email: donorEmail || 'anonymous@email.com',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: '01700000000',
    value_a: donationId,
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

  sslcz.init(data)
    .then(apiResponse => {
      if (apiResponse?.GatewayPageURL) {
        return res.send({ url: apiResponse.GatewayPageURL });
      } else {
        return res.status(400).send({ message: 'Failed to get payment URL' });
      }
    })
    .catch(err => {
      console.error('Payment init error:', err);
      res.status(500).send({ message: 'Payment initialization failed' });
    });
});


// ✅ Payment Success
app.post('/payment/success', async (req, res) => {
  console.log('✅ Payment Successful:', req.body);

  try {
    const donationId = req.body.value_a;
    const paidAmount = parseFloat(req.body.amount);

    // Update donation "raised" amount in MongoDB
    const updateResult = await donationsCollection.updateOne(
      { _id: new ObjectId(donationId) },
      { $inc: { raised: paidAmount } }
    );

    // Optional: save payment record
    await client.db('jobVolunteer').collection('payments').insertOne({
      donationId: new ObjectId(donationId),
      tran_id: req.body.tran_id,
      amount: paidAmount,
      donorName: req.body.cus_name,
      donorEmail: req.body.cus_email,
      status: 'Success',
      date: new Date(),
    });

    console.log('Donation updated & payment recorded:', updateResult);

    res.redirect('https://helpora-8741c8.netlify.app/paymentsuccess');
  } catch (error) {
    console.error('Error updating donation:', error);
    res.redirect('https://helpora-8741c8.netlify.app/paymentfailed');
  }
});


// ❌ Payment Failed
app.post('/payment/fail', async (req, res) => {
  console.log('❌ Payment Failed:', req.body);

  await client.db('jobVolunteer').collection('payments').insertOne({
    tran_id: req.body.tran_id,
    amount: req.body.amount,
    donorName: req.body.cus_name,
    donorEmail: req.body.cus_email,
    status: 'Failed',
    date: new Date(),
  });

  res.redirect('https://helpora-8741c8.netlify.app/paymentfailed');
});


// ⚠️ Payment Cancelled
app.post('/payment/cancel', async (req, res) => {
  console.log('⚠️ Payment Cancelled:', req.body);

  await client.db('jobVolunteer').collection('payments').insertOne({
    tran_id: req.body.tran_id,
    amount: req.body.amount,
    donorName: req.body.cus_name,
    donorEmail: req.body.cus_email,
    status: 'Cancelled',
    date: new Date(),
  });

  res.redirect('https://helpora-8741c8.netlify.app/paymentcancelled');
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
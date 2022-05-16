const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cbuwi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        console.log('MongoDB Connected');
        const servicesCollection = client.db('doctors-portal').collection('available-services')
        const bookingCollection = client.db('doctors-portal').collection('booking-info')

        app.get('/availableServices', async(req , res) => {
            const query = {};
            const cursor = servicesCollection.find(query)
            const availableServices = await cursor.toArray()
            res.send(availableServices)
        })
        app.post('/bookingInfo', async (req, res) => {
            const bookingInfo = req.body
            const result = await bookingCollection.insertOne(bookingInfo)
            res.send(result)
        })
    }
    finally {
        
    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Doctors Portal')
})

app.listen(port, (req, res) => {
    console.log('Listing to', port);
})
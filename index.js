const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cbuwi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// JWT TOKEN VERIFYING 
function jwtVerify(req, res, next) {
    const authorization = req.headers.authorization

    if (!authorization) {
        return res.status(401).send({message: 'UnAuthorize Access'})
    } else {
        const accessToken = authorization.split(" ")[1]
        jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            req.decoded = decoded
            console.log(decoded) 
            next()
          });
    }
}

async function run() {
    try {
        await client.connect()
        console.log('MongoDB Connected');

        const servicesCollection = client.db('doctors-portal').collection('available-services')
        const bookingCollection = client.db('doctors-portal').collection('booking-info')
        const userCollection = client.db('doctors-portal').collection('users')

        // load all available services
        app.get('/availableServices', async(req , res) => {
            const query = {};
            const cursor = servicesCollection.find(query)
            const availableServices = await cursor.toArray()
            res.send(availableServices)
        })

        // load booking services using email
        app.get('/booking', jwtVerify, async(req , res) => {
            const email = req.query.email;
            const query = { email: email }
            const decoded = req.decoded
            if (!decoded.email === email) {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            const cursor = bookingCollection.find(query)
            const result = await cursor.toArray()
            return res.send(result)
        })

        // store user appointment booking info
        app.post('/bookingInfo', async (req, res) => {
            const bookingInfo = req.body
            console.log(bookingInfo);
            const query = { treatmentName: bookingInfo.treatmentName, email: bookingInfo.email, date: bookingInfo.date }
            const booked = await bookingCollection.findOne(query)
            if (booked) {
                return res.send({booking : false, message: 'Already Booked By You', })
            }
            const result = await bookingCollection.insertOne(bookingInfo)
            return res.send({booking : true, result })
        })

        // Store User Info
        app.put('/user/:email', async(req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            
            res.send({result, token})

        })

        // load all user
        app.get('/users', async (req, res) => {
            // const query = {}
            const resutl = await userCollection.find().toArray()
            res.send(resutl)
        })

        // loading the all services
        // loading booking appointment using date
        app.get('/available', async(req, res) => {
            const date = req.query.date
            console.log(date);
            const availavleServices = await servicesCollection.find().toArray()
            const query = {date: date}
            const bookedAppointments = await bookingCollection.find(query).toArray() //booked by modal
            availavleServices.forEach(service => {
                // will be an array of 
                const filteredBookedAppointments = bookedAppointments.filter(appointment => appointment.treatmentName === service.name)
                const bookedSlots = filteredBookedAppointments.map(appointment => appointment.time)
                service.slots = service.slots.filter( slot => !bookedSlots.includes(slot))
            })
            
            res.send(availavleServices)
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
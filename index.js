const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'https://service-review-3d3f0.web.app', "https://service-review-3d3f0.firebaseapp.com"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const verify_TOKEN = (req, res, next) => {
  const token = req.cookies?.token; // Extract the token from cookies
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.secreact_token); // Verify token
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};




// MongoDB connection
const uri = `mongodb+srv://${process.env.user__name}:${process.env.password}@servicereview.1fy1i.mongodb.net/?retryWrites=true&w=majority&appName=Servicereview`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // client.connect();

    // Database and collections
    const database = client.db('service_review_system');
    const service_collections = database.collection('services');
    const User_collections = database.collection('Users');
    const review_collections = database.collection('reviews');

    // JWT authentication route
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.secreact_token, { expiresIn: '1h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Logout route
    app.post('/logout', async (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ logOUT_success: true });
    });

    // Add a new user
    app.post('/user', async (req, res) => {
      try {
        const new_user = req.body;
        const result = await User_collections.insertOne(new_user);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ message: 'Error adding user', error });
      }
    });

    // Fetch user data by email
    app.get('/user_data',verify_TOKEN, async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }
        const user = await User_collections.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error });
      }
    });

    // Add a new service
    app.put('/all_services',verify_TOKEN, async (req, res) => {
      try {
        const new_services = req.body;
        const result = await service_collections.insertOne(new_services);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ message: 'Error adding services', error });
      }
    });


    // Get all services
    app.get('/all_services', async (req, res) => { // Add async here
      try {
        const services = await service_collections.find().toArray();
        console.log(services);
        
        res.status(200).json(services);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching services', error });
      }
    });


    // Get service details by ID
    app.get('/service_details/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const service = await service_collections.findOne({ _id: new ObjectId(id) });
        if (!service) {
          return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching service details', error });
      }
    });

    // Add a review
    app.post('/reviews/:serviceId',verify_TOKEN, async (req, res) => {
      try {
        const reviewData = req.body.newReviewData;
        const result = await review_collections.insertOne(reviewData);
        res.status(201).json({ message: 'Review added successfully', result });
      } catch (error) {
        res.status(500).json({ message: 'Error adding review', error });
      }
    });

    // Get reviews by service ID
    app.get('/review', async (req, res) => {
      const { serviceId } = req.query;
      try {
        const reviews = await review_collections.find({ serviceId }).toArray();
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
      }
    });

    // Get reviews by email
    app.get('/review_email/:email', verify_TOKEN, async (req, res) => {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      try {
        const reviews = await review_collections.find({ email }).toArray();
        if (reviews.length === 0) {
          return res.status(404).json({ message: 'No reviews found for this email' });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
      }
    });

    // Update a review
    app.put('/reviews_change/:id',verify_TOKEN, async (req, res) => {
      const { id } = req.params;
      const { review, rating } = req.body;
      try {
        const result = await review_collections.updateOne(
          { _id: new ObjectId(id) },
          { $set: { newReview: review, rating } }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Review not found' });
        }
        res.status(200).send({ message: 'Review updated successfully', result });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update review', error });
      }
    });

    // Delete a review
    app.delete('/reviews_delete/:id',verify_TOKEN, async (req, res) => {
      const id = req.params.id;
      const result = await review_collections.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Fetch services by email
    app.get('/all_service/:email',verify_TOKEN, async (req, res) => {
      const { email } = req.params;
      console.log('te ',email);
      

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
        const reviews = await service_collections.find({ 'formData.email': email }).toArray();
        console.log('line 219',reviews);
        
        if (reviews.length === 0) {
          return res.status(404).json({ message: 'No services found for this email' });
        }
        res.status(200).json(reviews);
    });

    // Delete a service
    app.delete('/service_delete/:serviceId', async (req, res) => {
      const id = req.params.serviceId;
      const result = await service_collections.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update a service
    app.put('/service_change/:id', async (req, res) => {
      const { id } = req.params;
      const { serviceImage, serviceTitle, companyName, website, description, category, price } = req.body;
      try {
        const result = await service_collections.updateOne(
          { _id: new ObjectId(id) },
          { $set: { formData: { serviceImage, serviceTitle, companyName, website, description, category, price } } }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Service not found' });
        }
        res.status(200).send({ message: 'Service updated successfully', result });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update service', error });
      }
    });

  } finally {
    // Optionally close the client
  }
}

run();

app.get('/', (req, res) => {
  res.send('Service review app is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

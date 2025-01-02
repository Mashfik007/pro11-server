const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt=require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');

app.use(cors());
app.use(express.json());
app.use(cookieParser())

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
    await client.connect();
    const database = client.db('service_review_system');
    const service_collections = database.collection('services');
    const User_collections = database.collection('Users');
    const review_collections = database.collection('reviews'); // New collection for reviews

   app.post('/jwt',async(req,res)=>{
    const user=req.body;
    const token=jwt.sign(user,secreat,{expiresIn:'1h'});

   })






    app.post('/user', async (req, res) => {
      try {
        const new_user = req.body;
        const result = await User_collections.insertOne(new_user);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ message: 'Error adding services', error });
      }
    });


    app.get('/user_data', async (req, res) => {
      try {
        const { email } = req.query; // Extract email from query parameters
        console.log('Fetching user data for email:', email);
        
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }
    
        const user = await User_collections.findOne({ email }); // Find user by email
    
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json(user); // Send the found user as the response
      } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ message: 'Error retrieving user', error });
      }
    });
    















    // Add a new service
    app.put('/all_services', async (req, res) => {
      try {
        const new_services = req.body;
        const result = await service_collections.insertOne(new_services);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ message: 'Error adding services', error });
      }
    });



    // Get all services
    app.get('/all_services', async (req, res) => {
      try {
        const services = await service_collections.find().toArray();
        res.status(200).json(services);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching services', error });
      }
    });



    // Get details of a specific service by ID
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





    // Add a review to a specific service ID
    app.post('/reviews/:serviceId', async (req, res) => {
      try {
        const reviewData = req.body.newReviewData;
        console.log(reviewData);

        const result = await review_collections.insertOne(reviewData);
        res.status(201).json({ message: 'Review added successfully', result });
      } catch (error) {
        res.status(500).json({ message: 'Error adding review', error });
      }
    });




    // Get all reviews by service ID
    app.get('/review', async (req, res) => {
      const { serviceId } = req.query;
      console.log(serviceId);


      try {
        const reviews = await review_collections.find({ serviceId: serviceId }).toArray();
        res.status(200).json(reviews);

      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Error fetching reviews" });
      }
    });



    app.get('/review_email/:email', async (req, res) => {
      const { email } = req.params;
    
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
    
      try {
        const reviews = await review_collections.find({ email: email }).toArray();
        if (reviews.length === 0) {
          return res.status(404).json({ message: "No reviews found for this email" });
        }
        res.status(200).json(reviews);
      } catch (error) {
        console.error("Error fetching reviews by email:", error);
        res.status(500).json({ message: "Error fetching reviews" });
      }
    });


    app.put('/reviews_change/:id', async (req, res) => {
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
          console.error(error);
          res.status(500).send({ message: 'Failed to update review', error });
      }
  });



  //Delete 
  app.delete('/reviews_delete/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    
    const query = { _id: new ObjectId(id) }
    const result = await review_collections.deleteOne(query);
    res.send(result)

  })

  app.get('/all_service/:email', async (req, res) => {
    const { email } = req.params;
    console.log(email);
  
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
  
    try {
      const reviews = await service_collections.find({ "formData.email": email }).toArray();
      console.log(reviews);
  
      if (reviews.length === 0) {
        return res.status(404).json({ message: "No reviews found for this email" });
      }
      res.status(200).json(reviews);
    } catch (error) {
      console.error("Error fetching reviews by email:", error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });
  

  

  app.delete('/service_delete/:serviceId', async (req, res) => {
    const id = req.params.serviceId;
    
    const query = { _id: new ObjectId(id) }
    const result = await service_collections.deleteOne(query);
    res.send(result)

  })

  app.put('/service_change/:id', async (req, res) => {
    const { id } = req.params;
    const { serviceImage, serviceTitle, companyName, website, description, category, price } = req.body;
  
    try {
      const result = await service_collections.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            formData: {
              serviceImage,
              serviceTitle,
              companyName,
              website,
              description,
              category,
              price,
            },
          },
        }
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'Service not found' });
      }
  
      res.status(200).send({ message: 'Service updated successfully', result });
    } catch (error) {
      console.error("Update Error: ", error);
      res.status(500).send({ message: 'Failed to update service', error });
    }
  });
  
  



    
    



    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Uncomment if you need to close the connection at the end
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Service review app is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

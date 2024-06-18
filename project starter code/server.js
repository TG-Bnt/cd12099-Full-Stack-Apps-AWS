import express from 'express';
import bodyParser from 'body-parser';
import validator from 'validator';
import {filterImageFromURL, deleteLocalFiles} from './util/util.js';



  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async (req, res) => {
    console.log(`get /`)
    res.send("try GET /filteredimage?image_url={{}}")
  } );

  // Read an image from an URL, filter it and send it back
  app.get("/filteredimage", async (req, res) => {
    console.log(`get /filteredimage`);
  
    const { image_url } = req.query;
  
    const validation = validateImageUrl(image_url);
    if (!validation.isValid) {
      return res.status(400).send(validation.message);
    }
  
    const resourceCheck = await checkResourceExists(image_url);
    if (!resourceCheck.exists) {
      return res.status(404).send(resourceCheck.message);
    }
  
    try {
      const filteredpath = await filterImageFromURL(image_url);
      res.sendFile(filteredpath, () => deleteLocalFiles([filteredpath]));
    } catch (error) {
      console.error(error);
      return res.status(500).send('Unable to process the image');
    }
  });
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );

  
  const validateImageUrl = (image_url) => {
    if (!image_url) {
      return { isValid: false, message: 'image_url is required' };
    }
    if (!validator.isURL(image_url)) {
      return { isValid: false, message: 'image_url must be a valid URL' };
    }
    const validImageExtensions = ['jpg', 'png'];
    const extension = image_url.split('.').pop();
    if (!validImageExtensions.includes(extension)) {
      return { isValid: false, message: 'image_url must be an image URL with a valid extension (jpg, png)' };
    }
    return { isValid: true };
  };

  const checkResourceExists = async (image_url) => {
    const response = await fetch(image_url);
    if (!response.ok) {
      return { exists: false, message: 'image_url must be a valid image URL' };
    }
    return { exists: true };
  };
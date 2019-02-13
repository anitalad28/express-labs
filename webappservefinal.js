// 1. load express
var express = require("express");
// 1a. load the 'path' module. This will be used by "static" middleware
// of express. The 'path' is standard node module
var path = require("path");

// 1b. import the data-module
var dataModel = require("./datamodel");
// 1c. load the body-parser
var bodyParser = require("body-parser");

// 1d. load JSON web Token
var jwt = require("jsonwebtoken");

// 1e. loading mongoose driver
var mongoose = require("mongoose");

// 1f. set the global promise to manage all async calls
// made by application using mongoose driver
mongoose.Promise = global.Promise;
// 1g. load cors package
var cors = require("cors");

// 2. define an instance of express
var instance = express();

// 3. configure all middlewares, call "use()" method on express instance
// 3a. static files
instance.use(
  express.static(path.join(__dirname, "./../node_modules/jquery/dist/"))
);

// 3b. define express-router, for seggrigating
// urls for html page web requests and rest api requests
var router = express.Router();
// 3c. add the router object in the express middleware
instance.use(router);
// 3d. configure the body-parser middleware
// 3d.1 use urlencoded as false to read data from http url
// as querystring,formmodel etc.
instance.use(bodyParser.urlencoded({ extended: false }));
// 3d.2 use the json() parser for body-Parser
instance.use(bodyParser.json());

// 3e. configure cors() for the express
instance.use(cors());
// 4. create web request handlers
// 4a. This will return the home.html from views folder
router.get("/home", function(req, resp) {
  resp.sendFile("home.html", {
    root: path.join(__dirname, "./../views")
  });
});

// 5. Model-Schema-Mapping with collection on Mongo DB and
// establishing collection with it.'
mongoose.connect(
  "mongodb://localhost/ProductsAppDb",
  { useNewUrlParser: true }
);

// 5a. get the connection object
// if dbConnect is not undefined then the connection is successful
var dbConnect = mongoose.connection;
if (!dbConnect) {
  console.log("Sorry Connection is not established");
  return;
}

// 5b. define schema (recommended to have same
// attributes as per the collection)
var productsSchema = mongoose.Schema({
  ProductId: Number,
  ProductName: String,
  CategoryName: String,
  Manufacturer: String,
  Price: Number
});

// load the validate module
//var authLogic = require("./validate");

// 5c. map the schema with the collection
//                                name        schema          collection
var productModel = mongoose.model("Products", productsSchema, "Products");

// 5d. Define a user schema
var UsersSchema = mongoose.Schema({
    UserName: String,
    Password: String
});

// 5e. map the user schema with the collection
var userModel = mongoose.model("Users", UsersSchema, "Users");

// 6. create rest api request handlers
// 6a. Create a new user;
instance.post("/api/user/create", function(request, response) {
    var user = {
        UserName: request.body.username,
        Password: request.body.password
    };

    // pass the parsed object to "create()" method
    userModel.create(user, function(err, res) {
        if (err) {
            response.statusCode = 500;
            response.send({statusCode: response.statusCode, message:err});
        }
        response.send({ statusCode: 200, message: res });
    });
});

/*  region Login User anf generate token */
var jwtSettings = {
    jwtSecret: "dbcsbiobc0708hdfcyesbombob"
}

// set the secret with express object
instance.set("jwtSecret", jwtSettings.jwtSecret);

var tokenStore = "";

// Authenticate the user
instance.post("/api/user/auth", function(request, response) {
    var user = {
        UserName: request.body.Username,
        Password: request.body.Password
    };

    console.log("In authenticate user: " + JSON.stringify(user));

    // pass the parsed object to "create()" method
    userModel.findOne({ UserName: request.body.Username }, function(err, usr) {
        if (err) {
           console.log("Some error occurred");
           throw error;
        }
        if(!usr){
            response.send({
                statusCode: 404,
                message: "Sorry! User is not availabe"
            });
        } else if( usr ) {
            // If user is avilable but password do not match
            // send the error
            console.log("In else if " + JSON.stringify(usr));

            if( usr.Password != user.Password ) {
                response.send({
                    statusCode: 404,
                    message: "Sorry! Username and passsword do not match"
                }); 
            } else {
                var token = jwt.sign({ usr }, instance.get("jwtSecret"), {
                    expiresIn: 3600
                })

                //save token globally
                tokenStore = token;
                response.send({
                    authenticated: true,
                    message: "Login Success",
                    token: token
                }); 

            }
        }
    });
});

function authenticateUser( request, callback) {
     // Read request headers , headers contains bearer <token>
    var tokenReceived = request.headers.authorization.split(" ")[1];
    console.log('tokenReceived -- ' + tokenReceived  );

    jwt.verify( tokenReceived, instance.get("jwtSecret"), function( err, decoded ){
        console.log("In verify call back function");
        if(err){
            console.log("In Auth Error");        
            callback( err, "");
        } else {
            console.log("In Auth success");
            // Decode the request
            request.decoded = decoded;
            callback( null, true);      
        }
    });  
}

// Verify the token and provide the access
instance.get("/api/products", function(request, response) {  
    authenticateUser( request, function( err, result ) {
        if(err){
             response.send({
                success: false,
                message: "Token verification failed after callback"
            });
        } else if( result ) {            
            productModel.find().exec(function(err, res) {
                if (err) {
                response.statusCode = 500;
                response.send({ status: response.statusCode, error: err });
                }
                response.send({ status: 200, data: res });
            });
        }
    }) 
});

instance.post("/api/products", function(request, response) {
    
    authenticateUser( request, function( err, result ) {
        if(err){
             response.send({
                success: false,
                message: "Token verification failed after callback"
            });
        } else if ( result ) {
            // parsing posted data into JSON
            var prd = {
                ProductId: request.body.ProductId,
                ProductName: request.body.ProductName,
                CategoryName: request.body.CategoryName,
                Manufacturer: request.body.Manufacturer,
                Price: request.body.Price
            };
            
            // pass the parsed object to "create()" method
            productModel.create(prd, function(err, res) {
                if (err) {
                    response.statusCode = 500;
                    response.send(err);
                }
                response.send({ status: 200, data: res });
            });
        }
    })  
});

instance.get("/api/products/:id", function(request, response) {
    authenticateUser( request, function( err, result ) {
        if(err){
             response.send({
                success: false,
                message: "Token verification failed after callback"
            });
        } else if ( result ) {
            // use "params" property of request object to read
            // url parameter

            var RequestId = request.params.id; 
            productModel.find(RequestId, function(err, res) {
                if (err) {
                response.statusCode = 500;
                response.send(err);
                }
                response.send({ status: 200, data: res });
            });
        }
    })  
});

instance.put("/api/products/:id", function(request, response) {
    authenticateUser( request, function( err, result ) {
        if(err){
             response.send({
                success: false,
                message: "Token verification failed after callback"
            });
        } else if ( result ) {
            // read the request id parameter
            // read the body
            // update matched record from array
            // respond array

            var RequestId = request.params.id;
            var postData = JSON.stringify( request.body);
            // console.log("request.body" + postData);
            productModel.update({ ProductId: RequestId },{ $set: postData }, function(err, res) {
                if (err) {
                    response.statusCode = 500;
                    response.send(err);
                } 
                
                response.send({ status: 200, data: res });
            
            });
        }
    })   
});

instance.delete("/api/products/:id", function(request, response) {
    authenticateUser( request, function( err, result ) {
        if(err){
             response.send({
                success: false,
                message: "Token verification failed after callback"
            });
        } else if ( result ) {
            // read the request id parameter
            // delete matched record array
            // respond array
            var id = request.params.id;            
            productModel.deleteOne({_id:id}, function(err, res) {
                if (err) {
                    response.statusCode = 500;
                    response.send(err);
                }
                response.send({ status: 200, data: res });
            });
        }
    });     
});

// 6. start listening
instance.listen(4070, function() {
  console.log("started listening on port 4070");
});
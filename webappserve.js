// 1. load express
var express = require("express");
// 1a. load the path module. This will be use by staitic middleware of express.
// Path is standard node module.
var path = require("path")

// 1b. Import the data module
var dataModel = require("./datamodel");

//1c. load the body parser
var bodyParser = require("body-parser");

// 1d. Loading moogoose driver
var mongoose = require('mongoose'); 

// 1f. load CORS package
var cors = require('cors');

// 1E. Set the the global promise to manage all async calls
// made by application made by mongoose
mongoose.Promise = global.Promise;

// 2. Define and instance of express
var instance =  express();

// 3. Configure all middlwares, call use methods on express instances
// 3a. Static files
instance.use(express.static(path.join(__dirname, "./../node_modules/jquery/dist/")));

//3b. Define express-router, for seggrigating
//urls for html page web requests and res api requests.
var router = express.Router();

//3c. add the router object in the express middleware
instance.use(router);

//3d. configure the body parser middleware
// 3d.1 use urlended as fasle to read data from htto url 
// as querystringmodel, formmodel etc
instance.use(bodyParser.urlencoded({ extended: false }));

//3d.2 use json parser for body parser
instance.use(bodyParser.json());

// 3e. Configure CORS for the express
//instance.use(cors({origin:"urls","url"}));
instance.use(cors);// everything is allowed

// 4. Create web reques handerls. Requset for resources that is HTML file.
//instance.get("/home", function( request, respose) {
router.get("/home", function( request, respose ) {
    respose.sendFile("home.html",{
        root: path.join(__dirname, "./views")
    }, function( error ){
        console.log("Resource not found:" + error);
    });
});

// 5. Model-schema-Mapping with collection on MongoDB and 
// establishing connection with it
mongoose.connect(
    "mongodb://localhost/ProductsAppDb",
    { useNewUrlParser: true }
);

//5a. get the connection object
// if dbConnect is not undefined then the connection is succssful
var dbConnect = mongoose.connection;

if(!dbConnect){
    console.log("Sorry connection is not established");
    return;
}

//5b. define schema( recommend to have same sttributes as per the collection)
var productsSchema = mongoose.Schema({
    ProductId:String,
    ProductName:String,
    CategoryName:String,
    Manufacturer:String,
    Price:Number
});

// 5C. Map the schema with the collection
//                                 Friendlyname Schema name    Collection name
var productModel = mongoose.model("Products", productsSchema, "Products");

// 6. Create REST API request handlers
instance.get("/api/products", function(request, response){
    // 6a. Make call to database for collection mapped wit model
    // expects all documents from it.
    productModel.find().exec(function(err,res){
        // 6b. if error occurred then respond the error
        if(err){
            response.statusCode = 500;
            response.send({
                status: response.statusCode,
                error: err
            });
        }
        response.send({
            status: 200,
            data: res
        });
    });
});

instance.post("/api/products", function(request, response){
    // Parsing posted data in JSON.    
    var newProduct = {
        ProductId: request.body.ProductId,
        ProductName: request.body.ProductName,
        CategoryName: request.body.CategoryName,
        Manufacturer: request.body.Manufacturer,
        Price: request.body.Price,
    };

    // Pass the parsed object to create method
    productModel.create( newProduct, function (err, addedProduct){
        if(err){
            response.statusCode = 500;
            response.send({
                status: response.statusCode,
                error: err
            });
        }

        response.send({
            status:200,
            data:addedProduct
        });
    });
    
});

instance.get("/api/products/:id", function(request, respose) {
    
});

instance.put("/api/products/:id",function(request, response){
    
});

instance.delete("/api/products/:id",function(request, response){
    
});
// 7. start listening
instance.listen(4070, function(){
    console.log("Server is running on localhost:4070")
});
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
    {useNewUrlPArser: true }
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
var productsModel = mongoose.model("Products", productsSchema, "Products");

// 6. Create REST API request handlers
instance.get("/api/products", function(request, respose){
    //5a. read headers for the ANTHORIZATION values
    var authValues = request.headers.authorization;
    console.log(authValues);

    // 5b. Process values
    var creadentials = authValues.split(' ')[1];
    console.log(creadentials);
    var data = creadentials.split(':');
    var username = data[0];
    var password = data[1];
   
    console.log(username + password);
    // 5c. Access from database
    if(username == "mahesh" && password == "mahesh"){
        //respose.send(JSON.stringify(dataModel.getData()));
        respose.send(JSON.stringify(dataModel.getData())); // response.send send data to the body
    } else {
        respose.statusCode  = 401;
                respose.send( {status: respose.statusCode,
                     message: 'Unauthorized access'
        }); // response.send send data to the body
    }   
});

instance.post("api/products", function(request, response){
    var data = request.body; // Readt the request body
    console.log(data);
    var responseData = dataModel.addData(data);
    response.send( JSON.stringify(responseData) );
});

instance.get("/api/products/:id", function(request, respose) {
     var id = request.params.id; // read the header
    console.log("Received id = " + id );

    var record = dataModel.getData().filter(function(v,idx){
        return  v.id == id;
    });
});

instance.put("/api/products/:id",function(request, response){
    //read the request id parameter
    //read the body
    //update matched record from array
    //responsed array
    var data = request.body; //Read the request body.
    var id = request.params.id;
    console.log(data);
    console.log('Received id='+id);
    var record = dataModel.updateData(id, data);
    console.log('Updated data:'+JSON.stringify(record))
    response.send(JSON.stringify(record));
});

instance.delete("/api/products/:id",function(request, response){
    //read the request id parameter
    //read the body
    //delete matched record array
    //responsed array
    var id = request.params.id;

    console.log('Received id='+id);
    var record = dataModel.deleteData(id);
    response.send(JSON.stringify(record));

});
// 7. start listening
instance.listen(4070, function(){
    console.log("Server is running on localhost:4070")
});
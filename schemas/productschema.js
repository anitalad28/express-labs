// 1d. loading mongoose driver
var mongoose = require("mongoose");

// attributes as per the collection)
module.exports = {
    pSchema: mongoose.Schema({
        ProductId: Number,
        ProductName: String,
        CategoryName: String,
        Manufacturer: String,
        Price: Number
      })
}

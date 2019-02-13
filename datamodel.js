// We are createing custom node module
var  Products = [
    { id:101,name:"p1"},
    { id:102,name:"p2"}
];

module.exports = {
    getData: function(){
        return Products;
    },
    addData: function( prd ){
        Products.push(prd);
        return Products;
    },
    updateData:function(id,prod){
        for(var r of Products){
            
            if(id == r.id){
                r.id = prod.id;
                r.name = prod.name;
            }
        }
        return Products;
    },
    deleteData:function(id){
        
        var cnt = 0;
        for(var r of Products){
            
            if(id == r.id){
                Products.splice(cnt,1);
            }
            cnt++;
        }
        return Products;
    }
};
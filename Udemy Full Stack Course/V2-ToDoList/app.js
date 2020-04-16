//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true , useUnifiedTopology: true } )

const itemsSchema = new mongoose.Schema(
  {
    name : String
  })

const Item = mongoose.model('Item',itemsSchema);

const listSchema = new mongoose.Schema(
  {
    name: String,
    items : [itemsSchema]
  }
)

const List = mongoose.model("List",listSchema);

const defaultItems = [ { name : "Welcome to my todolist!" },
{ name: "Hit the + icon to add items to list"}, { name: "Check the checkbox to delete item from list"}
]

app.get("/", function(req, res) {


//const day = date.getDate();
  Item.find(function(err,foundItems){
    if (foundItems.length===0){
       console.log("List is empty, inserting default items...");
        Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err)
        }
        else{
          res.render("list", {listTitle: "Today", newListItems: defaultItems});
        }
      })
    }
    else{
       res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
})

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list  ;
  console.log(listName);
  const item = new Item(
    {
    name:itemName
  })
  if (listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName},function(err,foundList){
      if (!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      }
    })
  }


});

app.post("/delete",function(req,res){
  const id = req.body.checkbox
  const listName = req.body.listName

  if (listName==="Today"){
    Item.findByIdAndDelete(id,function(err){
      if(!err){
        console.log("Deleted record");
        res.redirect("/");
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, { $pull: {items: { _id: id}}}, function(err){
      if (!err){
        console.log("Deleted checked item");
        res.redirect("/"+listName);
      }
    })
  }

})

app.get("/:customListItem", function(req,res){
  const customListName = _.capitalize(req.params.customListItem);
  List.findOne({name: customListName}, function(err, foundList)
  {
    if (!err){
      if(!foundList){
        console.log("No list exists")
        const list = new List( {
          name: customListName,
          items : defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      }
      else{
          res.render("list",{listTitle: customListName, newListItems: foundList.items  })

      }
    }

  })

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

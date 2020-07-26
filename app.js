//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Bucky:Test-123@cluster0-h6xjp.mongodb.net/todolistDB",{useNewUrlParser: true});

const itemsSchema = ({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item",itemsSchema);


const item1 = new Item({
  name: "Welcome to your to-dolist!"
});

const item2 = new Item({
  name: "Go to work!"
});

const item3 = new Item({
  name: "Hit submit to submit!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema)


app.get("/", function(req, res) {



  Item.find({},function(err,results){
   
      if(results.length == 0)
      {
        Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("sucessfully executed and added default items to list");
        }

        });
        res.redirect("/");
      }else{
      res.render("list", {listTitle: "Today", newListItems: results});

      }
      
    
  });

});

app.get("/:customList", function(req,res){
  const customListName = _.capitalize(req.params.customList);

  List.findOne({name: customListName},function(err,foundList){
    if(err){
      console.log(err);
    }else{
      if(foundList){
        console.log("found");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

      }else{
        console.log("not found");
        const list =new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }
    }
  });
  
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });
  //item.save();
  //res.redirect("/");
  if(listName == "Today")
  {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  // }
});

app.post("/delete", function(req, res) {

  // const itemName = req.body.
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today") {
    Item.findByIdAndDelete(checkedItemId,function(err){
    if(err){
      console.log(err);
    }else{
      console.log("delete was successful");
      res.redirect("/");
    }
  })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull :{items: {_id: checkedItemId}}}, function(err,foundList ){
      if(!err){
        res,res.redirect("/" + listName);
      }
    });
  }
  
});







app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
//app.listen(port);

app.listen(port, function() {
  console.log("Server started sucessfuly on port ");
});

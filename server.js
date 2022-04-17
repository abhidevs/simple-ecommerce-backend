const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const errorController = require("./controllers/error");
const sequelize = require("./util/db");
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const Cartitem = require("./models/cartitem");
const Order = require("./models/order");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const Orderitem = require("./models/orderitem");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: Cartitem });
Product.belongsToMany(Cart, { through: Cartitem });
User.hasMany(Order);
Order.belongsTo(User);
Order.belongsToMany(Product, { through: Orderitem });
Product.belongsToMany(Order, { through: Orderitem });

sequelize
  .sync()
  .then(() => app.listen(3000))
  .catch((err) => console.log(err));

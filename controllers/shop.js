const Product = require("../models/product");
const Cart = require("../models/cart");
const Cartitem = require("../models/cartitem");

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.count()
    .then((total) => {
      totalItems = total;
      return Product.findAll({
        offset: (page - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
      });
    })
    .then((products) => {
      // res.render("shop/product-list", {
      //   prods: products,
      //   pageTitle: "All Products",
      //   path: "/products",
      // });

      res.json({
        products: products,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        nextPage: page + 1,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts();
    })
    .then((products) => {
      // res.render("shop/cart", {
      //   path: "/cart",
      //   pageTitle: "Your Cart",
      //   products: products,
      // });

      res.json({ products });
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQty = 1;

  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId } });
    })
    .then((products) => {
      let product;
      if (products.length > 0) product = products[0];

      if (product) {
        const oldQty = product.cartitem.quantity;
        newQty = oldQty + 1;
        return product;
      } else {
        return Product.findByPk(prodId);
      }
    })
    .then((product) =>
      fetchedCart.addProduct(product, { through: { quantity: newQty } })
    )
    .then(() => fetchedCart.getProducts({ where: { id: prodId } }))
    .then(([product]) => res.json(product))
    .catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .getCart()
    .then((cart) => cart.getProducts({ where: { id: prodId } }))
    .then((products) => {
      const product = products[0];
      return product.cartitem.destroy();
    })
    .then(() => res.redirect("/cart"))
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  // res.render("shop/orders", {
  //   path: "/orders",
  //   pageTitle: "Your Orders",
  // });

  req.user
    .getOrders({ order: [["createdAt", "DESC"]] })
    .then((orders) => Promise.all(orders.map((o) => o.getProducts())))
    .then(([...items]) => {
      let allItems = items.reduce((all, curr) => (all = [...all, ...curr]));
      res.json(allItems);
    })
    .catch((err) => console.log(err));
};

exports.postOrders = (req, res, next) => {
  let fetchedCart;
  let items;
  let currOrder;
  const user = req.user;

  user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then((products) => {
      if (products.length === 0) throw Error("Cart is empty!");
      items = products;
      return user.createOrder();
    })
    .then((order) => {
      items.forEach((item) => {
        order.addProduct(item, {
          through: { quantity: item.cartitem.quantity },
        });
      });
      return order;
    })
    .then((order) => {
      currOrder = order;
      return Cartitem.destroy({ where: { cartId: fetchedCart.id } });
    })
    .then(() => res.json({ orderId: currOrder.id, success: true }))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: err.message, success: false });
    });
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/checkout", {
    path: "/checkout",
    pageTitle: "Checkout",
  });
};

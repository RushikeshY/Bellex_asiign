require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bycrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Register = require("./model/register.model");
const Order = require("./model/oder.model");
const Role = require("./model/role.model");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const connectionparams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

app.post("/role", async (req, res) => {
  try {

    const { name } = req.body;
    const existRole = await Role.findOne({ name });
    if (existRole) {
      return res.status(400).send({
        success: false,
        message: `Role with ${name} is already present`,
      });
    }

    if (name !== "user" && name !== "admin") {
      return res.status(400).send({
        success: false,
        message: `Role ${name} is invalid`,
      });
    }

    const role = await Role.create({
      name: name,
    });

    return res.status(201).send({
      success: true,
      message: "Role created successfully",
      id: role._id,
    });
  } catch (error) {
    return res.send(error);
  }
});

app.get("/", (req, res) => {
  res.end("Homepage");
});

app.post("/signup", async (req, res) => {
  try {
    let { username, password, role } = req.body;

    if (username.length >= 10 || username.length < 4) {
      return res.status(400).send({
        success: false,
        message: `username must be with charector between 3 to 10`,
      });
    }

    if (password.length > 14 || password.length < 9) {
      return res.status(400).send({
        success: false,
        message: `password must be with charector between 8 to 15`,
      });
    } else if (/[a-z]/.test(password) == false) {
      return res.status(400).send({
        success: false,
        message: `password must be should have atleast one lower case letter `,
      });
    } else if (/[A-Z]/.test(password) == false) {
      return res.status(400).send({
        success: false,
        message: `password must be should have atleast one upper case letter`,
      });
    } else if (/[0-9]/.test(password) == false) {
      return res.status(400).send({
        success: false,
        message: `password must be should have atleast one numeric charector`,
      });
    }

    const existRole = await Role.findOne({ name: role });
    let role1;

    if (role === "user") {
      role1 = existRole._id;
    } else if (role === "admin") {
      role1 = existRole._id;
    } else {
      res.send("enter valid role");
    }

    if (!(username && password && role)) {
      res.status(400).send("All feilds are required");
    }

    const existuser = await Register.findOne({ username });
    if (existuser) {
      return res.status(400).send({
        success: false,
        message: `Username ${username} is already present`,
      });
    }

    const myencpassword = await bycrypt.hash(password, 10);

    const user = await Register.create({
      username: username,
      password: myencpassword,
      role: role1,
    });

    return res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.end("Some Error Occured", error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      return res.send("Please fill all fields");
    }

    const user = await Register.findOne({ username });
    console.log(user);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Username/Password is invalid",
      });
    }
    console.log(user.password);

    if (username && (await bycrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {
          user_id: user._id,
          username,
          role: user.role,
        },
        process.env.SECRET,
        {
          expiresIn: "2d",
        }
      );
      user.token = token;
      user.password = undefined;
      return res.status(200).send({ success: true, token: token });
    }

    return res.status(400).send({
      success: false,
      message: "Username/Password is invalid",
    });
  } catch (error) {
    console.log(error);
    res.end("error occured");
  }
});

// LOGOUT
app.post("/logout", async (req, res) => {
  try {
    const { token } = req.headers;
    const user = await Register.findOne({ token: token });
    console.log("user:", user);
    if (user) {
      user.token = "";
      await user.save();
      res.status(200).json({ message: "logout successfully" });
    } else {
      res.status(400).json({ error: "invalid token" });
    }
  } catch (err) {
    console.log(err);
  }
});

const authentication = async (req, res, next) => {
  if (!req.headers) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }
  const user_token = req.headers.authorization.split(" ")[1];
  let username;
  jwt.verify(user_token, process.env.SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
    // console.log(decoded);

    username = decoded.username;
    req.body.username = username;

    // console.log(username)
    next();
  });
};

const authrization = async (req, res, next) => {
  const { username } = req.body;
  console.log(username);
  const user = await Register.findOne({ username });
  console.log(user); // admin

  const userRole = await Role.findOne({ _id: user.role });
  console.log(userRole);

  if (userRole.name !== "admin") {
    return res.status(402).send({
      success: false,
      message: `Forbidden`,
    });
  } else {
    // console.log("aaaaa");
    next();
  }
};

app.post("/order", async (req, res) => {
  try {
    const { product_name, product_price, quantity } = req.body;

    if (product_name.length >= 10 || product_name.length < 4) {
      return res.status(400).send({
        success: false,
        message: `product_name must be with charector between 3 to 10`,
      });
    }

    if (product_price < 100 || product_price > 1000) {
      return res.status(400).send({
        success: false,
        message: `product_price must be value in range between 100 to 1000`,
      });
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).send({
        success: false,
        message: `quantity must be value in range between 1 to 10`,
      });
    }

    const { authorization } = req.headers;

    console.log(authorization);

    const token = authorization.split(" ")[1];

    const userDetails = jwt.verify(token, process.env.SECRET);
    console.log("jwt is ", userDetails);

    console.log(userDetails.user_id);

    const order = await Order.create({
      order_id: uuidv4(),
      product_name,
      product_price,
      quantity,
      user_id: userDetails.uid,
      status: "new",
      username: userDetails.username,
    });

    return res.status(201).send({
      success: true,
      message: `Order with ${order._id} created successfully`,
    });
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];

    const userDetails = jwt.verify(token, process.env.SECRET);
    console.log("jwt is ", userDetails);

    const userOrderDetail = await Order.find(
      { username: userDetails.username },
      { username: 0 }
    );

    // console.log("userOrderDetail ", userOrderDetail);

    return res.status(200).send({
      userOrderDetail,
    });
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: `Unauthorized`,
    });
  }
});

app.get("/admin/orders", authentication, authrization, async (req, res) => {
  try {
    const role = await Role.findOne({ name: "user" });
    const user = await Register.find({ role: role.id });

    // console.log(user);

    const data = await Order.find({});
    const obj = {};

    user.map((elem) => {
      obj[elem.username] = [];
    });

    data.map((elem) => {
      console.log(elem);

      obj[elem.username].push({
        order_id: elem.order_id,
        product_name: elem.product_name,
        product_price: elem.product_price,
        quantity: elem.quantity,
        status: elem.status,
      });
    });

    return res.status(200).send({ obj });
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }
});

app.put(
  "/admin/orders/:order_id",
  authentication,
  authrization,
  async (req, res) => {
    try {
      const { order_id } = req.params;
      const { status, product_name, product_price, quantity, username } =
        req.body;

      const order = await Order.findOne({ order_id: order_id });
      console.log(order);
      if (order == null) {
        return res.status(404).send({
          success: false,
          message: `Order ${order_id} not found`,
        });
      }

      if (order.status !== "new") {
        return res.status(400).send({
          success: false,
          message: `Order status ${order.status} is invalid`,
        });
      }

      const updatedorder = await Order.updateOne(
        { order_id },
        {
          order_id,
          product_name,
          product_price,
          quantity,
          status: status,
          username,
        }
      );

      return res.status(200).send({
        status: status,
        updatedorder,
      });
    } catch (error) {
      // console.log(error);
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  }
);

app.get(
  "/admin/orders/summary",
  authentication,
  authrization,
  async (req, res) => {
    try {
      const role = await Role.findOne({ name: "user" });
      const user = await Register.find({ role: role.id });
      const data = await Order.find({});
      let obj = {};

      user.map((elem) => {
        obj[elem.username] = [];
      });

      data.map((elem) => {
        obj[elem.username].push(elem.product_price * elem.quantity);
      });

      Object.keys(obj).forEach((key) => {
        obj[key] = obj[key].reduce((acc, curr) => {
          return acc + curr;
        }, 0);
      });

      return res.status(200).send({
        obj,
      });
    } catch (error) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  }
);

mongoose
  .connect(
    "mongodb+srv://bellex_assign:bellex_assign@cluster0.qh6dk65.mongodb.net/?retryWrites=true&w=majority",
    connectionparams
  )
  .then(() => {
    console.log("conneted to db");
  })
  .catch((err) => {
    console.log(err);
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, (req, res) => {
  console.log(`server started successfully on http://localhost:${PORT}/`);
});


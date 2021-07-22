const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function bodyValidation(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  let message = "";
  if (!dishes) {
    message = "Order must include a dish";
  }
  if (!Array.isArray(dishes) || !dishes.length) {
    message = "Order must include at least one dish";
  }
  if (!mobileNumber || !mobileNumber.length) {
    message = "Order must include a mobileNumber";
  }
  if (!deliverTo || !deliverTo.length) {
    message = "Order must include a deliverTo";
  }
  if (message.length) {
    next({
      status: 400,
      message: message,
    });
  }
  res.locals.body = req.body.data;
  return next();
}

const dishValidation = (req, res, next) => {
  const dishes = res.locals.body.dishes;
  let message = "";
  dishes.forEach((dish, index) => {
    let { quantity } = dish;
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      message = `Dish ${index} must have a quantity that is an integer greater than 0`;
    }
  });
  if (message.length) {
    next({
      status: 400,
      message: message,
    });
  }
  next();
};

function orderUpdateValidation(req, res, next) {
  const acceptedStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  const { id, status } = res.locals.body;
  let message = "";
  if (!!status && status === "delivered") {
    message = "A delivered order cannot be changed";
  }
  if (
    !status ||
    !status.length ||
    !acceptedStatuses.some((acceptedStatus) => acceptedStatus === status)
  ) {
    message =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  }
  if (!!id && res.locals.order.id !== id) {
    message = `Order id does not match route id. Order: ${id}, Route: ${res.locals.order.id}`;
  }
  if (message.length) {
    next({
      status: 400,
      message: message,
    });
  }
  res.locals.body.id = res.locals.order.id;
  next();
}

function deleteValidation(req, res, next) {
  const { status } = res.locals.order;
  if (!!status && status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function create(req, res) {
  const newOrder = {
    ...res.locals.body,
    id: nextId(),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.send({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const data = req.body.data;
  if (order !== data) {
    const orderKeys = Object.keys(order);
    orderKeys.forEach((key) => {
      order[key] = data[key];
    });
  }
  res.json({ data: order });
}

function destroy(req, res) {
  const { id } = res.locals.order;
  const index = orders.findIndex((order) => order.id === id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res) {
  res.send({
    data: orders,
  });
}

module.exports = {
  create: [bodyValidation, dishValidation, create],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyValidation,
    dishValidation,
    orderUpdateValidation,
    update,
  ],
  delete: [orderExists, deleteValidation, destroy],
  list,
};

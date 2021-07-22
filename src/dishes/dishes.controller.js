const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyValidation(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  let message = "";
  if (!image_url || !image_url.length) {
    message = "Dish must include a image_url";
  }
  if (price <= 0 || !Number.isInteger(price)) {
    message = "Dish must have a price that is an integer greater than 0";
  }
  if (!price) {
    message = "Dish must include a price";
  }
  if (!description || !description.length) {
    message = "Dish must include a description";
  }
  if (!name || !name.length) {
    message = "Dish must include a name";
  }
  if (message.length) {
    next({
      status: 400,
      message: message,
    });
  }
  res.locals.body = { id, name, description, price, image_url };
  return next();
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function dishBodyMatches(req, res, next) {
  if (!res.locals.body.id || res.locals.dish.id === res.locals.body.id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${res.locals.body.id}, Route: ${res.locals.dish.id}`,
  });
}

function create(req, res) {
  const newDish = {
    ...res.locals.body,
    id: nextId(),
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.send({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const data = req.body.data;
  if (dish !== data) {
    dish.name = data.name;
    dish.description = data.description;
    dish.price = data.price;
    dish.image_url = data.image_url;
  }
  res.json({ data: dish });
}

function list(req, res) {
  res.send({
    data: dishes,
  });
}

module.exports = {
  create: [bodyValidation, create],
  read: [dishExists, read],
  update: [dishExists, bodyValidation, dishBodyMatches, update],
  list,
};

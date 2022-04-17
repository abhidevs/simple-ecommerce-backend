const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");

const Orderitem = sequelize.define("orderitem", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  quantity: DataTypes.INTEGER,
});

module.exports = Orderitem;

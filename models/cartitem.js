const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");

const Cartitem = sequelize.define("cartitem", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  quantity: DataTypes.INTEGER,
});

module.exports = Cartitem;

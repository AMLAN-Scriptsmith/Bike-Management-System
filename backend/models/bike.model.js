const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Bike = sequelize.define(
    "Bike",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      number_plate: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      brand: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
    },
    {
      tableName: "bikes",
      updatedAt: false,
    }
  );

  return Bike;
};

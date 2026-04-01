const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SparePart = sequelize.define(
    "SparePart",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "spare_parts",
      updatedAt: false,
    }
  );

  return SparePart;
};

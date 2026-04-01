const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PartsUsage = sequelize.define(
    "PartsUsage",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      part_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
    },
    {
      tableName: "parts_usage",
      updatedAt: false,
    }
  );

  return PartsUsage;
};

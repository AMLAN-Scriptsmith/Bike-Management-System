const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ServiceCenter = sequelize.define(
    "ServiceCenter",
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
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      admin_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    },
    {
      tableName: "service_centers",
      updatedAt: false,
    }
  );

  return ServiceCenter;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TechnicianUpdate = sequelize.define(
    "TechnicianUpdate",
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
      technician_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      photo_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "technician_updates",
      updatedAt: false,
    }
  );

  return TechnicianUpdate;
};

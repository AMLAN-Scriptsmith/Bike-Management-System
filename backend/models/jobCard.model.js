const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const JobCard = sequelize.define(
    "JobCard",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      bike_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      service_center_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Assigned", "In Progress", "Waiting for Parts", "Completed"),
        allowNull: false,
        defaultValue: "Pending",
      },
      assigned_to: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: "job_cards",
    }
  );

  return JobCard;
};

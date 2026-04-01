const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const JobService = sequelize.define(
    "JobService",
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
      service_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
        allowNull: false,
        defaultValue: "Pending",
      },
    },
    {
      tableName: "job_services",
      updatedAt: false,
    }
  );

  return JobService;
};

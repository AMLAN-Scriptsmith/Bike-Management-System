const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Feedback = sequelize.define(
    "Feedback",
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
      job_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "feedback",
      updatedAt: false,
    }
  );

  return Feedback;
};

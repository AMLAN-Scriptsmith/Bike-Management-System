const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      payment_status: {
        type: DataTypes.ENUM("Pending", "Paid", "Failed", "Refunded"),
        allowNull: false,
        defaultValue: "Pending",
      },
      payment_method: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
    },
    {
      tableName: "invoices",
      updatedAt: false,
    }
  );

  return Invoice;
};

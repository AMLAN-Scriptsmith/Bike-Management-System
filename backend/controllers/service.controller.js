const db = require("../models");
const { success, failure } = require("../utils/apiResponse");

const listServices = async (req, res) => {
  try {
    const services = await db.Service.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name", "price", "description"],
    });

    return success(res, "Services fetched", { rows: services });
  } catch (error) {
    return failure(res, "Could not fetch services", 500, [error.message]);
  }
};

module.exports = {
  listServices,
};

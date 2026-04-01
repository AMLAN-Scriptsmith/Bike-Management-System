const { Op } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { getPagination, getPagingData } = require("../utils/pagination");

const upsertPart = async (req, res) => {
  try {
    const { id, name, stock, price } = req.body;

    if (id) {
      const part = await db.SparePart.findByPk(id);
      if (!part) {
        return failure(res, "Part not found", 404);
      }

      part.name = name ?? part.name;
      part.stock = typeof stock === "number" ? stock : part.stock;
      part.price = typeof price === "number" ? price : part.price;
      await part.save();

      return success(res, "Part updated", { part });
    }

    const part = await db.SparePart.create({ name, stock, price });
    return success(res, "Part created", { part }, 201);
  } catch (error) {
    return failure(res, "Could not create/update part", 500, [error.message]);
  }
};

const listParts = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const parts = await db.SparePart.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return success(res, "Parts fetched", getPagingData(parts.count, parts.rows, page, limit));
  } catch (error) {
    return failure(res, "Could not fetch parts", 500, [error.message]);
  }
};

const allocatePartToJob = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { jobId } = req.params;
    const { partId, quantity } = req.body;

    const job = await db.JobCard.findByPk(jobId, { transaction });
    if (!job) {
      await transaction.rollback();
      return failure(res, "Job not found", 404);
    }

    const part = await db.SparePart.findByPk(partId, { transaction, lock: true });
    if (!part) {
      await transaction.rollback();
      return failure(res, "Part not found", 404);
    }

    if (part.stock < quantity) {
      await transaction.rollback();
      return failure(res, "Insufficient stock", 400);
    }

    part.stock -= quantity;
    await part.save({ transaction });

    const usage = await db.PartsUsage.create(
      {
        job_id: job.id,
        part_id: part.id,
        quantity,
      },
      { transaction }
    );

    await transaction.commit();
    return success(res, "Part allocated to job", { usage, remainingStock: part.stock });
  } catch (error) {
    await transaction.rollback();
    return failure(res, "Could not allocate part", 500, [error.message]);
  }
};

module.exports = {
  upsertPart,
  listParts,
  allocatePartToJob,
};

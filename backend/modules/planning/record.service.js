const { fail, record } = require('./validation');
const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
function serialize(row) {
  const value = row.toJSON();
  return {
    ...parse(value.data),
    id: value.id,
    external: parse(value.external),
    syncState: value.syncState,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
module.exports = function createService(Model, kind) {
  const find = async (ownerId, id) => {
    const row = await Model.findOne({ where: { ownerId, id } });
    if (!row) throw fail('Record not found', 404);
    return row;
  };
  return {
    async list(ownerId, { page, limit }) {
      const { rows, count } = await Model.findAndCountAll({
        where: { ownerId },
        order: [
          ['createdAt', 'ASC'],
          ['id', 'ASC'],
        ],
        limit,
        offset: (page - 1) * limit,
      });
      return { items: rows.map(serialize), total: count, page, limit };
    },
    async get(ownerId, id) {
      return serialize(await find(ownerId, id));
    },
    async create(ownerId, input) {
      return serialize(
        await Model.create({
          ownerId,
          data: record(kind, input),
          external: null,
          syncState: 'local',
          version: 1,
        }),
      );
    },
    async update(ownerId, id, input, version) {
      const row = await find(ownerId, id);
      const data = record(kind, { ...parse(row.data), ...input });
      const [count] = await Model.update(
        { data, version: version + 1, syncState: row.external ? 'pending' : 'local' },
        { where: { ownerId, id, version } },
      );
      if (!count) throw fail('Record changed. Refresh and try again.', 409);
      return serialize(await find(ownerId, id));
    },
    async remove(ownerId, id, version) {
      const row = await find(ownerId, id);
      // Keep a tombstone for eventual provider deletion/reconciliation.
      const [count] = await Model.update(
        {
          deletedAt: new Date(),
          version: version + 1,
          syncState: row.external ? 'pending_delete' : 'local',
        },
        { where: { ownerId, id, version } },
      );
      if (!count) throw fail('Record changed. Refresh and try again.', 409);
    },
  };
};

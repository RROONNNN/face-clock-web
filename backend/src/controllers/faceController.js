const FaceData = require('../models/FaceData');
const ACCOUNT_ROLES = require('../constants/accountRoleEnums');

exports.updateFace = async (req, res) => {
  try {
    const { listFaceEmbedding = [], imageUrl = null } = req.body;

    const doc = await FaceData.findOneAndUpdate(
      { employeeId: req.params.empId },
      {
        $set: {
          listFaceEmbedding,
          imageUrl,
          updatedTime: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.syncFaceData = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.list || [];
    const providedMap = new Map();

    for (const item of payload) {
      if (!item.employeeId) continue;
      providedMap.set(String(item.employeeId), item);

      const existing = await FaceData.findOne({ employeeId: item.employeeId });
      if (!existing) {
        await FaceData.create({
          employeeId: item.employeeId,
          listFaceEmbedding: item.listFaceEmbedding || [],
          imageUrl: item.imageUrl || null,
          updatedTime: item.updatedTime ? new Date(item.updatedTime) : new Date(),
        });
        continue;
      }

      const incomingUpdated = item.updatedTime ? new Date(item.updatedTime) : new Date(0);
      if (incomingUpdated > existing.updatedTime) {
        existing.listFaceEmbedding = item.listFaceEmbedding || existing.listFaceEmbedding;
        existing.imageUrl = item.imageUrl || existing.imageUrl;
        existing.updatedTime = incomingUpdated;
        await existing.save();
      }
    }

    if (req.user?.role !== ACCOUNT_ROLES.ADMIN) {
      return res.json({ success: true, data: [] });
    }

    const all = await FaceData.find();
    const data = all.filter((doc) => {
      const key = String(doc.employeeId);
      if (!providedMap.has(key)) return true;
      const incoming = providedMap.get(key);
      const incomingUpdated = incoming?.updatedTime ? new Date(incoming.updatedTime) : new Date(0);
      return doc.updatedTime > incomingUpdated;
    });

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.listFaceData = async (req, res) => {
  const list = await FaceData.find().populate('employeeId', 'employeeCode name');
  return res.json({ success: true, data: list });
};

exports.deleteFaceData = async (req, res) => {
  await FaceData.findOneAndDelete({ employeeId: req.params.empId });
  return res.json({ success: true, message: 'Face data deleted' });
};

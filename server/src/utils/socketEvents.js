// server/src/utils/socketEvents.js
const { getIO } = require('../socket');

const emitMaterialIssuanceUpdate = (eventType, data) => {
  try {
    const io = getIO();
    if (io) {
      io.emit('material-issuance:update', { eventType, data });
      io.emit('material-issuance:' + eventType, data);
    }
  } catch (error) {
    console.error('Socket emit error:', error.message);
  }
};

module.exports = {
  emitMaterialIssuanceUpdate,
};

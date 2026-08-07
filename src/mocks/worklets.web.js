module.exports = {
  createWorklet: () => () => {},
  loadModuleImplementation: () => {},
  cloneWorklet: (worklet) => worklet,
  createSerializableObject: () => ({}),
  createSerializableNative: (obj) => obj,
  cloneObjectProperties: (obj) => obj,
  clonePlainJSObject: (obj) => obj,
};

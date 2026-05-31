/**
 * Hermes has no SharedArrayBuffer. webidl-conversions (pulled in by expo / whatwg-url)
 * reads these at module load time:
 *   Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "byteLength").get
 *   Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable").get
 * Assigning ArrayBuffer alone fails because ArrayBuffer.prototype has no "growable".
 */
const globalObject = typeof globalThis !== 'undefined' ? globalThis : global;

if (globalObject.__NOTA_SAB_POLYFILL_INSTALLED__) {
  module.exports = {};
} else {
  globalObject.__NOTA_SAB_POLYFILL_INSTALLED__ = true;

  function SharedArrayBufferPolyfill(length) {
    return new ArrayBuffer(length);
  }

  const byteLengthDescriptor = Object.getOwnPropertyDescriptor(
    ArrayBuffer.prototype,
    'byteLength',
  );

  const sabPrototype = Object.create(ArrayBuffer.prototype);
  if (byteLengthDescriptor) {
    Object.defineProperty(sabPrototype, 'byteLength', byteLengthDescriptor);
  }
  Object.defineProperty(sabPrototype, 'growable', {
    configurable: true,
    get() {
      return false;
    },
  });

  SharedArrayBufferPolyfill.prototype = sabPrototype;

  globalObject.SharedArrayBuffer = SharedArrayBufferPolyfill;

  try {
    (0, eval)('var SharedArrayBuffer = globalThis.SharedArrayBuffer');
  } catch {
    // Eval unavailable; global property only.
  }

  // webidl-conversions also reads ArrayBuffer.prototype.resizable at load time.
  if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')) {
    Object.defineProperty(ArrayBuffer.prototype, 'resizable', {
      configurable: true,
      get() {
        return false;
      },
    });
  }

  module.exports = { SharedArrayBufferPolyfill };
}

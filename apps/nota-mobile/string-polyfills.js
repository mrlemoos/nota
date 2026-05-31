/**
 * Hermes lacks some String.prototype methods used by webidl-conversions (USVString).
 */
if (!String.prototype.toWellFormed) {
  // eslint-disable-next-line no-extend-native -- intentional Hermes polyfill
  String.prototype.toWellFormed = function toWellFormed() {
    const str = String(this);
    let out = '';
    for (let i = 0; i < str.length; i += 1) {
      const lead = str.charCodeAt(i);
      if (lead >= 0xd800 && lead <= 0xdbff) {
        const trail = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
        if (trail >= 0xdc00 && trail <= 0xdfff) {
          out += str[i] + str[i + 1];
          i += 1;
        } else {
          out += '\uFFFD';
        }
      } else if (lead >= 0xdc00 && lead <= 0xdfff) {
        out += '\uFFFD';
      } else {
        out += str[i];
      }
    }
    return out;
  };
}

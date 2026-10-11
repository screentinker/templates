/*
 * A small QR Code encoder — ScreenTinker community template. MIT.
 *
 * Written for this template so the Wi-Fi code is drawn on the screen itself, from the operator's
 * values, with no network call and no third-party library. It covers what a join-the-network code
 * needs: byte mode (UTF-8), error correction L/M/Q/H, versions 1-20 (up to 666 bytes at level M),
 * and the eight masks chosen by the standard penalty score (ISO/IEC 18004).
 *
 * Usage: var m = QRMini.encode('text', 'M');  // null if it does not fit
 *        m.size, m.get(x, y) -> true for a dark module
 */
var QRMini = (function () {
  'use strict';

  var MAX_VERSION = 20;
  var EC_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  // Error-correction codewords per block, and the number of blocks, indexed [level][version].
  var ECC_PER_BLOCK = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28]
  };
  var NUM_BLOCKS = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25]
  };

  function bit(x, i) { return ((x >>> i) & 1) !== 0; }

  /* Modules in the symbol that can carry data, after the fixed patterns are taken out. */
  function rawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  function dataCodewords(ver, ecl) {
    return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * NUM_BLOCKS[ecl][ver];
  }

  function utf8(text) {
    if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  /* ---------- Reed-Solomon over GF(256), polynomial 0x11D ---------- */
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var root = 1;
    for (i = 0; i < degree; i++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = gfMul(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= gfMul(coef, factor); });
    });
    return result;
  }

  /* Split into blocks, append each block's error correction, and interleave. */
  function addEcc(data, ver, ecl) {
    var numBlocks = NUM_BLOCKS[ecl][ver];
    var eccLen = ECC_PER_BLOCK[ecl][ver];
    var rawCodewords = Math.floor(rawDataModules(ver) / 8);
    var numShort = numBlocks - rawCodewords % numBlocks;
    var shortLen = Math.floor(rawCodewords / numBlocks);
    var divisor = rsDivisor(eccLen);
    var blocks = [];
    for (var i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, divisor);
      if (i < numShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var result = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortLen - eccLen || j >= numShort) result.push(blocks[j][i]);
      }
    }
    return result;
  }

  function alignmentPositions(ver) {
    if (ver === 1) return [];
    var numAlign = Math.floor(ver / 7) + 2;
    var step = Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
    var result = [6];
    for (var pos = ver * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  /* ---------- the symbol ---------- */
  function Symbol(ver, ecl) {
    this.version = ver;
    this.size = ver * 4 + 17;
    this.ecl = ecl;
    this.modules = [];
    this.isFunction = [];
    for (var y = 0; y < this.size; y++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
  }
  Symbol.prototype.setFn = function (x, y, dark) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  };
  Symbol.prototype.get = function (x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size && this.modules[y][x];
  };

  Symbol.prototype.drawFunctionPatterns = function () {
    var size = this.size, i, j;
    for (i = 0; i < size; i++) {
      this.setFn(6, i, i % 2 === 0);
      this.setFn(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    var pos = alignmentPositions(this.version), n = pos.length;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.drawAlignment(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0);   // placeholder, so these modules are reserved before data goes in
    this.drawVersion();
  };
  Symbol.prototype.drawFinder = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFn(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  };
  Symbol.prototype.drawAlignment = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) this.setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  };
  Symbol.prototype.drawFormatBits = function (mask) {
    var data = (EC_FORMAT_BITS[this.ecl] << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    var size = this.size;
    for (i = 0; i <= 5; i++) this.setFn(8, i, bit(bits, i));
    this.setFn(8, 7, bit(bits, 6));
    this.setFn(8, 8, bit(bits, 7));
    this.setFn(7, 8, bit(bits, 8));
    for (i = 9; i < 15; i++) this.setFn(14 - i, 8, bit(bits, i));
    for (i = 0; i < 8; i++) this.setFn(size - 1 - i, 8, bit(bits, i));
    for (i = 8; i < 15; i++) this.setFn(8, size - 15 + i, bit(bits, i));
    this.setFn(8, size - 8, true);   // the "dark module", always dark
  };
  Symbol.prototype.drawVersion = function () {
    if (this.version < 7) return;
    var rem = this.version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = (this.version << 12) | rem;
    for (i = 0; i < 18; i++) {
      var dark = bit(bits, i);
      var a = this.size - 11 + i % 3, b = Math.floor(i / 3);
      this.setFn(a, b, dark);
      this.setFn(b, a, dark);
    }
  };

  /* Codewords go in two-module-wide columns, zig-zagging up and down from the bottom right. */
  Symbol.prototype.drawCodewords = function (data) {
    var size = this.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = bit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  function maskBit(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return (x * y) % 2 + (x * y) % 3 === 0;
      case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
      default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
  }
  Symbol.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        if (!this.isFunction[y][x] && maskBit(mask, x, y)) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  /* The standard penalty: long runs, 2x2 blocks, finder look-alikes, and dark/light imbalance. */
  Symbol.prototype.penalty = function () {
    var size = this.size, m = this.modules, score = 0, dark = 0, x, y;
    function line(get) {
      var s = 0, run = 1, seq = [];
      for (var i = 0; i < size; i++) seq.push(get(i));
      for (i = 1; i <= size; i++) {
        if (i < size && seq[i] === seq[i - 1]) { run++; continue; }
        if (run >= 5) s += 3 + (run - 5);
        run = 1;
      }
      // 1:1:3:1:1 finder look-alike, with four light modules before or after it (off the edge is light).
      function at(k) { return k >= 0 && k < size && seq[k]; }
      for (i = 0; i + 6 < size; i++) {
        if (!(at(i) && !at(i + 1) && at(i + 2) && at(i + 3) && at(i + 4) && !at(i + 5) && at(i + 6))) continue;
        if (!at(i - 1) && !at(i - 2) && !at(i - 3) && !at(i - 4)) s += 40;
        if (!at(i + 7) && !at(i + 8) && !at(i + 9) && !at(i + 10)) s += 40;
      }
      return s;
    }
    for (y = 0; y < size; y++) score += line(function (i) { return m[y][i]; });
    for (x = 0; x < size; x++) score += line(function (i) { return m[i][x]; });
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
      }
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  };

  function encode(text, ecl) {
    ecl = Object.prototype.hasOwnProperty.call(EC_FORMAT_BITS, ecl) ? ecl : 'M';
    var bytes = utf8(String(text == null ? '' : text));
    var ver, capacityBits, countBits;
    for (ver = 1; ver <= MAX_VERSION; ver++) {
      countBits = ver <= 9 ? 8 : 16;
      capacityBits = dataCodewords(ver, ecl) * 8;
      if (4 + countBits + bytes.length * 8 <= capacityBits) break;
    }
    if (ver > MAX_VERSION) return null;

    // Mode indicator (byte = 0100), character count, the bytes, a terminator, then pad bytes.
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4);
    put(bytes.length, countBits);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, capacityBits - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < capacityBits; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var byte = 0;
      for (var j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      data.push(byte);
    }

    var sym = new Symbol(ver, ecl);
    sym.drawFunctionPatterns();
    sym.drawCodewords(addEcc(data, ver, ecl));
    var best = 0, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      sym.applyMask(mask);
      sym.drawFormatBits(mask);
      var sc = sym.penalty();
      if (sc < bestScore) { best = mask; bestScore = sc; }
      sym.applyMask(mask);   // XOR again: undo
    }
    sym.applyMask(best);
    sym.drawFormatBits(best);
    return sym;
  }

  return { encode: encode };
})();

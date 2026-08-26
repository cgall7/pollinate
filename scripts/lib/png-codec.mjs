// Minimal PNG decoder — just enough to read `xcrun simctl io ... screenshot`
// output and the mascot's own RGBA assets, both of which are 8-bit,
// non-interlaced, colour type 2 (RGB) or 6 (RGBA). No dependency was added
// for this: the format needed is a small, fixed subset (unlike a general
// image pipeline, this only ever decodes assets this repo produced or a
// simulator's own screenshot writer), and the same "fail loud on the
// unsupported case rather than guess" rule the rest of this repo's gates use
// applies here — an interlaced or palette PNG throws instead of silently
// misreading pixels.
import zlib from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const readChunks = (buf) => {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG (bad signature)');
  const chunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length; // length + type + data + crc
  }
  return chunks;
};

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};

// Un-filter the inflated scanlines into raw samples (still colour-type-native
// channel count, 8-bit). `channels` is 3 for RGB, 4 for RGBA.
const unfilter = (inflated, width, height, channels) => {
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[src];
    src += 1;
    const rowStart = y * stride;
    const priorStart = rowStart - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[src + x];
      const a = x >= channels ? out[rowStart + x - channels] : 0;
      const b = y > 0 ? out[priorStart + x] : 0;
      const c = y > 0 && x >= channels ? out[priorStart + x - channels] : 0;
      let value;
      if (filterType === 0) value = raw;
      else if (filterType === 1) value = raw + a;
      else if (filterType === 2) value = raw + b;
      else if (filterType === 3) value = raw + Math.floor((a + b) / 2);
      else if (filterType === 4) value = raw + paeth(a, b, c);
      else throw new Error(`unsupported PNG filter type ${filterType}`);
      out[rowStart + x] = value & 0xff;
    }
    src += stride;
  }
  return out;
};

/**
 * Decode an 8-bit, non-interlaced, RGB or RGBA PNG into flat RGBA bytes.
 * Returns { width, height, data } where `data` is a Buffer of width*height*4
 * bytes, alpha forced to 255 for RGB sources.
 */
export const decodePNG = (buf) => {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) throw new Error('PNG missing IHDR');
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data.readUInt8(8);
  const colorType = ihdr.data.readUInt8(9);
  const interlace = ihdr.data.readUInt8(12);

  if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth} (need 8)`);
  if (interlace !== 0) throw new Error('unsupported PNG interlace (need non-interlaced)');
  if (colorType !== 2 && colorType !== 6) {
    throw new Error(`unsupported PNG colour type ${colorType} (need 2=RGB or 6=RGBA)`);
  }
  const channels = colorType === 6 ? 4 : 3;

  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const inflated = zlib.inflateSync(idat);
  const raw = unfilter(inflated, width, height, channels);

  if (channels === 4) return { width, height, data: raw };

  // Expand RGB -> RGBA (alpha opaque) so every caller works in one format.
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
    rgba[j] = raw[i];
    rgba[j + 1] = raw[i + 1];
    rgba[j + 2] = raw[i + 2];
    rgba[j + 3] = 255;
  }
  return { width, height, data: rgba };
};

/**
 * Encode flat RGBA bytes back to a PNG (colour type 6, filter type 0 on every
 * row). Only used by the self-test to build synthetic fixtures — not
 * performance-sensitive, so it always emits the simplest filter.
 */
export const encodePNG = ({ width, height, data }) => {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type None
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // colour type RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// --- CRC32, needed only by encodePNG (self-test fixtures) -----------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) | 0;
};

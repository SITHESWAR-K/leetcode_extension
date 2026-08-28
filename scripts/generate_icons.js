const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-JS PNG generator (no external dependencies required)
function createPNG(width, height, getPixel) {
  // RGB + A (4 bytes per pixel) + 1 filter byte per line
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

// CRC32 implementation
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

// Draw a stylized badge icon: Dark rounded square background, LeetCode Gold/Amber "LC" + company tag badge
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.22;
  
  // Rounded rect bounds
  const margin = w * 0.08;
  const rx = Math.max(margin + radius, Math.min(w - margin - radius, x));
  const ry = Math.max(margin + radius, Math.min(h - margin - radius, y));
  const dist = Math.hypot(x - rx, y - ry);

  if (dist > radius) {
    return [0, 0, 0, 0]; // Transparent outside rounded rect
  }

  // Gradient background from dark charcoal #1E1E24 to deep black #121214
  const bgGrad = y / h;
  let r = Math.round(30 * (1 - bgGrad) + 18 * bgGrad);
  let g = Math.round(30 * (1 - bgGrad) + 18 * bgGrad);
  let b = Math.round(36 * (1 - bgGrad) + 20 * bgGrad);
  let a = 255;

  // Amber accent border
  if (dist > radius - 1.5 || x <= margin + 1 || x >= w - margin - 2 || y <= margin + 1 || y >= h - margin - 2) {
    return [255, 161, 22, 220]; // LeetCode Gold border
  }

  // Draw stylized "🏢" building or "C" company tag shape
  const normX = x / w;
  const normY = y / h;

  // Center building shape
  // Main building tower
  if (normX >= 0.32 && normX <= 0.68 && normY >= 0.28 && normY <= 0.78) {
    // Amber / Gold building body #FFA116 to #FF8000
    const grad = (normY - 0.28) / 0.5;
    r = Math.round(255 * (1 - grad) + 255 * grad);
    g = Math.round(180 * (1 - grad) + 130 * grad);
    b = Math.round(30 * (1 - grad) + 0 * grad);

    // Building windows
    const winCol = Math.floor((normX - 0.35) / 0.12);
    const winRow = Math.floor((normY - 0.34) / 0.10);
    const inWinX = ((normX - 0.35) % 0.12) < 0.07;
    const inWinY = ((normY - 0.34) % 0.10) < 0.06;

    if (normY >= 0.34 && normY <= 0.70 && normX >= 0.35 && normX <= 0.65 && inWinX && inWinY) {
      r = 20; g = 20; b = 25; // Dark window
    }
  }

  // Side wing (left building)
  if (normX >= 0.20 && normX <= 0.32 && normY >= 0.45 && normY <= 0.78) {
    r = 210; g = 130; b = 15;
  }
  // Side wing (right building)
  if (normX >= 0.68 && normX <= 0.80 && normY >= 0.45 && normY <= 0.78) {
    r = 210; g = 130; b = 15;
  }

  return [r, g, b, a];
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = createPNG(size, size, drawIcon);
  const outPath = path.join(assetsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated ${outPath} (${size}x${size})`);
});

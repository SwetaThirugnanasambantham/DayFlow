// generate minimal valid solid/styled PNG files for PWA standards using Node built-in zlib
import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type RGBA (6)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: each row has 1 filter byte (0 = none) followed by RGBA pixels
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Gradient / accent coloring
      const ratio = (x + y) / (width + height);
      const pr = Math.round(r * (1 - ratio * 0.3));
      const pg = Math.round(g * (1 - ratio * 0.2));
      const pb = Math.round(b * (0.8 + ratio * 0.2));

      rawData[pixelOffset] = pr;
      rawData[pixelOffset + 1] = pg;
      rawData[pixelOffset + 2] = pb;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const pwa192 = createPng(192, 192, 79, 70, 229);
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = createPng(512, 512, 79, 70, 229);
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const pwaMaskable512 = createPng(512, 512, 15, 23, 42);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable512);

const appleTouch = createPng(180, 180, 79, 70, 229);
fs.writeFileSync('public/apple-touch-icon.png', appleTouch);

console.log('Generated PNG icons successfully.');

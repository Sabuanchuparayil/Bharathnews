import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { deflateSync } from 'zlib';

const sizes = [192, 512, 180];
const dir = './public/icons';

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size) {
  const width = size;
  const height = size;
  const rowSize = width * 3;
  const rawData = Buffer.alloc((1 + rowSize) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      rawData[offset++] = 0x43;
      rawData[offset++] = 0x38;
      rawData[offset++] = 0xca;
    }
  }

  const compressed = deflateSync(rawData);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

sizes.forEach(size => {
  const filename = size === 180
    ? `${dir}/apple-touch-icon.png`
    : `${dir}/icon-${size}x${size}.png`;
  writeFileSync(filename, createPng(size));
  console.log(`Created ${filename}`);
});

console.log('\nPlaceholder icons generated. Replace with actual logo from Canva export.');

const fs = require('fs');
const path = require('path');

const getStream = (filePath, responseHeader, startByte, endByte) => {
  const stream = fs.createReadStream(filePath, { startByte, endByte });

  stream.on('open', () => {
    stream.pipe(responseHeader);
  });

  stream.on('error', (streamErr) => {
    stream.end(streamErr);
  });

  return stream;
};

const writeHeader = (inputResponse, inputMediaType, start, end, total) => {
  inputResponse.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': (end - start) + 1,
    'Content-Type': inputMediaType,
  });
};

const loadFile = (request, response, filePath, mediaType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    let { range } = request.headers;

    if (!range) {
      range = 'bytes=0-';
    }

    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    writeHeader(response, mediaType, start, end, total);
    return getStream(file, response, start, end);
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;

const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

module.exports = async (FILE_OPTIONS) => {
  //

  const filePath = `${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`;

  // Download DATASETS file to given destination
  const stream = fs.createWriteStream(filePath);
  const { body } = await fetch(FILE_OPTIONS.download_url);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${FILE_OPTIONS.download_url}" to "${filePath}" successfully.`);

  //
};

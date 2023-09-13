const files = require('./config/files');

const FEEDERDB = require('./services/FEEDERDB');
const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
const fetchAndExtractLatestGtfs = require('./modules/fetchAndExtractLatestGtfs');
const fetchAndExtractLatestDataset = require('./modules/fetchAndExtractLatestDataset');
const setupPrepareAndImportFile = require('./modules/setupPrepareAndImportFile');

const buildMunicipalities = require('./builders/buildMunicipalities');
const buildSchools = require('./builders/buildSchools');
const buildEncm = require('./builders/buildEncm');
const buildStops = require('./builders/buildStops');
const buildShapes = require('./builders/buildShapes');
const buildLinesAndPatterns = require('./builders/buildLinesAndPatterns');
const SERVERDBREDIS = require('./services/SERVERDBREDIS');

//

module.exports = async () => {
  //

  try {
    console.log();
    console.log('-----------------------------------------');
    console.log(new Date().toISOString());
    console.log('-----------------------------------------');
    console.log();

    // Store start time for logging purposes
    const startTime = process.hrtime();
    console.log('Starting...');

    //
    //
    // GLOBAL STARTUP

    console.log();
    console.log('STEP 0.0: Connect to databases');
    await FEEDERDB.connect();
    await SERVERDB.connect();
    await SERVERDBREDIS.connect();

    console.log();
    console.log('STEP 0.1: Setup working directory');
    await setupBaseDirectory();

    //
    //
    // DATASETS

    console.log();
    console.log('STEP 1.0: Fetch and Import Datasets');
    for (const fileOptions of files) {
      if (fileOptions.type !== 'datasets') continue;
      await fetchAndExtractLatestDataset(fileOptions);
      await setupPrepareAndImportFile(fileOptions);
    }

    console.log();
    console.log('STEP 1.1: Update Facilities');
    await buildSchools();
    await buildEncm();

    //
    //
    // GTFS

    console.log();
    console.log('STEP 2.0: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs();

    console.log();
    console.log('STEP 2.1: Import each GTFS file');
    for (const fileOptions of files) {
      if (fileOptions.type !== 'gtfs') continue;
      await setupPrepareAndImportFile(fileOptions);
    }

    console.log();
    console.log('STEP 2.2: Update Municipalities');
    await buildMunicipalities();

    console.log();
    console.log('STEP 2.4: Update Stops');
    await buildStops();

    console.log();
    console.log('STEP 2.5: Update Shapes');
    await buildShapes();

    console.log();
    console.log('STEP 2.6: Update Lines & Patterns');
    await buildLinesAndPatterns();

    console.log();
    console.log('Disconnecting from databases...');
    await FEEDERDB.disconnect();
    await SERVERDB.disconnect();
    await SERVERDBREDIS.disconnect();

    console.log();
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log(`Run took ${timeCalc.getElapsedTime(startTime)}.`);
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log();

    //
  } catch (err) {
    console.log('An error occurred. Halting execution.', err);
    console.log('Retrying in 10 seconds...');
    setTimeout(() => {
      process.exit(0); // End process
    }, 10000); // after 10 seconds
  }

  //
};
const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* UPDATE STOPS */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique schools by school_id
  console.log(`⤷ Querying database...`);
  const allSchools = await FEEDERDB.connection.query(`SELECT * FROM schools;`);
  // Log progress
  console.log(`⤷ Updating Schools...`);
  // Initate a temporary variable to hold updated Schools
  let updatedSchoolIds = [];
  // For each school, update its entry in the database
  for (const school of allSchools.rows) {
    // Discover which cicles this school has
    const cicles = [];
    if (school.pre_school) cicles.push('pre_school');
    if (school.basic_1) cicles.push('basic_1');
    if (school.basic_2) cicles.push('basic_2');
    if (school.basic_3) cicles.push('basic_3');
    if (school.high_school) cicles.push('high_school');
    if (school.professional) cicles.push('professional');
    if (school.special) cicles.push('special');
    if (school.artistic) cicles.push('artistic');
    if (school.other) cicles.push('other');
    // Split stops into discrete IDs
    let parsedSchoolStops = [];
    if (school.school_stops?.length) parsedSchoolStops = school.school_stops.split('|');
    // Initiate a variable to hold the parsed school
    let parsedSchool = {
      code: school.school_id,
      name: school.school_name,
      lat: school.school_lat,
      lon: school.school_lon,
      type: school.school_type,
      group: school.school_group,
      cicles: cicles,
      address: school.address,
      postal_code: school.postal_code,
      locality: school.locality,
      parish_code: school.parish_id,
      parish_name: school.parish_name,
      municipality_code: school.municipality_id,
      municipality_name: school.municipality_name,
      district_code: school.district_id,
      district_name: school.district_name,
      region_code: school.region_id,
      region_name: school.region_name,
      url: school.school_url,
      email: school.school_email,
      phone: school.school_phone,
      stops: parsedSchoolStops,
    };
    // Update or create new document
    const updatedSchoolDocument = await SERVERDB.School.findOneAndReplace({ code: parsedSchool.code }, parsedSchool, { new: true, upsert: true });
    updatedSchoolIds.push(updatedSchoolDocument._id);
  }
  // Log count of updated Schools
  console.log(`⤷ Updated ${updatedSchoolIds.length} Schools.`);
  // Delete all Schools not present in the current update
  const deletedStaleSchools = await SERVERDB.School.deleteMany({ _id: { $nin: updatedSchoolIds } });
  console.log(`⤷ Deleted ${deletedStaleSchools.deletedCount} stale Schools.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Schools (${elapsedTime}).`);
  //
};

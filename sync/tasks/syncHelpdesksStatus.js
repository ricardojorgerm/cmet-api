/* * */
/* IMPORTS */
const crontab = require('node-cron');
const SERVERDB = require('../services/SERVERDB');
const IXAPI = require('../services/IXAPI');

/**
 * UPDATE HELPDESKS STATUS
 * Query 'stops' table to get all unique stops.
 * Save each result in MongoDB.
 */
module.exports = async () => {
  // Setup flag to avoid overlapping runs
  let IS_THIS_TASK_RUNNING = false;
  // Schedule task (https://crontab.guru/#*_*_*_*_*)
  crontab.schedule('*/30 * * * *', async () => {
    // Check if task is already running
    if (!IS_THIS_TASK_RUNNING) {
      // Switch the flag ON
      IS_THIS_TASK_RUNNING = true;
      // Retrieve helpdesks from database
      const foundManyDocuments = await SERVERDB.Helpdesk.find();
      // Query IXAPI for the status of the requested helpdesk
      const allHelpdesksTicketsWaiting = await IXAPI.request({ reportType: 'ticket', status: 'W', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
      // Query IXAPI for the status of the requested helpdesk
      const allHelpdesksStatistics = await IXAPI.request({ reportType: 'entityReport', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
      // Add realtime status to each helpdesk
      for (const foundDocument of foundManyDocuments) {
        // Filter all waiting ticket by the current helpdesk code
        const helpdeskTicketsWaiting = allHelpdesksTicketsWaiting?.content?.ticket?.filter((item) => item.siteEID === foundDocument.code);
        // Find the entityReport entry for the current helpdesk
        const helpdeskStatistics = allHelpdesksStatistics?.content?.entityReport?.find((item) => item.siteEID === foundDocument.code);
        // Format the update query with the request results
        const updatedDocumentValues = {
          currently_waiting: helpdeskTicketsWaiting?.length || 0, // parseInt(Math.random() * -100),
          expected_wait_time: helpdeskStatistics?.averageWaitTime || 0, // parseInt(Math.random() * -100),
        };
        // Update the current document with the new values
        await SERVERDB.Helpdesk.findOneAndUpdate({ code: foundDocument.code }, updatedDocumentValues, { new: true, upsert: true });
        // Log progress
        console.log(`⤷ Updated Helpdesk ${foundDocument.name} (${foundDocument.code}): currently_waiting: ${updatedDocumentValues.currently_waiting}; expected_wait_time: ${updatedDocumentValues.expected_wait_time}`);
        //
      }
      // Switch the flag OFF
      IS_THIS_TASK_RUNNING = false;
      //
    }
    //
  });

  //
};

//
//
//

function getIxDateString(adjustmentSeconds = 0) {
  const dateObj = new Date();
  // Apply the adjustment to the current date
  dateObj.setSeconds(dateObj.getSeconds() + adjustmentSeconds);
  // Get the components of the date
  const year = dateObj.getFullYear().toString().padStart(4, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  // Format the date string
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  // Return result
  return formattedDate;
}

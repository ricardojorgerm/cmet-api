/* * */
/* IMPORTS */
const express = require('express');
const router = express.Router();

//
router.get('/', async (req, res) => {
  try {
    const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts');
    const allAlerts = await allAlertsResponse.json();
    await res.send(allAlerts);
    console.log('🟢 → Request for "/alerts": Found');
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/alerts": Server Error', err);
  }
});

module.exports = router;
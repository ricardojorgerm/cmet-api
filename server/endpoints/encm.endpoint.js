//
const SERVERDBREDIS = require('../services/SERVERDBREDIS');

//
module.exports.all = async (request, reply) => {
  const allEncmData = await SERVERDBREDIS.client.get('encm:all');
  return reply.send(JSON.parse(allEncmData) || []);
};

//
module.exports.single = async (request, reply) => {
  const encmData = await SERVERDBREDIS.client.get(`encm:${request.params.code}`);
  return reply.send(JSON.parse(encmData) || {});
};

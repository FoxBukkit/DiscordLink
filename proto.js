'use strict';

const ProtoBuf = require('protobufjs');
const protoTbl = ProtoBuf.loadProtoFile(__dirname + '/messages.proto').build('com.foxelbox.chatproto');
function makeLookup (subTbl) {
	const lookupTbl = subTbl + 'Lookup';
	const enumTbl = protoTbl[subTbl];
	const tbl = {};
	for (const idx in enumTbl) {
		tbl[enumTbl[idx]] = idx;
	}
	protoTbl[lookupTbl] = tbl;
}
makeLookup('MessageType');
makeLookup('TargetType');
module.exports = protoTbl;

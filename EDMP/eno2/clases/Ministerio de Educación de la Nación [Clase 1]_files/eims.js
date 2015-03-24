/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
var EIMSCore = Class.create();

// constants
EIMSCore.SOUND_MESSAGE_RECEIVED = 0;
EIMSCore.SOUND_USER_CONNECTED   = 1;
EIMSCore.SOUND_NEW_EMAIL        = 2;
EIMSCore.SOUND_CHAT_INVITE      = 3;

EIMSCore.prototype = {
	initialize: function(swfObject) {
		this._ready = false;
		this._swfObject = swfObject;
	},

	isConnected: function () {
		return (this._isConnected);
	},

	setReady: function (ready) {
		this._ready = ready;
	},

	getReady: function () {
		return this._ready;
	},

    playAlert: function (id) {
		if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		this._swfObject.playAlert(id);
	},

	setSound:function (status) {
	    if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		this._swfObject.setSound(status);
	},

	getSound:function () {
	    if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		return this._swfObject.getSound();
	},

	privateMessage: function ( uid, message, dsalt, rest_url ) {
		if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		this._swfObject.privateMessage( uid, message, dsalt, rest_url );
	},

	getUserList: function () {
		if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		return this._swfObject.getUserList();
	},

	getMessageHistory: function (users, limit) {
	    if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		return this._swfObject.getMessageHistory(users, limit);
	},

	getQueuedMessages: function () {
		if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		return this._swfObject.getQueuedMessages();
	},

	logOff: function () {
		if (!this.getReady()) {
			alert('EIMS is not ready.');
			return;
		}

		return this._swfObject.logOff();
	}
};
module.exports = {
	apikey_production: 'Ix34QjtVcP2HPvTgL4npPe16s86Xla5N',
	apikey_development: 'God4gBpleIW290sLT06PDzMibRn+a56L',
	session: {
		encryptionAlgorithm: 'aes256',
		encryptionKey: 'xHCoZj46UsZM1+oPyVr5AetPwMRR2dPivi/9d0z93mE=',
		signatureAlgorithm: 'sha512-drop256',
		signatureKey: 'GUTSC8vLh/7sLUOacTbFfiI0lTg5lRO8dYorSXo9VrEev9dUMODlYps6A78B2dzou+EXdqO3GD5U+F+Yiy9lWA==',
		secret: '/vEngI/Uh17Eip8UbMhOHDAxqGbSjuqQ', // should be a large unguessable string
		duration: 86400000, // how long the session will stay valid in ms
		activeDuration: 300000 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
	}
};

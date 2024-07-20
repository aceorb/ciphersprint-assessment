const axios = require("axios");
const base64 = require('base64-js');
const msgpack = require('@msgpack/msgpack');

const api_url ='https://ciphersprint.pulley.com/';
const start_param = 'raj90.rich@gmail.com';
async function fetchData(param) {
	try {
		const url = `${api_url}${param}`;
		console.log(url);
		const response = await axios.get(url);
		if(response.status == 200){
			return response.data;
		}
		return 'failed';
	} catch (error) {
		// console.error('Fetch error:', error);
		throw error; // Optionally rethrow the error for handling higher up
	}
}

const getResult = async (level, param) => {
	const jsonData = await fetchData(param);
	console.log(jsonData);
	const result = decrypt_path(level, jsonData.encrypted_path, jsonData.encryption_method);
	return result;
}
const decrypt_path = (level, encryptedPath, encryptionMethod) => {
	if (level === 0)
	{
		return encryptedPath;
	}
	if(level === 1){
		const asciiArray = JSON.parse(`[${encryptedPath.slice(6, -1)}]`);
		return `${encryptedPath.slice(0, 5)}${asciiArray.map(code => String.fromCharCode(code)).join('')}`;
	}
	if(level === 2){
		let swappedString = 'task_';
		for (let i = 5; i < encryptedPath.length; i += 2) {
			// Swap the current pair of characters
			swappedString += encryptedPath[i + 1] + encryptedPath[i];
		}
		return swappedString;
	}
	if(level === 3){
		const match = encryptionMethod.match(/-?\d+/);
		const addValue= match ? parseInt(match[0]) : null;
		if(!addValue)
			return null;

		let decryptedPath = 'task_';

		for (let i = 5; i < encryptedPath.length; i++) {
			// Step 2: Adjust ASCII values by subtracting 9
			const encryptedCharCode = encryptedPath.charCodeAt(i);
			const decryptedCharCode = encryptedCharCode - addValue;

			// Step 3: Convert ASCII code back to character
			const decryptedChar = String.fromCharCode(decryptedCharCode);

			// Step 4: Build decrypted path
			decryptedPath += decryptedChar;
		}
		return decryptedPath;
	}
	if (level ===4){
		const match = encryptionMethod.match(/[0-9a-f]{16}/);

		const customHexSet = match ? match[0] : null;
		if(!customHexSet)
			return null;
		let decryptedPath = 'task_';
		const originalHexSet = '0123456789abcdef';
		for (let i = 5; i < encryptedPath.length; i++) {
			const encryptedChar = encryptedPath[i];
			const decryptedChar = originalHexSet[customHexSet.indexOf(encryptedChar)];
			decryptedPath += decryptedChar;
		}
		return decryptedPath;
	}
	if (level === 5){
		const regexPattern = /([A-Za-z0-9+/=]+)$/;
		const match = encryptionMethod.match(regexPattern);

		const encodedMessagePack = match ? match[1] : null;
		if(!encodedMessagePack)
			return null;

		const messagePackUint8 = base64.toByteArray(encodedMessagePack);
		const messagePackData = new Uint8Array(messagePackUint8);

		const scrambledPositions = msgpack.decode(messagePackData);
		console.log(scrambledPositions);

		let decryptedPath = 'task_';
		for (let i = 0; i < scrambledPositions.length; i++) {

			decryptedPath += encryptedPath.charAt(5 + scrambledPositions.indexOf(i));
		}

		return decryptedPath;
	}
	return null;
}

async function main ( ){
	var param = start_param;
	for(let level = 0; level < 10; level++){
		console.log(`level:${level}`);
		param = await getResult(level,param);
		if(!param)
			break;
	}
	console.log('Exited');
}

main();

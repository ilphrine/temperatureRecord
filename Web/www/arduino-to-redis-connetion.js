'use strict';
const redis = require('redis');
const mail = require('./mail-alert');

const {
	ARDUINO_PORT,
	ADAPTOR,
	NUMBER_OF_SENSOR,
	UPPER_BOUND,
	LOWER_BOUND,
	TIME_INTERVAL
} = require('./parameters.js').arduino_parameters;

console.log(ARDUINO_PORT); 
console.log(ADAPTOR);
console.log(NUMBER_OF_SENSOR);
console.log(UPPER_BOUND);
console.log(LOWER_BOUND);
console.log(TIME_INTERVAL);
console.log("\n");


const checkObject = {
	A0: [],
	A1: [],
	A2: [],
	A3: [],
	A4: [],
	A5: [],
};

// function that initialize all the used pins
function initializePin() {
	// we create an empty object ...
	let res = {};
	// to which we add every pin object
	for (let i = 0; i < NUMBER_OF_SENSOR; i++) {
		res[`a${i}`] = {
			driver: "analogSensor",
			pin: i
		};
	}
	return res;
}

// function that store the temperature and check for unusual behavior
function storeTemperature(sensors, dataBase) {
	for (let pin = 0; pin < NUMBER_OF_SENSOR; pin++) {
		// we get the analog value that is read
		const analogValue = sensors[`a${pin}`].analogRead();
		// convert it to a voltage
		const voltage = (analogValue * 5.0) / 1024;
		// convert this voltage to a temperature and store in the array
		const temperature = (voltage - 0.5) * 100;
		// we insert the value into the database
		const d = new Date();
		const key = `${today(d)}-${timeNow(d)}-A${pin}`;
		dataBase.set(key, temperature, redis.print);
		// add values to the fifo
		checkObject[`A${pin}`].push(temperature);
	}
	checkTemperature(checkObject);
}

// function that uses the check object
function checkTemperature() {
	for (let pin in checkObject) {
		if (checkObject[pin].length >= TIME_INTERVAL) {
			const meanOfPin = mean(checkObject[pin]);
			if (meanOfPin > UPPER_BOUND || meanOfPin < LOWER_BOUND) {
			       //sendAlert();
			} else {
				checkObject[pin].shift()
			}
		}
	}
}

function sendAlert() {
	// send mail with defined transport object
	mail.smtpTransport.sendMail(mail.mailOptions(), (error, response) => {
		if (error) {
			console.log("Erreur lors de l'envoie du mail!");
			console.log(error);
		} else {
			console.log("Mail envoyé avec succès!");
		}
	});
	mail.smtpTransport.close();
}

// function that return the mean of an array
function mean(array) {
	return array.reduce((p, c) => p + c, 0) / array.length;
}

// function that return the current date with the form "dd/mm/yyyy"
function today(date) {
	return (
		// the current day string : "dd/"
		((date.getDate() < 10) ? "0" : "") + date.getDate() + "/" +
		// the current month string : "mm/"
		(((date.getMonth() + 1) < 10) ? "0" : "") + (date.getMonth() + 1) + "/" +
		// the current year number : yyyy
		date.getFullYear()
	);
}

// function that return the current time with the form "hh:mm:ss"
function timeNow(date) {
	return (
		// the current hour string : "hh:"
		((date.getUTCHours() < 10) ? "0" : "") + date.getUTCHours() + ":" +
		// the current minute string : "mm:"
		((date.getUTCMinutes() < 10) ? "0" : "") + date.getUTCMinutes() + ":" +
		// the current second string : "ss"
		((date.getUTCSeconds() < 10) ? "0" : "") + date.getUTCSeconds()
	);
}

module.exports.makeConnexion = function(dataBase) {
	return {
		connections: {
			arduino: {
				adaptor: ADAPTOR,
				port: ARDUINO_PORT
			}
		},
		devices: initializePin(),
		work: (sensors) => {
			// every specified time interval we store the temperature
			// and check for anomalous behavior
			every((TIME_INTERVAL).second(), () => {  
					storeTemperature(sensors, dataBase)
				}
			);
		}
	};
}

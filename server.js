var validator = require('validator');
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
var morgan = require('morgan');
var _ = require('lodash');
const URL = process.env.URL || 'http://localhost:7676/api/send'
const SHORTCODE = '6841'
const { default: axios } = require('axios');
const connectMongoose = require('./db_connection');
const IPTables = require('./src/models/IPTables');

const app = express();
const port = 8787;

connectMongoose()

var whitelist = ['::ffff:158.101.189.246', '::ffff:193.122.53.169', '::1', '::ffff:197.156.95.197', '::ffff:10.100.0.44', '::ffff:41.78.73.122', '::ffff:197.156.107.222', '::ffff:15.188.170.3']
var corsOptionsDelegate = function (req, callback) {
    const corsOptions = {
        methods: ["POST"],
        allowedHeaders: ["Content-Type", "application/json"]

    };

    const originIpAddress = req.connection.remoteAddress; // This is where you get the IP address from the request
    console.log("test " + originIpAddress)
    if (whitelist.indexOf(originIpAddress) !== -1) {
        callback(null, corsOptions);
    } else {
        let errors = ["Not allowed by CORS"];
        throw { "success": false, "messages": errors };
    }

}
var corsOptions = {
    origin: function (origin, callback) {
        if (origin === undefined || whitelist.indexOf(origin) !== -1) {
            console.log(origin);
            callback(null, true)
        } else {
            let errors = ["Not allowed by CORS"];
            throw { "success": false, "messages": errors };
            //callback(new Error('Not allowed by CORS'))
        }
    }
}



// Configuring body parser middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('tiny'))

app.post('/sdp', cors(), (req, res) => {

    const originIpAddress = req.socket.remoteAddress;
    processFeres(originIpAddress, req.body).then(rslt => {
        let result = { success: true }
        return res.status(200).send(result);

    }
    ).catch(err => {
        if (err.hasOwnProperty('success')) {
            return res.status(200).json(err);
        }
        let errors = ["Invalid Data"];
        return res.status(200).json({ "success": false, "messages": errors });

    });

});

function validateApiCall(reqBody) {
    let errors = [];
    const phoneNumber = reqBody.phn || "";
    const code = reqBody.cd || "";
    const msgId = reqBody.msgn || "";
    const content = reqBody.content || ""
    //let address = newShop.address || "";
    if (validator.isEmpty(msgId.toString())) {
        errors.push("Invalid message Id.");
    } else {
        if (!msgId.toString().trim().length == 1) {
            errors.push("Invalid message Id.");
        } else {
            if (!validator.isNumeric(msgId.toString())) {
                errors.push("Invalid message Id.");
            } else {
                if (msgId == 1 || msgId == 3 || msgId == 4 || msgId == 5) {
                    if (validator.isEmpty(code.toString())) {
                        errors.push("Invalid Code.");
                    } else {
                        if (!code.toString().trim().length == 4) {
                            errors.push("Invalid Code.");
                        } else {
                            if (!validator.isNumeric(code.toString())) {
                                errors.push("Invalid Code.");
                            }
                        }
                    }
                } else if (msgId == 2) {
                    if (validator.isEmpty(content.toString())) {
                        errors.push("Empty Message.");
                    } else {
                        if (content.toString().trim().length < 6) {
                            errors.push("Invalid Message. Message is to short");
                        } else if (!content.toString().trim().length > 159) {
                            errors.push("Invalid Message. Message is to long");
                        }
                    }
                }
            }
        }
    }
    if (validator.isEmpty(phoneNumber.toString())) {
        errors.push("Invalid telephone number.");
    } else {
        if (!phoneNumber.toString().trim().length == 10) {
            errors.push("Invalid telephone number.");
        } else {
            if (!validator.isNumeric(phoneNumber.toString())) {
                errors.push("Invalid telephone number.");
            }
        }
    }

    return errors;
}
function insertPromise(message, phoneNumber) {
    return new Promise((resolve, reject) => {
        axios
            .get(URL, {
                params: {
                    to: phoneNumber,
                    from: SHORTCODE,
                    content: message,
                },
            }).then(data => resolve(data.data))
            .catch((err) => {
                reject(err.message)
            });
    });
}

function insert(message, phoneNumber) {
    return insertPromise(message, phoneNumber).then(result => {
        return true;
    })
}

function getIpShortCode(ip, shortCode) {
    return IPTables.find({ ip, shortCode }).exec()
}



async function processFeres(ip, reqBody) {
    let message = "";
    console.log(ip, reqBody.shortCode)
    const ipCheck = await getIpShortCode(ip, reqBody.shortCode)
    if (ipCheck.length === 0) {
        throw { success: false, message: "Invalid remote address." }
    }
    let errors = validateApiCall(reqBody);

    if (errors.length > 0) {
        throw { "success": false, "messages": errors };
    } else {
        if (reqBody.msgn == 1) {
            message = fmsg1 + reqBody.cd + fmsg2;
        } else if (reqBody.msgn == 2) {
            message = reqBody.content;
        } else if (reqBody.msgn == 3) {
            message = fmsgcd3c1 + reqBody.cd + fmsgcd3c2;
        } else if (reqBody.msgn == 4) {
            message = fmsgcd4c1 + reqBody.cd;
        } else if (reqBody.msgn == 5) {
            message = fmsgcd5c1 + reqBody.cd + fmsgcd5c2;
        }
        if (errors.length > 0) {
            throw { "success": false, "messages": errors };
        }
        // console.log("process called 3");
        // const result1 = await insertFeres(message, reqBody.phn);
        console.log("process called 4");
        const result = await insert(message, reqBody.phn);
        return result;
    }

}

app.listen(port, () => console.log(`Service listening on port ${port}!`));

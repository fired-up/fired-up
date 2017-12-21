//////////////////
// Phone2Action //
//////////////////

exports.P2AConnect = functions.https.onRequest(p2a.connect);
exports.P2AEmail = functions.https.onRequest(p2a.email);

var request = require('request');
var functions = require('firebase-functions');
var cors = require('cors')({ origin: true });

var auth = {
    username: functions.config().p2a.api, //process.env.P2A_API,
    password: functions.config().p2a.secret //process.env.P2A_SECRET
};

/*
    required:
    zip, address, phone, campaign
*/

var makeCall = function( consID, campaignID, callback ) {
    request({
        json: true,
        auth: auth,
        method: 'post',
        url: 'https://api.phone2action.com/2.0/connections',
        body: {
            type: ['call'],
            campaignid: campaignID,
            advocateid: consID
        }
    }, function( error, response, body ) {
        callback( body );
    });
};

var sendEmail = function( consID, campaignID, subject, body, callback ) {
    request({
        json: true,
        auth: auth,
        method: 'post',
        url: 'https://api.phone2action.com/2.0/connections',
        body: {
            type: ['email'],
            campaignid: campaignID,
            advocateid: consID,
            emailSubject: subject,
            emailMessage: body
        }
    }, function( error, response, body ) {
        callback( body );
    });
};

var createContact = function( email, phone, prefix, firstname, lastname, zip, address, smsOptin, campaign, callback ) {
    // Validate fields. Phone OR email is required.
    if ( zip && email && address && campaign && ( email || phone ) ) {
        var contact = {
            prefix: prefix,
            firstname: firstname,
            lastname: lastname,
            campaigns: [campaign],
            zip5: zip,
            address1: address,
            smsOptin: smsOptin ? 1 : 0
        };

        if ( email ) {
            contact.email = email;
        }

        if ( phone ) {
            contact.phone = phone;
        }

        request({
            json: true,
            auth: auth,
            method: 'post',
            url: 'https://api.phone2action.com/2.0/advocates',
            body: contact
        }, function( error, response, body ) {
            if ( body.advocateid && !body.error ) {
                // Make call
                callback( false, body.advocateid );
            } else {
                callback( body );
            }
        })
    } else {
        callback( 'validation', false );
    }
};

module.exports = {
    // Create a new user
    call( req, res ) {
        cors( req, res, () => {
            var params = req.body;

            if ( params.zip && params.address && params.phone && params.email && params.campaign ) {
                if ( !params.consid ) {
                    createContact( params.email, params.phone, params.prefix, params.firstname, params.lastname, params.zip, params.address, params.smsOptin, params.campaign, function( error, advocateID ) {

                        if ( error ) {
                            res.json( { success: 0, error: error } );
                        } else {
                            makeCall(advocateID, params.campaign, function( body ) {
                                res.json( body );
                            });
                        }
                    });
                } else {
                    makeCall(params.consid, params.campaign, function( body ) {
                        res.json( body );
                    })
                }
            } else if ( params.consid && params.campaign ) {
                makeCall(params.consid, params.campaign, function( body ) {
                    res.json( body );
                })
            } else {
                res.json( { success: 0, error: 'Zip, Street Address, Phone Number, Email Address and Campaign are required.' } );
            }
        })
    },

    email( req, res ) {
        cors( req, res, () => {
            var params = req.body;

            if ( params.zip && params.address && params.email && params.subject && params.body && params.campaign ) {
                if ( !params.consid ) {
                    createContact( params.email, params.phone, params.prefix, params.firstname, params.lastname, params.zip, params.address, params.smsOptin, params.campaign, function( error, advocateID ) {
                        if ( error ) {
                            res.json( { success: 0, error: error } );
                        } else {
                            sendEmail(advocateID, params.campaign, params.subject, params.body, function( body ) {
                                res.json( body );
                            });
                        }
                    });
                } else {
                    sendEmail(params.consid, params.campaign, params.subject, params.body, function( body ) {
                        res.json( body );
                    });
                }
            } else if ( params.consid && params.campaign ) {
                sendEmail(params.consid, params.campaign, params.subject, params.body, function( body ) {
                    res.json( body );
                });
            } else {
                res.json( { success: 0, error: 'Zip, Street Address, Phone Number, Email Address, Email Subject, Email Body and Campaign are required.' } );
            }
        });
    }
}

module.exports = [{
    func: call,
    name: 'call'
}, {
    func: email,
    name: 'email'
}]
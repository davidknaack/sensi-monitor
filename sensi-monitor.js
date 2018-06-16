#!/usr/bin/env node

var config = require("./config.js");
var SensiClient = require("sensi-client");

var log = function(message) {
    console.log(`${new Date().toISOString()} [SensiMonitor] ${message}`);
};

log("Starting...");

var options = {
    username: config.sensiUsername || "",
    password: config.sensiPassword || "",
    baseUrl: "https://sensiapi.io",
};

var client = new SensiClient(options);

if (config.dataLogging) {
    if (!config.dataLoggingConnectionString) {
        log("WARN: config.dataLoggingConnectionString is not set. Thermostat readings will not be saved.");   
    } else if (!config.dataLoggingCollectionName) {
        log("ERRO: config.dataLoggingCollectionName is not set. Thermostat readings will not be saved.");
        process.exit(1);
    } else {
        var mongojs = require("mongojs");
        var db = mongojs(config.dataLoggingConnectionString);
        var collection = db.collection(config.dataLoggingCollectionName);

        log("INFO: mongo connection string: " + config.dataLoggingConnectionString );
        log("INFO: mongo collection: + config.dataLoggingCollectionName" );
    }
}

var saveData = function(data) {
    if (!config.dataLogging || !collection) {
        return;
    }
    
    collection.insert(data);
};

if (config.emailAlerts) {
    if (!config.emailAddressFrom) {
        log("WARN: config.emailAddressFrom is not set. Email alerts will not be sent.");
    } else if (!config.emailAddressTo) {
        log("ERRO: config.emailAddressTo is not set.");
        process.exit(1);
    } else {
        var nodemailer = require("nodemailer");
        var sendmailTransport = require("nodemailer-sendmail-transport");
        var transporter = nodemailer.createTransport(sendmailTransport());
        
        log(`INFO: Email alerts will be sent from ${config.emailAddressFrom} to ${config.emailAddressTo}`);
    }
}

var sendMail = function(subject, message) {
    if (!config.emailAlerts || !transporter) {
        return;
    }
    
    var email = {
        from: config.emailAddressFrom,
        to: config.emailAddressTo,
        subject: subject || "",
        text: message || ""
    };
    
    log(`INFO: email alert: ${email.subject}`);
    
    transporter.sendMail(email, function(err, info) {
        if (err) {
            log(`ERRO: sending mail: ${err}`);
        }
    });
};

var connect = function() {
    log(`INFO: connecting to sensi as ${options.username}`);
    client.connect(function(err, thermostats) {
        if (err) {
            log(`ERRO: during connect: ${err}`);
            console.error(err);
            process.exit(1);
        }
        
        if (!thermostats) {
            log("ERRO: Sensi API returned no thermostats.");
            process.exit(2);
        }
        
        client.subscribe(thermostats[0].ICD, function(err) {
            if (err) {
                log("ERRO: during subscribe:");
                console.error(err);
                process.exit(3);
            }
        });
    });
};

client.on("coolSetpointChanged", function(setpointChange) {
    log(`INFO: Cool setpoint changed ${setpointChange.oldSetpoint} -> ${setpointChange.newSetpoint}`);
    if (config.emailAlertOnSetpointChanged) {
        
        if (setpointChange.isTemporaryHold ||
            !config.omitScheduledSetpointAlerts) {
            
            sendMail(`Cool setpoint has changed from ${setpointChange.oldSetpoint} to ${setpointChange.newSetpoint} `+
                ` at ${new Date().toString()}`);
        }
    }
});

client.on("heatSetpointChanged", function(setpointChange) {
    log(`INFO: Heat setpoint changed ${setpointChange.oldSetpoint} -> ${setpointChange.newSetpoint}`);
    if (config.emailAlertOnSetpointChanged) {
        
        if (setpointChange.isTemporaryHold ||
            !config.omitScheduledSetpointAlerts) {
        
            sendMail(`Heat setpoint has changed from ${setpointChange.oldSetpoint} to ${setpointChange.newSetpoint} `+
                `at ${new Date().toString()}`);
        }
    }
});

client.on("runningModeChanged", function(modeChange) {
    if (config.emailAlertOnRunningModeChanged) {
        log(`INFO: Running mode changed ${modeChange.oldMode} -> ${modeChange.newMode}`);
        sendMail( `Running mode has changed from ${modeChange.oldMode} to ${ modeChange.newMode} ` +
            `at ${new Date().toString()}` );
    }
});

client.on("systemModeChanged", function(modeChange) {
    if (config.emailAlertOnSystemModeChanged) {
        sendMail(`System mode has changed from ${modeChange.oldMode} to ${modeChange.newMode} `
            ` at ${new Date().toString()}`);
    }
});

client.on("update", function(updateMessage) {
    if (config.verbose) {
        log("INFO: Thermostat update received"); 
    }
    
    saveData(updateMessage);
});

client.on("online", function(onlineMessage) {
    log("INFO: Thermostat is online");
    
    saveData(onlineMessage);
});

client.on("offline", function(offlineMessage) {
    log("INFO: Thermostat is OFFLINE");
    
    saveData(offlineMessage);
});

connect();

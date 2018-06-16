var config = {
    dataLogging: process.env.SENSI_DATALOGGING,
    dataLoggingConnectionString: process.env.SENSI_MONITOR_MONGO_CONNECTION_STRING,
    dataLoggingCollectionName: process.env.SENSI_MONITOR_MONGO_COLLECTION,
    
    emailAlerts: process.env.SENSI_EMAIL_ALERTS,
    emailAddressTo: process.env.SENSI_MONITOR_EMAIL_TO,
    emailAddressFrom: process.env.SENSI_MONITOR_EMAIL_FROM,
    
    alertOnRunningModeChanged: process.env.SENSI_ALERT_RUNNING_MODE,
    alertOnSystemModeChanged: process.env.SENSI_ALERT_SYSTEM_MODE,
    alertOnSetpointChanged: process.env.SENSI_ALERT_SETPOINT,
    
    omitScheduledSetpointAlerts: process.env.SENSI_ALERT_OMIT_SCHEDULED,
    sensiUsername: process.env.SENSI_USERNAME,
    sensiPassword: process.env.SENSI_PASSWORD,

    verbose: process.env.SENSI_VERBOSE 
};

module.exports = config;

const express = require("express");
const bodyParser = require('body-parser');
const config = require('../../config/config');
const path = require("path");
const worker_logs = require("../../models/workerJobLogs")
const logBatchSize = config.WORKER_LOG_BATCH_SIZE || 50;
const { flushLogsToDatabase } = require("../../utils/utils")
const app = express();

app.use(bodyParser.text())
app.set("views", path.join(__dirname, "..", "..", "views"));
app.set("view engine", "jade");

app.get('/', (req, res) => {
    res.render('index', {
        title: 'TechNoob Worker',
        environment: config.NODE_ENV,
        repo_link: "https://github.com/TechNoobNG/Technoob-Homebase",
    });
});

const logBuffer = [];

setTimeout(() => {
    
},500)

app.post('/work', async (req, res) => {
    try {
        const payload = req.body;
        let data = JSON.parse(payload);
        if (typeof data === "string") {
            data = JSON.parse(data)
        }
 
        const method = data.method;
        const importService = data.service ? `../${data.service}` : `../${data.import}`;
        logBuffer.push({
            action: method,
            importService: importService,
            payload: data.data ? data.data : null,
            status: "started"
        });
        const importedData = require(importService);
        await importedData[method](data.data ? data.data : null);

        const log = logBuffer.pop();
        log.status = "completed";
        logBuffer.push(log);

        res.status(200).send('Payload received successfully.'); 
    } catch (err) {
        console.log(err);
        const log = logBuffer.pop();
        log.status = "failed";
        log.error_stack = {
            message: err.message,
            stack_trace: err
        };
        logBuffer.push(log);
        res.status(422).send(err.message); 
    }

    setTimeout(async () => {
        if (logBuffer.length >= 1) {
            try {
                await flushLogsToDatabase(logBuffer, worker_logs);
            } catch (error) {
                console.log(err," failed to push logs");
            }
        }
    }, 500)


});

module.exports = app;

const services = require('../services/index');
const resource = services.utils;
const { redisSubscriber } = require('../utils/connectors/redishelper');


module.exports = {
    async upload_file(req, res, next) {
        const file = req.file
        file.uploaderId = req.user?._id.toString()
        const acl = req.query.acl || "private";
        file.acl = acl;
        try {
            const file_uloaded = await resource.upload_file(file)
            res.ok({
                status: "success",
                message: `file uploaded`,
                data: file_uloaded
            })
        } catch (error) {
            res.fail({
                status: "fail",
                message: error.message
            })
        }
    },

    async downloadFile(req, res) {
        const { generatedId } = req.params;
        const { _id: userId } = req.user._id;
        try {
            const file = await resource.download( generatedId, userId)
            return res.customRedirect(file);
        } catch (err) {
            res.fail({
                status: "fail",
                message: err.message
            })
        }

    },

    async downloadComputed(req, res) {
        const { fileId } = req.params;
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        res.writeHead(200, headers);
        const checkFile = await resource.downloadSse(fileId);
        if (checkFile) {
            res.write(`data: ${JSON.stringify(checkFile)}\n\n`)
            res.end();
            return;
        } else {
            const channelId = `download:${fileId}`
            await redisSubscriber.subscribe(channelId, (message) => {
            res.write(`data: ${message}\n\n`);
            res.end();
            });
            return
        }
    },

    async getPlaceholders(req, res) {
        try {
            const query = req.query;
            const fetchDefaults = await services.utils.getPlaceholders(query);
            res.ok({
                status: "success",
                message: `Fetched Successfully`,
                data: fetchDefaults
            })
        } catch (err) {
            res.fail({
                status: "fail",
                message: err.message
            })
        }
    },

    async setPlaceholders(req, res) {
        try {
            const { placeholders, name } = req.body;

            const setDefaults = await services.utils.setPlaceholders({placeholders, name});
            res.ok({
                status: "success",
                message: `Defaults set`,
                data: setDefaults
            })
        } catch (err) {
            res.fail({
                status: "fail",
                message: err.message
            })
        }
    }
}
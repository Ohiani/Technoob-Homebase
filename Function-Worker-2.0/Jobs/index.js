
const scraperLog = require("../utils/scraperLog")
module.exports = {

    async deleteExpiredJobs(context) {
        try {
            const queue = require('../utils/azure_queue');
            const honeybadger = require('../utils/honeybadger');
            await queue.sendMessage({
                name: "deleteExpiredJobs",
                import: "../services",
                service: "jobs",
                method: "deleteExpiredJobs"
           })
            honeybadger.notify({
                name: "deleteExpiredJobs",
                message: "Initiated Delete Expired Jobs"
           })
        } catch (err) {
            context.log(err)
            throw err
        }
    },

    async scrapeJobs(q, posted, expires,context) {
        try {
            const queue = require('../utils/azure_queue');
            const honeybadger = require('../utils/honeybadger');
            const config = require('../utils/config');
            const automations = require('../automations/scraper')
            const stackKeywords = config.SCRAPE_STACK_KEYWORDS || [
                "junior product ui/ux designer",
                "junior product project manager scrum master",
                "junior cloud devops engineer",
                "junior backend software mobile frontend developer",
                "junior QA",
                "Junior customer Service support"
            ]
            const allowedContractTypes = ["full-time", "contract","internship","part-time","gig"]

            let result = []
            let insertJobObj = {}
            let dataUpload = []
            const scraperLogger = new scraperLog(stackKeywords,expires,"indeedNG")

            for (let keyword of stackKeywords) {

                try {
                    scraperLogger.start(keyword,"initiated")
                    result = await automations.scrapeJobsIndeed({
                    searchTag: keyword,
                        q: q * 1
                    })
                    scraperLogger.end(keyword,"completed")
                    result.forEach((scrapedJob) => {
                        if (scrapedJob.posted * 1 > 5) {
                            insertJobObj.title = scrapedJob.title;
                            insertJobObj.company = scrapedJob.company;
                            insertJobObj.exp = "N/A";
                            insertJobObj.location = `${scrapedJob.location}, Nigeria`;
                            insertJobObj.workplaceType = scrapedJob.workplaceType || "onsite";
                            insertJobObj.contractType = allowedContractTypes.includes(scrapedJob.type?.toLowerCase()) ?  scrapedJob.type?.toLowerCase() : "full-time";
                            insertJobObj.datePosted = new Date();
                            insertJobObj.expiryDate = new Date(insertJobObj.datePosted);
                            insertJobObj.expiryDate.setDate(insertJobObj.datePosted.getDate() + expires);
                            insertJobObj.link = scrapedJob.link || "https://ng.indeed.com";
                            insertJobObj.poster = scrapedJob.poster;
                            insertJobObj.uploader_id = "64feb85db96fbbd731c42d5f"
                        }
    
                        if (JSON.stringify(insertJobObj) !== '{}') dataUpload.push(insertJobObj);
                    });
                    let uniqueJobSet = new Set();
                    dataUpload.forEach((obj) => {
                        uniqueJobSet.add(JSON.stringify(obj));
                    });
                    let uniqueJobsArray = Array.from(uniqueJobSet, JSON.parse);
                    if (uniqueJobsArray.length) {
                        await queue.sendMessage({
                            name: "createScrapedJobs",
                            import: "../services",
                            service: "jobs",
                            method: "createScrapedJobs",
                            data: {
                                uniqueJobsArray
                            },
                            visibilityTimeout: 40,
                            delay: 3000
                    })}
                } catch (error) {
                    scraperLogger.end(keyword,"failed",error.message)
                    context.log(error)
                }

            }
            honeybadger.notify({
                name: "createScrapedJobs",
                message: "Initiated Job scraping"
            })
            scraperLogger.complete();
        } catch (error) {
            context.log(error)
            throw error
        }

    },

    async scrapeJobsV2() {
        try {
            const queue = require('../utils/azure_queue');
            const honeybadger = require('../utils/honeybadger');
            await queue.sendMessage({
                name: "scrapeNoobJobs",
                import: "../services",
                service: "jobs",
                method: "scrapeNoobJobs"
           })
            honeybadger.notify({
                name: "scrapeNoobJobs",
                message: "Initiated Scrape Noob Jobs"
           })
        } catch (err) {
            context.log(err)
            throw err
        }
    }


};
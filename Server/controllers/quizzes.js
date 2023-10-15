const services = require('../services/index');
const Quizzes = services.quizzes;

module.exports = {
     async get_all (req, res) { 
        const query = req.query
        try {
            const quizzes = await Quizzes.get_all(query)
            res.status(200).json({
                status: "success",
                message: `${quizzes.count} quiz(es) retrieved`,
                data: quizzes
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async get(req, res, next) { 
        const id = req.params.id
        const user = req.user?._id || 0
        try {
            const quizzes = await Quizzes.get(id,user)
            res.status(201).json({
                status: "success",
                message: `Quiz retrieved`,
                data: quizzes
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async getMetrics(req, res, next) { 
        try {
            const quizzesMetrics = await Quizzes.getMetrics()
            res.status(200).json({
                status: "success",
                message: `Quiz metrics retrieved`,
                data: quizzesMetrics
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async create (req, res, next) { 
        const payload = req.body

        payload.uploader_id = req.user?._id

        if (!payload.uploader_id) {
            throw new Error("Invalid user")
        }
        try {
            const quizzes = await Quizzes.create(payload)
            res.status(200).json({
                status: "success",
                message: `Quiz created`,
                data: quizzes
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async count(req, res, next) {
        try {
            const count = await Quizzes.count()
            res.status(200).json({
                status: "success",
                message: `Quiz count`,
                data: count
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async remove(req, res, next) {
        const id = req.params.id
        try {
            await quizzes.remove(id)
            res.status(200).json({
                status: "success",
                message: `Quiz deleted`
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async getActivity(req, res, next) {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10

        try {
            const activity = await Quizzes.activity(page,limit)
            res.status(200).json({
                status: "success",
                data: activity
            })
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            })
        }
    },

    async getQuestion(req, res, next) {
        const id = req.params.id
        const user = req.user

        try {
            const questions =  await Quizzes.getQuestion(id,user)
            res.status(200).json({
                status: "success",
                data: questions,
            })
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            })
        }

    },

    async submit(req, res, next) {
        const id = req.params.id
        const answers = req.body.answers
        const user = req.user

        try {
            const result =  await Quizzes.submit(id,answers,user)
            res.status(200).json({
                status: "success",
                data: result,
            })
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            })
        }
    }

}
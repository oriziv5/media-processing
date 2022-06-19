import express from 'express'
import { Home } from './controllers/home.js'

const router = express.Router()

// Enable OPTIONS request
router.route('/').get(Home)

export default router
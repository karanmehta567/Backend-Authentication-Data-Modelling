import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
import { DB_CONNECT } from './db/index.js'
import app from './app.js'

DB_CONNECT().then(() => {
    app.listen(process.env.PORT || 4500, () => {
        console.log('DB connection success!')
    })
}).catch((error) => {
    console.log('Error', error)
})
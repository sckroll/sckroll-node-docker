const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const redis = require('redis')
const cors = require('cors')
const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require('./config/config')
const postRouter = require('./routes/postRoutes')
const userRouter = require('./routes/userRoutes')

// 레디스 세션 설정
let RedisStore = require('connect-redis')(session)
let redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT
})

const app = express()

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    .then(() => console.log('successfully connected to DB'))
    .catch(e => {
      console.error(e)
      // 5초 후 서버 재연결 시도
      setTimeout(connectWithRetry, 5000)
    })
}
connectWithRetry()

app.enable('trust proxy')
app.use(cors({}))
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  cookie: {
    secure: false,
    resave: false,
    saveUninitialized: true,
    httpOnly: true,
    maxAge: 1000 * 60
  }
}))

app.use(express.json())

// 라우트 설정
app.get('/api/v1', (req, res) => {
  res.send('<h2>Sckroll pushing changes test</h2>')
  console.log('hell yeah')
})
app.use('/api/v1/posts', postRouter)
app.use('/api/v1/users', userRouter)

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`listening on port ${port}`);
})
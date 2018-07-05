const { DATA_DIR } = require('./config')
const lockFile = require('lockfile')
const fs = require('fs')

const { init: initDb } = require('./db')
const { init: initIg } = require('./ig')

const sync = require('./sync')
const unfollow = require('./unfollow')
const { followRandomTag, followUserFollowers } = require('./follow')
const { getSQL } = require('./db');

const stat = require('./stat')

const WAIT_FILE = `${DATA_DIR}/wait.lock`
const LOCK_FILE = '/tmp/instabot.lock'

const needsWait = () => {
  if (fs.existsSync(WAIT_FILE)) {
    const waitUpto = fs.readFileSync(WAIT_FILE, 'utf-8')
    try {
      if (parseInt(waitUpto) > new Date().getTime()) {
        console.log(`still waiting (timestamp: ${waitUpto})`)
        return true
      }
    } catch(e) {
      return false
    }
  }
  false
}

const writeWaitFile = () => {
  fs.writeFileSync(WAIT_FILE, `${new Date().getTime() + (24*60*60*1000)}`)
}

const run = async () => {
  stat.start()
  try {
    await initDb()
    await initIg()

    await sync()

    const { count: followingCount } = await getSQL('select count(*) as count from following');

    if (followingCount > 1000) {
      await unfollow()
      writeWaitFile()
    } else {
      while (true) {
        await followRandomTag()
      }
      const { count: newFollowingCount } = await getSQL('select count(*) as count from following');
      if (newFollowingCount > MAX_FOLLOWING) {
        writeWaitFile()
      }
    }
  } catch(e) {
    console.log(e)
    stat.error(e)
    writeWaitFile()
  }
}

const opts = {}
lockFile.lock(LOCK_FILE, opts, async (err) => {
  if (err) {
    console.log(err)
    return
  }

  if (needsWait()) {
    return
  }
  
  await run()
  lockFile.unlock(LOCK_FILE, async (err) => {
    if (err) {
      console.log(err)
      return
    }
  })
})

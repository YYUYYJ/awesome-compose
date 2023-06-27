const websocket = require('nodejs-websocket')
const redisClient = require('redis')

const parseData = (str) => {
    const data = JSON.parse(str)
    const bdzid = data.bdzid
    const lxid = data.lxid
    const sbid = data.sbid
    const csid = data.csid
    const time = data.time
    const value = data.value
    const quality = data.quality
    if (
        (undefined === bdzid) || (undefined === lxid) || (undefined === sbid) || (undefined === csid) || (undefined === time) || (undefined === value) || (undefined === quality)
    ) {
        return str
    }
    const obj = {}
    const key_rtime = `zx_data_src.${bdzid}_${lxid}_${sbid}_${csid}.rtime`
    obj[key_rtime] = time
    const key_data = `zx_data_src.${bdzid}_${lxid}_${sbid}_${csid}.data`
    obj[key_data] = value
    const key_data_flag = `zx_data_src.${bdzid}_${lxid}_${sbid}_${csid}.data_flag`
    obj[key_data_flag] = quality
    return JSON.stringify(obj)
}

const main = () => {
    let websocketServer = null
    const port = 8081
    try {
        console.log('启动websocket服务端，监听:', port)
        websocketServer = websocket.createServer(
            (conn) => {
                const length = websocketServer.connections.length
                console.log('number of client:', length)
                conn.on(
                    'text',
                    (data) => {
                        // 返回心跳
                        if (data === '{}') {
                            conn.sendText(data)
                            return
                        }
                    }
                )
                conn.on(
                    'close',
                    (code, reason) => {
                        console.log('关闭连接')
                    }
                )
                conn.on(
                    'error',
                    (code, reason) => {
                        console.log('异常关闭')
                    }
                )
            }
        ).listen(port)

    } catch (err) {
        console.log('websocket异常,错误信息:', err)
    }

    //
    const options = {
        host: 'redis',
        port: 6379
    }
    const subscriber = redisClient.createClient(options)
    subscriber.subscribe('zxdata')
    subscriber.on(
        'subscribe',
        (channel, count) => {
            console.log('Subscribe # subscribed to ' + channel + ', ' + count + ' total subscriptions')
        }
    )
    subscriber.on(
        'message',
        (channel, message) => {
            if (!websocketServer) {
                return
            }
            // console.log(`redis recv: ${message}`)
            websocketServer.connections.forEach(
                (conn) => {
                    conn.sendText(message)
                }
            )
        }
    )
    subscriber.on(
        'error',
        (err) => {
            console.log('redisClient error: ' + JSON.stringify(err))
        }
    )
}

main()

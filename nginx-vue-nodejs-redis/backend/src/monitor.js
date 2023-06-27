const redis = require('redis')
const redisClient = redis.createClient({
    host: 'redis',
    port: 6379
})


const toDecimal = (x, fixed) => {
    let f = parseFloat(x)
    if (isNaN(f)) {
        return 9999
    }
    const scale = Math.pow(10, fixed)
    f = Math.round(x * scale) / scale
    return f
}

// eslint-disable-next-line
Date.prototype.format = function (fmt) {
    const o = {
        'M+': this.getMonth() + 1, // 月份
        'd+': this.getDate(), // 日
        'h+': this.getHours(), // 小时
        'm+': this.getMinutes(), // 分
        's+': this.getSeconds(), // 秒
        'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
        'S': this.getMilliseconds() // 毫秒
    }
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
        }
    }
    return fmt
}

const calc = (prps) => {
    const element = {
        ave: 0,
        min: 0,
        max: 0,
        fdcount: 0,
        fdtype: 0,
        probability: 0
    }
    const length = prps.length
    if (length <= 0) return element
    const fdvalue = -35
    let sum = 0
    let max = -999
    let min = 999
    let fdcount = 0
    for (let i = 0; i < length; i++) {
        const data = prps[i][2]
        if (data > max) {
            max = data
        }
        if (data < min) {
            min = data
        }
        if (data > fdvalue) {
            fdcount += 1
        }
        sum += data
    }
    const ave = sum / length
    element.ave = ave
    element.max = max
    element.min = min
    element.fdcount = fdcount
    element.fdtype = parseInt(Math.random() * 10000) % 6
    element.probability = Math.random() * 100
    return element
}

const randPrps = () => {
    let prps = []
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 360; x += 1.8) {
            const min_dbm = -70
            const max_dbm = 0
            const value = toDecimal((Math.random() * Math.random() * (max_dbm - min_dbm) + min_dbm), 0)
            const phase = toDecimal(x, 1)
            prps.push([phase, y, value])
        }
    }
    prps = prps.sort(
        (value1, value2) => {
            if (value1[2] < value2[2]) return 1
            return -1
        }
    )
    prps = prps.filter(
        (value) => {
            return value[2] >= -40
        }
    )
    const date = new Date().format('yyyy-MM-dd hh:mm:ss')
    const element = calc(prps)
    const prps_object = {
        rtime: date,
        min: element.min,
        max: element.max,
        ave: element.ave,
        fdcount: element.fdcount,
        fdtype: element.fdtype,
        probability: element.probability,
        rdata: prps.splice(0, 300)
    }
    return prps_object
}

const main = () => {
    {
        const bdz_id = 1
        const leixing_id = 38
        for (let shebei_id = 1; shebei_id <= 6; shebei_id++) {
            setInterval(
                () => {
                    {
                        const prps = randPrps()
                        const canshu_id = 21
                        const key_prps = `zx_data_src.${bdz_id}_${leixing_id}_${shebei_id}_${canshu_id}.data`
                        const zxdata = {}
                        zxdata[key_prps] = prps
                        const message = JSON.stringify(zxdata)
                        redisClient.publish('zxdata', message)
                    }
                    {
                        const prp = []
                        for (let x = 0; x < 650; x++) {
                            prp.push([x, (Math.random() * 10000).toFixed(1)])
                        }
                        const canshu_id = 20
                        const key_prps = `zx_data_src.${bdz_id}_${leixing_id}_${shebei_id}_${canshu_id}.data`
                        const zxdata = {}
                        zxdata[key_prps] = prp
                        const message = JSON.stringify(zxdata)
                        redisClient.publish('zxdata', message)
                    }
                },
                200
            )
        }
    }
}
main()
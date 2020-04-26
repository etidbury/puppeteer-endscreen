// require('dotenv').config({
//     safe: true,
//     debug: process.env.DEBUG,
//     allowEmptyValues: true,
//     silent: true
// })

import Axios from 'axios'

//@ts-ignore
const DD_API_KEY = typeof process.env.DD_API_KEY === "string" ? process.env.DD_API_KEY.replace(/"/g, '') : undefined
//@ts-ignore
const DD_HOSTNAME = typeof process.env.DD_HOSTNAME === "string" ? process.env.DD_HOSTNAME.replace(/"/g, '') : undefined
//@ts-ignore
const DD_SERVICE = typeof process.env.DD_SERVICE === "string" ? process.env.DD_SERVICE.replace(/"/g, '') : typeof process.env.BOT_LABEL === "string" ? process.env.BOT_LABEL.replace(/"/g, '') : undefined

export const info = async (data: Object | string, source: string | undefined = undefined, tags: Object | undefined = undefined) => {
    return _createLog("info", data, source, tags)
}
export const warn = async (data: Object | string, source: string | undefined = undefined, tags: Object | undefined = undefined) => {
    return _createLog("warning", data, source, tags)
}
export const debug = async (data: Object | string, source: string | undefined = undefined, tags: Object | undefined = undefined) => {
    return _createLog("debug", data, source, tags)
}
export const error = async (data: Object | string, source: string | undefined = undefined, tags: Object | undefined = undefined) => {
    return _createLog("error", data, source, tags)
}

export const _createLog = async (level: string, data: Object | string, source: string | undefined = undefined, tags: Object | undefined = undefined, service: string | undefined = DD_SERVICE, hostname: string | undefined = DD_HOSTNAME) => {
    //https://http-intake.logs.datadoghq.com/v1/input

    if (typeof data === "string") {
        data = {
            message: data
        }
    }

    const params: any = {}


    if (tags) {
        params.ddtags = Object.keys(tags).map((tagName) => `${tagName}:${tags[tagName]}`).join(',')
    }

    if (source) {
        params.ddsource = source
    }
    if (service) {
        params.service = service
    }
    if (hostname) {
        params.hostname = hostname
    }

    //@ts-ignore
    console[level === "warning" ? "warn" : level](data && data.message ? data.message : data)

    params.level = level

    return Axios.post(`https://http-intake.logs.datadoghq.eu/v1/input`, data, {
        headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': DD_API_KEY
        },
        //ddtags=<TAGS>&ddsource=<SOURCE>&service=<SERVICE>&hostname=<HOSTNAME>
        params
    })
}

export default {
    info, warn, debug, error,
    warning: warn
}

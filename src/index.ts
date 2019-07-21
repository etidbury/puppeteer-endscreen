import * as path from 'path'

require('dotenv-safe').config({
    path: path.join(process.cwd(), '.env'),
    debug: process.env.DEBUG,
    allowEmptyValues: true
})

import * as puppeteer from 'puppeteer'

import { loadTestAction } from './lib/action';
import loginViaGoogle from './scripts/loginViaGoogle';


const { filterConsoleErrorNetworkInterrupts } = require('@etidbury/helpers/util/puppeteer')

const init = async () => {

    let browser
    try {


        browser = await puppeteer.launch({
            args: [
                '--start-fullscreen',
                //    "--disable-gpu",
                '--disable-setuid-sandbox',
                // "--force-device-scale-factor",
                '--ignore-certificate-errors',
                '--no-sandbox',
                // '--auto-open-devtools-for-tabs',
                '--disable-gpu',
                '--ignoreHTTPSErrors',
                // '--enable-features=NetworkService',
                '--allow-running-insecure-content',
                '--disable-web-security',



            ],
            headless: false,
            // dumpio:true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ? process.env.PUPPETEER_EXECUTABLE_PATH : undefined
        })

        //const page = await browser.targets()[browser.targets().length - 1].page()
        const page: puppeteer.Page = await browser.newPage()

        await page.setRequestInterception(true)
        await page.setDefaultNavigationTimeout(30 * 1000)

        // page.on('request', interceptedRequest => {
        //     console.debug('Intercepted request URL:', interceptedRequest.url())
        //     interceptedRequest.continue()

        // })

        page.on('response', interceptedRequest => {
            //console.debug('Intercepted response URL:', interceptedRequest.url())
        })

        //monitor for console errors
        const firedConsoleErrors = []
        page.on('console', async msg => {
            if (msg.type() === "error") {
                firedConsoleErrors.push(msg as never)
            }
        })

        //accept all dialogs
        page.on('dialog', async dialog => {
            try {

                console.log('dialog message:', dialog.message())
                await dialog.accept()

            } catch (err) {
                // do nothing
            }
        })

        await page.setViewport({ width: 1282, height: 701 })

        console.debug('Running scripts...')

        const action = await loadTestAction()

        await loginViaGoogle({ browser, page }, action)


        // if (filterConsoleErrorNetworkInterrupts(firedConsoleErrors).length) {
        //     console.error('Console errors during login!', filterConsoleErrorNetworkInterrupts(firedConsoleErrors))
        //     //await page.waitFor(240*1000)

        //     throw new Error(`Console errors occurred!`)
        // }

        browser.close()

        console.log('done')
        process.exit(0)

    } catch (err) {
        console.error('err', err)
        browser.close()
        process.exit(1)
    }




}

init()
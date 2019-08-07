import * as path from 'path'

require('dotenv-safe').config({
    path: path.join(process.cwd(), '.env'),
    debug: process.env.DEBUG,
    allowEmptyValues: true
})

import * as puppeteer from 'puppeteer'

import { loadAction, saveTestAction } from './lib/action';
import loginViaGoogle from './scripts/loginViaGoogle';
import createEndScreens from './scripts/createEndScreens';
import { createTestEndScreenCampaignAndAction } from './mock';



const { filterConsoleErrorNetworkInterrupts } = require('@etidbury/helpers/util/puppeteer')

const init = async () => {


    let browser
    try {


        if (process.env.MOCK_ACTION) {
            await createTestEndScreenCampaignAndAction()
        }
        if (process.env.SAVE_TEST_ACTION) {
            await saveTestAction(process.env.SAVE_TEST_ACTION)
        }

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
            //executablePath: 'google-chrome-stable'
        })

        //const page = await browser.targets()[browser.targets().length - 1].page()
        const page: puppeteer.Page = await browser.newPage()

        await page.setRequestInterception(true)
        await page.setDefaultNavigationTimeout(30 * 1000)

        const intReq = interceptedRequest => {
            // console.debug('Intercepted request URL:', interceptedRequest.url())

            interceptedRequest.continue()
        }
        page.removeListener('request', intReq)
        page.on('request', intReq)

        // //monitor for console errors
        // const firedConsoleErrors = []
        // page.on('console', async msg => {
        //     if (msg.type() === "error") {
        //         firedConsoleErrors.push(msg as never)
        //     }
        // })

        //accept all dialogs

        const onDialog = async dialog => {
            try {

                console.log('dialog message:', dialog.message())
                await dialog.accept()

            } catch (err) {
                // do nothing
            }
        }
        page.removeListener('dialog', onDialog)
        page.on('dialog', onDialog)

        await page.setViewport({ width: 1282, height: 701 })

        console.debug('Running scripts...')

        const action = await loadAction()

        await loginViaGoogle({ browser, page }, action)
        await createEndScreens({ browser, page }, action)


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
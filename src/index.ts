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
import { checkIsEndScreenCampaignMarkedAsCancelled } from './lib/api';



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
                // '--kiosk',
                // '--enable-kiosk-mode',
                /**
                 * https://unix.stackexchange.com/questions/273989/how-can-i-make-chromium-start-full-screen-under-x
                 */
                '--window-size=1980,1000',
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
            timeout: 60 * 1000,
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

        await page.setViewport({ width: 1920, height: 1000 })

        console.debug('Running scripts...')

        const action = await loadAction()

        const isEndScreenCampaignCancelled = await checkIsEndScreenCampaignMarkedAsCancelled(action.actionProps.endScreenCampaignId)

        if (isEndScreenCampaignCancelled) {
            console.log('End screen was cancelled. Exiting with code 0')
            process.exit(0)
            return
        }


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
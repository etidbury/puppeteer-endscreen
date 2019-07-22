import { ScriptArgs, EndScreenItem } from '../types'
import { generateEndScreenEditorURL } from '../lib/endscreen';
import { Action } from '../lib/action';
import { LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD } from '../config';
import { logEndScreenAction } from '../lib/logs';
const { interceptWaitForNetworkIdle } = require('@etidbury/helpers/util/puppeteer')

export default async ({ page }: ScriptArgs, action: Action) => {

    const homepage = generateEndScreenEditorURL(action.actionProps.endScreenCampaignItems[0].youtubeVideoId)

    await page.goto(homepage, { timeout: 60 * 1000 })
    console.debug('Waiting for network to be idle')
    //await interceptWaitForNetworkIdle(page, 5 * 1000)
    console.debug('Network now idle')

    const EXPECTED_TEXT = 'Sign in'

    const innerText = await page.evaluate((el) => {
        return el.innerText
    }, await page.$('body'))

    if (innerText.indexOf(EXPECTED_TEXT) <= -1) {
        throw new Error(`Failed to find text '${EXPECTED_TEXT}' in body`)
    }

    await page.waitFor(LOGIN_EMAIL_SELECTOR)

    await page.click(LOGIN_EMAIL_SELECTOR, { delay: 1000 })
    // await page.waitFor(3*1000)
    await page.type(LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME)

    await page.type(LOGIN_EMAIL_SELECTOR, String.fromCharCode(13), { delay: 1000 })

    logEndScreenAction('Login: Waiting for password input')



    await page.waitForSelector(LOGIN_PASSWORD_SELECTOR)

    await page.click(LOGIN_PASSWORD_SELECTOR)

    await page.type(LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD)
    await page.type(LOGIN_PASSWORD_SELECTOR, String.fromCharCode(13), { delay: 1000 })

    await interceptWaitForNetworkIdle(page, 5 * 1000)

    const afterLoginInputInnerText = await page.evaluate((el) => {
        return el.innerText
    }, await page.$('body'))

    const TEXT_SNIPPET_IDENTIFY_VERIFY_DEVICE = `Verify it's you\nThis device isn't recognized.`



    if (afterLoginInputInnerText.indexOf(TEXT_SNIPPET_IDENTIFY_VERIFY_DEVICE) > -1) {

        console.debug('Requires 2FA authentication via Google to proceed')
        await page.click('#authzenNext')

        //todo: send bot vnc link to slack with message about verification
        await page.waitFor(30 * 1000)

    }

    console.debug('Should be logged in now.')



}
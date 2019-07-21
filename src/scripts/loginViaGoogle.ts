import { ScriptArgs, EndScreenItem } from '../types'
import { generateEndScreenEditorURL } from '../lib/endscreen';
import { Action } from '../lib/action';
const { interceptWaitForNetworkIdle } = require('@etidbury/helpers/util/puppeteer')

export default async ({ page }: ScriptArgs, action: Action) => {

    const homepage = generateEndScreenEditorURL(action.actionProps.endScreenCampaignItems[0].youtubeVideoId)

    await page.goto(homepage, { timeout: 60 * 1000 })
    console.debug('Waiting for network to be idle')
    await interceptWaitForNetworkIdle(page, 5 * 1000)
    console.debug('Network now idle')


    const EXPECTED_TEXT = 'Test number from server'




    const innerText = await page.evaluate((el) => {
        return el.innerText
    }, await page.$('body'))

    if (innerText.indexOf(EXPECTED_TEXT) <= -1) {
        throw new Error(`Failed to find text 'Test number from server' in body`)
    }

}
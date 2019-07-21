import { ScriptArgs, EndScreenItem } from '../types'
import { generateEndScreenEditorURL, checkIsSaveButtonDisabled } from '../lib/endscreen';
import { Action } from '../lib/action';
import { LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD, EDITABLE_ELEMENT_SELECTOR, ENDCARD_SAFE_AREA_SELECTOR, MIN_ENDCARD_SAFEAREA_WIDTH, BTN_SAVE_SELECTOR } from '../config';
import { logEndScreenAction } from '../lib/logs';

import { createCards } from '../lib/endcards/create'
import { deleteEndCardElements } from '../lib/endcards/delete';
import { createLayout1, createLayout2 } from '../lib/endcards/layout';

const { interceptWaitForNetworkIdle } = require('@etidbury/helpers/util/puppeteer')

const PRIMARY_CARD_URL = 'https://www.youtube.com/watch?v=kO8fTk6oKQg'

export default async ({ page }: ScriptArgs, action: Action) => {


    for (let endScreenCampaignItemIndex = 0; endScreenCampaignItemIndex < action.actionProps.endScreenCampaignItems.length; endScreenCampaignItemIndex++) {

        try {


            const endScreenCampaignItem: EndScreenItem = action.actionProps.endScreenCampaignItems[endScreenCampaignItemIndex]

            const targetVideoEndscreenEditorURL = generateEndScreenEditorURL(endScreenCampaignItem.youtubeVideoId)

            const targetVideoId = endScreenCampaignItem.youtubeVideoId


            await page.goto(targetVideoEndscreenEditorURL)

            await interceptWaitForNetworkIdle(page, 5 * 1000)


            const playerGridSafeArea = await page.$(ENDCARD_SAFE_AREA_SELECTOR)
            if (!playerGridSafeArea) {
                throw Error('Failed to find playerGridSafeArea')
            }

            const endScreenSafeArea = await playerGridSafeArea.boundingBox()

            if (!endScreenSafeArea) {
                throw Error('Failed to find endScreenSafeArea')
            }

            logEndScreenAction(`End screen safe area width:${endScreenSafeArea.width} for video ${targetVideoId}`)

            if (endScreenSafeArea.width < MIN_ENDCARD_SAFEAREA_WIDTH) {

                logEndScreenAction(`End screen safe area not wide enough (min:${MIN_ENDCARD_SAFEAREA_WIDTH})for video ${targetVideoId}`, true)
                throw new Error('End screen safe area not wide enough')

            }


            await deleteEndCardElements(page)

            await createCards(page, {
                primaryCardURL: PRIMARY_CARD_URL,
                primaryCard: true,
                bestForViewerCard: true,
                subscribeCard: true
            })

            await createLayout1(page)



            const isSaveBtnDisabledFromLayout1 = await checkIsSaveButtonDisabled(page)


            let _usedLayout2 = false
            if (isSaveBtnDisabledFromLayout1) {
                // reset and create layout 2
                logEndScreenAction(`Save disabled. Attempt creating layout 2 for video ${targetVideoId}`)
                await deleteEndCardElements(page)

                await createCards(page, {
                    primaryCardURL: PRIMARY_CARD_URL,
                    primaryCard: true,
                    bestForViewerCard: true,
                    subscribeCard: false //dont add subscribe button
                })

                await page.waitFor(5 * 1000)

                await createLayout2(page)

                _usedLayout2 = true
            }


            const isSaveBtnDisabledFromAllLayouts = await checkIsSaveButtonDisabled(page)

            if (isSaveBtnDisabledFromAllLayouts) {
                logEndScreenAction('Save button still disabled')
                throw new Error(`Failed to create a layout suitable for video ${targetVideoId}`)
            }

            logEndScreenAction('Clicking save')

            await page.click(BTN_SAVE_SELECTOR)


        } catch (err) {
            console.error(err)
        }




    }
}
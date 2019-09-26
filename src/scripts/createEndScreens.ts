import { ScriptArgs, EndScreenItem } from '../types'
import { generateEndScreenEditorURL, checkIsSaveButtonDisabled } from '../lib/endscreen';
import { Action } from '../lib/action';
import { LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD, EDITABLE_ELEMENT_SELECTOR, ENDCARD_SAFE_AREA_SELECTOR, MIN_ENDCARD_SAFEAREA_WIDTH, BTN_SAVE_SELECTOR } from '../config';
import { logEndScreenAction } from '../lib/logs';

import { createCards } from '../lib/endcards/create'
import { deleteEndCardElements } from '../lib/endcards/delete';
import { createLayout1, createLayout2, createLayout3 } from '../lib/endcards/layout';
import { updateEndScreenItem, EndScreenItemUpdateProps, createEndScreenArchiveIfNotExists, checkIsEndScreenItemMarkedAsCancelled, checkIsEndScreenCampaignMarkedAsCancelled } from '../lib/api';
import { createEndScreenArchive } from '../lib/endcards/archive';

const { interceptWaitForNetworkIdle } = require('@etidbury/helpers/util/puppeteer')


export default async ({ page }: ScriptArgs, action: Action) => {


    const primaryCardURL = action.actionProps.endScreenCampaignPrimaryCardURL
    const secondaryCardURL = action.actionProps.endScreenCampaignSecondaryCardURL

    if (!primaryCardURL || !primaryCardURL.length) {
        throw new TypeError('Invalid endScreenCampaignPrimaryCardURL specified in action.actionProps')
    }

    let _endScreenCampaignIsCancelled


    for (let endScreenCampaignItemIndex = 0; endScreenCampaignItemIndex < action.actionProps.endScreenCampaignItems.length; endScreenCampaignItemIndex++) {

        if (_endScreenCampaignIsCancelled) {
            console.debug('Not continuing because campaign is cancelled...')
            break;
        }

        let _lastEndScreenCampaignItem: EndScreenItem | null = null

        let _lastEndScreenCampaignItemCancelled = false

        let _hasFailed = false
        let _endCardLayoutApplied: string | null = null



        try {


            const endScreenCampaignItem: EndScreenItem = action.actionProps.endScreenCampaignItems[endScreenCampaignItemIndex] as EndScreenItem

            const { updateEndScreenCampaignItem } = await updateEndScreenItem(endScreenCampaignItem, {
                isQueued: false,
                isProcessing: true,
                //hasFailed: false,
                hasExecuted: false
            })

            _lastEndScreenCampaignItem = updateEndScreenCampaignItem




            const endScreenItemIsCancelled = await checkIsEndScreenItemMarkedAsCancelled(endScreenCampaignItem)
            _endScreenCampaignIsCancelled = await checkIsEndScreenCampaignMarkedAsCancelled(action.actionProps.endScreenCampaignId)

            if (_endScreenCampaignIsCancelled || endScreenItemIsCancelled) {
                _lastEndScreenCampaignItemCancelled = true
            }

            if (_endScreenCampaignIsCancelled) {
                console.debug('End screen campaign has been cancelled')
                return
            }


            if (endScreenItemIsCancelled) {
                console.debug('End screen item has been cancelled', endScreenCampaignItem, 'Skipping...')
                continue;
            }

            const targetVideoEndscreenEditorURL = generateEndScreenEditorURL(endScreenCampaignItem.youtubeVideoId)

            const targetVideoId = endScreenCampaignItem.youtubeVideoId


            await page.goto(targetVideoEndscreenEditorURL)

            await interceptWaitForNetworkIdle(page, 5 * 1000)


            //createEndScreenArchiveIfNotExists




            // page.on('response', interceptedResponse => {

            //     //console.log('interceptrequest', interceptedRequest.url())


            //     if (interceptedResponse.url().toLowerCase().indexOf('youtube.com/endscreen_ajax') > -1) {
            //         console.debug('intercepted', interceptedResponse)
            //     }
            // })



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

            await createEndScreenArchive(page, endScreenCampaignItem)

            await deleteEndCardElements(page)

            const { createdSecondaryCard } = await createCards(page, {
                primaryCardURL,
                primaryCard: true,
                bestForViewerCard: true,
                subscribeCard: true,
                secondaryCard: !!secondaryCardURL && secondaryCardURL.length > 0,
                secondaryCardURL: secondaryCardURL
            })

            if (createdSecondaryCard) {
                await createLayout3(page)
                _endCardLayoutApplied = 'layout_3b'
            } else {
                await createLayout1(page)
                _endCardLayoutApplied = 'layout_1b'
            }


            const isSaveBtnDisabledFromLayout1 = await checkIsSaveButtonDisabled(page)

            if (isSaveBtnDisabledFromLayout1) {
                // reset and create layout 2
                logEndScreenAction(`Save disabled. Attempt creating layout 2 for video ${targetVideoId}`)
                await deleteEndCardElements(page)

                await createCards(page, {
                    primaryCardURL,
                    primaryCard: true,
                    bestForViewerCard: true,
                    subscribeCard: false, //dont add subscribe button,
                    secondaryCard: false
                })

                await page.waitFor(5 * 1000)

                await createLayout2(page)

                _endCardLayoutApplied = 'layout_2b'
            }



            const isSaveBtnDisabledFromAllLayouts = await checkIsSaveButtonDisabled(page)

            if (isSaveBtnDisabledFromAllLayouts) {
                logEndScreenAction('Save button still disabled')
                throw new Error(`Failed to create a layout suitable for video ${targetVideoId}`)
            }




            logEndScreenAction('Clicking save')

            await page.click(BTN_SAVE_SELECTOR)

            await interceptWaitForNetworkIdle(page, 5 * 1000)


        } catch (err) {
            console.error('Error occurred', err)
            _hasFailed = true
        } finally {

            if (_lastEndScreenCampaignItem) {

                const updateProps: EndScreenItemUpdateProps = {
                    isCancelled: _lastEndScreenCampaignItemCancelled,
                    isQueued: false,
                    hasFailed: _hasFailed,
                    hasExecuted: true,
                    isProcessing: false
                }

                if (_hasFailed) {
                    console.log('_lastEndScreenCampaignItem.failedAttempts', _lastEndScreenCampaignItem
                        , typeof _lastEndScreenCampaignItem.failedAttempts, _lastEndScreenCampaignItem.failedAttempts)
                    updateProps.failedAttempts = (_lastEndScreenCampaignItem.failedAttempts || 0) + 1
                    logEndScreenAction(`Failed attempts: ${updateProps.failedAttempts}`)
                } else {
                    if (_endCardLayoutApplied) {
                        updateProps.endCardLayoutApplied = _endCardLayoutApplied
                    }
                }


                if (_endScreenCampaignIsCancelled) {
                    updateProps.isCancelled = true
                }

                await updateEndScreenItem(_lastEndScreenCampaignItem, updateProps)

                _lastEndScreenCampaignItem = null

            }

            if (_endScreenCampaignIsCancelled) {
                console.debug('End screen campaign has been cancelled. Discontinuing...')
                break
            }


        }//end finally




    }//endfor 
}
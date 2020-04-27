import { ScriptArgs, EndScreenItem } from '../types'
import { generateEndScreenEditorURL, checkIsSaveButtonDisabled } from '../lib/endscreen';
import { Action } from '../lib/action';
import { LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD, EDITABLE_ELEMENT_SELECTOR, ENDCARD_SAFE_AREA_SELECTOR, MIN_ENDCARD_SAFEAREA_WIDTH, BTN_SAVE_SELECTOR, BTN_ENDSCREEN_EDITOR_OPEN_SELECTOR, ALERT_MESSAGE_SELECTOR } from '../config';
import { logEndScreenAction } from '../lib/logs';

import { createCards } from '../lib/endcards/create'
import { deleteEndCardElements } from '../lib/endcards/delete';
import { createLayout1, createLayout2, createLayout3, resetLayout3 } from '../lib/endcards/layout';
import { updateEndScreenItem, EndScreenItemUpdateProps, createEndScreenArchiveIfNotExists, checkIsEndScreenItemMarkedAsCancelled, checkIsEndScreenCampaignMarkedAsCancelled } from '../lib/api';
import { createEndScreenArchive } from '../lib/endcards/archive';
import { getDynamicArtistPlaylistIdByVideoId } from '../lib/dap'
import { getTopsifyAssignedPlaylistId } from '../lib/topsifyAssignedPlaylist';
import { getDAVByVideoId } from '../lib/dav';
import { recordAssignedEndCardHistory } from '../lib/assignedEndCardHistory';
const { interceptWaitForNetworkIdle } = require('@etidbury/helpers/util/puppeteer')

import logger from '../lib/dataDogLogHelper'


export default async ({ page }: ScriptArgs, action: Action) => {


    let _primaryCardURL = action.actionProps.endScreenCampaignPrimaryCardURL
    let _secondaryCardURL = action.actionProps.endScreenCampaignSecondaryCardURL

    let endScreenCampaignId = action.actionProps.endScreenCampaignId
    //console.log('_secondaryCardURL:', _secondaryCardURL)

    if (!_primaryCardURL || !_primaryCardURL.length) {
        throw new TypeError('Invalid endScreenCampaignPrimaryCardURL specified in action.actionProps')
    }




    let _endScreenCampaignIsCancelled


    for (let endScreenCampaignItemIndex = 0; endScreenCampaignItemIndex < action.actionProps.endScreenCampaignItems.length; endScreenCampaignItemIndex++) {

        //reset
        _primaryCardURL = action.actionProps.endScreenCampaignPrimaryCardURL
        _secondaryCardURL = action.actionProps.endScreenCampaignSecondaryCardURL


        if (_endScreenCampaignIsCancelled) {

            console.debug('Not continuing because campaign is cancelled...')
            await logger.debug('createEndScreens.default(): Not continuing because campaign is cancelled...', __filename)
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
            _endScreenCampaignIsCancelled = await checkIsEndScreenCampaignMarkedAsCancelled(endScreenCampaignId)

            if (_endScreenCampaignIsCancelled || endScreenItemIsCancelled) {
                _lastEndScreenCampaignItemCancelled = true
            }

            if (_endScreenCampaignIsCancelled) {
                await logger.debug(`createEndScreens.default(): End screen campaign has been cancelled`, __filename)
                return
            }


            if (endScreenItemIsCancelled) {
                await logger.debug(`createEndScreens.default(): End screen item has been cancelled: ${endScreenCampaignItem.id}...Skipping...`, __filename)
                continue;
            }

            const targetVideoEndscreenEditorURL = generateEndScreenEditorURL(endScreenCampaignItem.youtubeVideoId)

            const targetVideoId = endScreenCampaignItem.youtubeVideoId







            //getDAVByVideoId

            // if (_secondaryCardURL && _secondaryCardURL.length && _secondaryCardURL.trim().toLowerCase() === "auto-dap") {

            //     logEndScreenAction(`Looking up DAP from API: ${targetVideoId}`)

            //     try {

            //         const dynamicArtistPlaylistId = await getDynamicArtistPlaylistIdByVideoId(targetVideoId)

            //         if (dynamicArtistPlaylistId && dynamicArtistPlaylistId.length) {
            //             _secondaryCardURL = `https://www.youtube.com/playlist?list=${dynamicArtistPlaylistId}`
            //         } else {
            //             logEndScreenAction(`Failed to determine artist playlist from video ID: ${targetVideoId}`)
            //         }

            //     } catch (err) {
            //         console.error('err', err)
            //         logEndScreenAction(`Failed to determine artist playlist from video ID: ${targetVideoId}`)
            //         _secondaryCardURL = ""
            //     }
            // }


            let _dynamicYouTubeVideoId = ""
            if (_primaryCardURL && _primaryCardURL.length && _primaryCardURL.trim().toLowerCase() === "auto-dav") {

                await logger.debug(`createEndScreens.default(): Looking up DAV from API: ${targetVideoId}`, __filename)


                try {

                    _dynamicYouTubeVideoId = await getDAVByVideoId(targetVideoId)

                    if (_dynamicYouTubeVideoId && _dynamicYouTubeVideoId.length) {
                        _primaryCardURL = `https://www.youtube.com/watch?v=${_dynamicYouTubeVideoId}`
                    } else {
                        await logger.warn(`createEndScreens.default(): Failed to determine dynamic video from video ID: ${targetVideoId}`, __filename)
                    }

                } catch (err) {
                    console.error('err', err && err.response && err.response.data || err && err.response || err)

                    await logger.warn(`createEndScreens.default(): Failed to determine dynamic video from video ID: ${targetVideoId} - ${err && err.response && err.response.data ? JSON.stringify(err.response.data) : err.message}`, __filename)

                    //throw new Error(`Failed to determine Topsify playlist from video ID: ${targetVideoId}`)
                    _primaryCardURL = ""
                }
            }


            let _topsifyAssignedPlaylistId = ""
            if (_secondaryCardURL && _secondaryCardURL.length && _secondaryCardURL.trim().toLowerCase() === "auto-tp") {

                await logger.debug(`createEndScreens.default(): Looking up Topsify assigned playlist from API: ${targetVideoId}`, __filename)

                try {

                    _topsifyAssignedPlaylistId = await getTopsifyAssignedPlaylistId(targetVideoId)

                    if (_topsifyAssignedPlaylistId && _topsifyAssignedPlaylistId.length) {
                        _secondaryCardURL = `https://www.youtube.com/playlist?list=${_topsifyAssignedPlaylistId}`
                        await logger.debug(`createEndScreens.default(): Using assigned Topsify playlist URL: ${_secondaryCardURL}`, __filename)
                    } else {
                        throw new Error(`createEndScreens.default(): Failed to determine Topsify playlist from video ID: ${targetVideoId}`)
                    }



                } catch (err) {


                    await logger.warn(`createEndScreens.default(): Error determining secondary card url for video ID: ${targetVideoId}: ${err && err.response && err.response.data ? JSON.stringify(err.response.data) : err.message}`, __filename)

                    console.error('createEndScreens.default(): Error: ', err && err.response && err.response.data || err && err.response || err)
                    //throw new Error(`Failed to determine Topsify playlist from video ID: ${targetVideoId}`)
                    _secondaryCardURL = ""
                }

            }


            /**
             * If second card URL available, use as primary and remove secondary.
             * e.g. if the Topsify playlist is obtained but DAV is not, use Topsify playlist instead and default to 3 layout
             */
            if ((!_primaryCardURL || !_primaryCardURL.length) && _secondaryCardURL && _secondaryCardURL.length) {
                _primaryCardURL = _secondaryCardURL
                _secondaryCardURL = ""
            }



            if (!_primaryCardURL || !_primaryCardURL.length) {
                throw new Error(`createEndScreens.default(): No primary card URL found for video ID: ${targetVideoId}`)
            }

            await page.goto(targetVideoEndscreenEditorURL)

            await interceptWaitForNetworkIdle(page, 5 * 1000)



            //check endscreen is an option/disabled
            const isEndScreenEditorLinkDisabledOrError = await page.evaluate(() => {

                try {
                    //@ts-ignore
                    return document.querySelector('#endscreen-editor-link').querySelector('.ytcp-text-dropdown-trigger').hasAttribute('disabled')
                } catch (err) {
                    console.error("Error", err)
                    return true
                }
            })

            if (isEndScreenEditorLinkDisabledOrError) {
                await logger.debug(`createEndScreens.default(): Endscreen not supported for video ID: ${targetVideoId}`)
                continue;
            }


            //open endscreen editor modal
            await page.click(BTN_ENDSCREEN_EDITOR_OPEN_SELECTOR)


            await interceptWaitForNetworkIdle(page, 5 * 1000)


            //createEndScreenArchiveIfNotExists




            // page.on('response', interceptedResponse => {

            //     //console.log('interceptrequest', interceptedRequest.url())


            //     if (interceptedResponse.url().toLowerCase().indexOf('youtube.com/endscreen_ajax') > -1) {
            //         console.debug('intercepted', interceptedResponse)
            //     }
            // })



            //  .edit-overlay

            const playerGridSafeArea = await page.$(ENDCARD_SAFE_AREA_SELECTOR)
            if (!playerGridSafeArea) {
                throw Error('Failed to find playerGridSafeArea')
            }

            const endScreenSafeArea = await playerGridSafeArea.boundingBox()

            if (!endScreenSafeArea) {
                throw Error('Failed to find endScreenSafeArea')
            }

            await logger.debug(`createEndScreens.default(): End screen safe area width:${endScreenSafeArea.width} for video ID: ${targetVideoId}`, __filename)



            if (endScreenSafeArea.width < MIN_ENDCARD_SAFEAREA_WIDTH) {

                await logger.debug(`createEndScreens.default(): End screen safe area not wide enough (min:${MIN_ENDCARD_SAFEAREA_WIDTH}) for video ${targetVideoId}. Currently: ${endScreenSafeArea.width}`, __filename)
                throw new Error(`createEndScreens.default(): End screen safe area not wide enough for video ID: ${targetVideoId}`)

            }

            try {

                await createEndScreenArchive(page, endScreenCampaignItem)

            } catch (err) {
                await logger.warn(`createEndScreens.default(): Failed to store archive for video ID: ${targetVideoId}. Ignoring...`, __filename)
            }


            //open endscreen editor modal
            await page.click(BTN_ENDSCREEN_EDITOR_OPEN_SELECTOR)
            await page.waitFor(2 * 1000)


            await deleteEndCardElements(page)

            let _hasFailedToCreateInitialCards = false

            let _createdSecondaryCard = false

            try {

                const { createdSecondaryCard } = await createCards(page, {
                    primaryCardURL: _primaryCardURL,
                    primaryCard: true,
                    bestForViewerCard: true,
                    subscribeCard: true,
                    secondaryCard: !!_secondaryCardURL && _secondaryCardURL.length > 0,
                    secondaryCardURL: _secondaryCardURL
                })
                _endCardLayoutApplied = "layout_4a"
                _createdSecondaryCard = createdSecondaryCard

            } catch (err) {
                //console.log('err', err)

                await logger.warn(`createEndScreens.default(): Failed to create initial cards for video ID: ${targetVideoId}: ${err.message}`, __filename)

                _hasFailedToCreateInitialCards = true
            }


            const alertErrorElementText = await page.evaluate((el) => {
                return el.innerText
            }, await page.$(ALERT_MESSAGE_SELECTOR))

            // const alertErrorElements = await page.evaluate(
            //     () => {

            //         const el = document.querySelector('.yt-alert-content')


            //         console.log('el', el)

            //         return el
            //     }
            // )

            const hasExceededMaxNumElements = alertErrorElementText.length

            //const hasExceededMaxNumElements = false

            if (hasExceededMaxNumElements) {

                await logger.warn(`createEndScreens.default(): Has found error message specifying exceeded max number of elements for video ID: ${targetVideoId}. alertErrorElementText: ${alertErrorElementText}`, __filename)
                // logEndScreenAction("Has found error message specifying exceeded max number of elements")
                // logEndScreenAction(`alertErrorElementText: ${alertErrorElementText}`)
                _hasFailedToCreateInitialCards = true
            }

            // if (!_hasFailedToCreateInitialCards) {

            //     if (_createdSecondaryCard) {

            //         // await resetLayout3(page)
            //         await createLayout3(page)
            //         _endCardLayoutApplied = 'layout_3b'
            //     } else {
            //         await createLayout1(page)
            //         _endCardLayoutApplied = 'layout_1b'
            //     }
            // }

            // if (_hasFailedToCreateInitialCards) {

            //     logEndScreenAction("Closing select element overlay")

            //     await page.evaluate(
            //         () => {
            //             const el = document.getElementsByClassName('yt-uix-overlay-close')[0]


            //             //@ts-ignore
            //             el.click()
            //         }
            //     )

            //     await page.waitFor(1000)

            // }




            if (_hasFailedToCreateInitialCards) {



                // await logger.debug(`Failed to create all initial cards.`)

                await logger.debug(`createEndScreens.default(): Attempt creating layout 1 for video ID: ${targetVideoId}`, __filename)

                // if (_createdSecondaryCard) {
                //     await createLayout3(page)
                //     _endCardLayoutApplied = 'layout_3b'
                // } else {
                await createLayout1(page)
                _endCardLayoutApplied = 'layout_1b'


                const isSaveBtnDisabledFromLayout1 = await checkIsSaveButtonDisabled(page)


                if (isSaveBtnDisabledFromLayout1) {


                    // reset and create layout 2

                    await logger.debug(`createEndScreens.default(): Save disabled. Fallback to layout 2 not yet implemented for video ID: ${targetVideoId}`, __filename)

                    throw new Error(`createEndScreens.default(): Fallback to layout 2 not yet implemented. Video ID: ${targetVideoId}`)

                    // logEndScreenAction(`Save disabled. Attempt creating layout 2 for video ${targetVideoId}`)
                    // await deleteEndCardElements(page)

                    // await createCards(page, {
                    //     primaryCardURL: _primaryCardURL,
                    //     primaryCard: true,
                    //     bestForViewerCard: true,
                    //     subscribeCard: false, //dont add subscribe button,
                    //     secondaryCard: false
                    // })

                    // await page.waitFor(5 * 1000)

                    // await createLayout2(page)

                    // _endCardLayoutApplied = 'layout_2b'
                }
            }


            const isSaveBtnDisabledFromAllLayouts = await checkIsSaveButtonDisabled(page)

            if (isSaveBtnDisabledFromAllLayouts) {
                //logEndScreenAction('Save button still disabled')
                await logger.debug(`createEndScreens.default(): Save button still disabled for video ID: ${targetVideoId}`, __filename)
                throw new Error(`createEndScreens.default(): Failed to create a layout suitable for video ID: ${targetVideoId}`)
            }

            //logEndScreenAction('Clicking save')
            await logger.debug(`createEndScreens.default(): Clicking save for video ID: ${targetVideoId}`, __filename)

            await page.click(BTN_SAVE_SELECTOR)




            await interceptWaitForNetworkIdle(page, 5 * 1000)


            const annotationStatusError = await page.evaluate(
                () => {
                    const el = document.querySelector('.annotator-status-save') as any

                    return el && el.innerHTML
                }
            )


            if (annotationStatusError && annotationStatusError.length &&
                annotationStatusError.toLowerCase().indexOf('all changes saved') <= -1) {

                await logger.warn(`createEndScreens.default(): Status error from YT: '${annotationStatusError}' for video ID: ${targetVideoId}`, __filename)


                // reset and create layout 2
                await logger.debug(`createEndScreens.default(): Attempt creating layout 2 for video ID: ${targetVideoId}`, __filename)
                await deleteEndCardElements(page)

                await createCards(page, {
                    primaryCardURL: _primaryCardURL,
                    primaryCard: true,
                    bestForViewerCard: true,
                    subscribeCard: false, //dont add subscribe button,
                    secondaryCard: false
                })

                await page.waitFor(5 * 1000)

                await createLayout2(page)

                _endCardLayoutApplied = 'layout_2b'


                const isSaveBtnDisabledFromAllLayouts = await checkIsSaveButtonDisabled(page)

                if (isSaveBtnDisabledFromAllLayouts) {
                    await logger.debug(`createEndScreens.default(): Save button still disabled for video ID: ${targetVideoId}`, __filename)
                    throw new Error(`createEndScreens.default(): Failed to create a layout suitable for video ID: ${targetVideoId}`)
                }


                await logger.debug(`createEndScreens.default(): Re-clicking save for video ID: ${targetVideoId}`, __filename)

                await page.click(BTN_SAVE_SELECTOR)



                //throw new Error(`Status error from YT: '${annotationStatusError}'`)
            }

            let assignedEndCardHistory

            try {

                assignedEndCardHistory = {
                    targetYouTubeVideoId: targetVideoId,
                    playlistCardYouTubePlaylistId: _topsifyAssignedPlaylistId,
                    videoCardYouTubeVideoId: _dynamicYouTubeVideoId,
                    endCardLayoutApplied: _endCardLayoutApplied || "",
                    assignedAt: new Date().toISOString(),
                    endscreenCampaignIdReference: endScreenCampaignId
                }


                if (
                    (
                        assignedEndCardHistory.playlistCardYouTubePlaylistId && assignedEndCardHistory.playlistCardYouTubePlaylistId.length
                    )
                    ||
                    (assignedEndCardHistory.videoCardYouTubeVideoId && assignedEndCardHistory.videoCardYouTubeVideoId.length)
                ) {
                    await recordAssignedEndCardHistory(assignedEndCardHistory)
                    await logger.info(`Updated assigned end card history for youtube video ID: ${targetVideoId} - ${JSON.stringify(assignedEndCardHistory)}`, __filename)

                } else {
                    //console.warn("assignedEndCardHistory: No cards specified, therefore skipping")
                    await logger.debug(`createEndScreens.default(): assignedEndCardHistory: No cards specified for video ID: ${targetVideoId}, therefore skipping`, __filename)
                }


            } catch (err) {
                //fatal error, but shouldnt record as error as end card may have been successfully updated.
                console.error("Failed to record assigned end card history:")
                console.error(err)
                await logger.error(`createEndScreens.default(): Failed to record assigned end card history for video ID: ${targetVideoId} - assignedEndCardHistory:${JSON.stringify(assignedEndCardHistory)}`, __filename)

            }







        } catch (err) {

            console.error('Error occurred', err)
            await logger.error(`createEndScreens.default(): Fatal error: ${err.message}`, __filename)
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
                    // console.log('_lastEndScreenCampaignItem.failedAttempts', _lastEndScreenCampaignItem
                    //     , typeof _lastEndScreenCampaignItem.failedAttempts, _lastEndScreenCampaignItem.failedAttempts)
                    updateProps.failedAttempts = (_lastEndScreenCampaignItem.failedAttempts || 0) + 1
                    //logEndScreenAction(`Failed attempts: ${updateProps.failedAttempts}`)

                    if (updateProps.failedAttempts > 1) {
                        await logger.warn(`createEndScreens.default(): Failed attempts more than 1: ${updateProps.failedAttempts}`, __filename)
                    } else {
                        await logger.debug(`createEndScreens.default(): Failed attempts: ${updateProps.failedAttempts}`, __filename)
                    }

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

                await logger.debug(`createEndScreens.default(): End screen campaign has been cancelled. Discontinuing...`, __filename)
                //console.debug('End screen campaign has been cancelled. Discontinuing...')
                break
            }


        }//end finally




    }//endfor 
}
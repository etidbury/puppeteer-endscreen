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

            console.log('>>>>>>updateEndScreenCampaignItem', updateEndScreenCampaignItem)
            _lastEndScreenCampaignItem = updateEndScreenCampaignItem




            const endScreenItemIsCancelled = await checkIsEndScreenItemMarkedAsCancelled(endScreenCampaignItem)
            _endScreenCampaignIsCancelled = await checkIsEndScreenCampaignMarkedAsCancelled(endScreenCampaignId)

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

                logEndScreenAction(`Looking up DAP from API: ${targetVideoId}`)

                try {

                    _dynamicYouTubeVideoId = await getDAVByVideoId(targetVideoId)

                    if (_dynamicYouTubeVideoId && _dynamicYouTubeVideoId.length) {
                        _primaryCardURL = `https://www.youtube.com/watch?v=${_dynamicYouTubeVideoId}`
                    } else {
                        logEndScreenAction(`Failed to determine dynamic video from video ID: ${targetVideoId}`)
                    }

                } catch (err) {
                    console.error('err', err)
                    logEndScreenAction(`Failed to determine dynamic video from video ID: ${targetVideoId}`)
                    //throw new Error(`Failed to determine Topsify playlist from video ID: ${targetVideoId}`)
                    _primaryCardURL = ""
                }
            }


            let _topsifyAssignedPlaylistId = ""
            if (_secondaryCardURL && _secondaryCardURL.length && _secondaryCardURL.trim().toLowerCase() === "auto-tp") {

                logEndScreenAction(`Looking up Topsify assigned playlist from API: ${targetVideoId}`)

                try {

                    _topsifyAssignedPlaylistId = await getTopsifyAssignedPlaylistId(targetVideoId)

                    if (_topsifyAssignedPlaylistId && _topsifyAssignedPlaylistId.length) {
                        _secondaryCardURL = `https://www.youtube.com/playlist?list=${_topsifyAssignedPlaylistId}`
                        logEndScreenAction(`Using assigned Topsify playlist URL: ${_secondaryCardURL}`)
                    } else {
                        throw new Error(`Failed to determine Topsify playlist from video ID: ${targetVideoId}`)
                    }



                } catch (err) {
                    console.error('err', err)
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
                throw new Error("No primary card URL found!")
            }

            await page.goto(targetVideoEndscreenEditorURL)

            await interceptWaitForNetworkIdle(page, 5 * 1000)




            //open endscreen editor modal
            await page.click(BTN_ENDSCREEN_EDITOR_OPEN_SELECTOR)
            await page.waitFor(2 * 1000)


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

            logEndScreenAction(`End screen safe area width:${endScreenSafeArea.width} for video ${targetVideoId}`)

            if (endScreenSafeArea.width < MIN_ENDCARD_SAFEAREA_WIDTH) {

                logEndScreenAction(`End screen safe area not wide enough (min:${MIN_ENDCARD_SAFEAREA_WIDTH})for video ${targetVideoId}. Currently: ${endScreenSafeArea.width}`, true)
                throw new Error('End screen safe area not wide enough')

            }

            try {

                await createEndScreenArchive(page, endScreenCampaignItem)

            } catch (err) {
                console.warn("Failed to store archive. Ignoring...")
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
                console.log('err', err)
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
                logEndScreenAction("Has found error message specifying exceeded max number of elements")
                logEndScreenAction(`alertErrorElementText: ${alertErrorElementText}`)
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

                logEndScreenAction('Failed to create all initial cards.')

                logEndScreenAction(`Attempt creating layout 1 for video ${targetVideoId}`)

                // if (_createdSecondaryCard) {
                //     await createLayout3(page)
                //     _endCardLayoutApplied = 'layout_3b'
                // } else {
                await createLayout1(page)
                _endCardLayoutApplied = 'layout_1b'


                const isSaveBtnDisabledFromLayout1 = await checkIsSaveButtonDisabled(page)


                if (isSaveBtnDisabledFromLayout1) {


                    // reset and create layout 2

                    logEndScreenAction(`Save disabled. Fallback to layout 2 not yet implemented: ${targetVideoId}`)
                    throw new Error("Fallback to layout 2 not yet implemented.")

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
                logEndScreenAction('Save button still disabled')
                throw new Error(`Failed to create a layout suitable for video ${targetVideoId}`)
            }

            logEndScreenAction('Clicking save')

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

                logEndScreenAction(`Status error from YT: '${annotationStatusError}'`)

                // reset and create layout 2
                logEndScreenAction(`Attempt creating layout 2 for video ${targetVideoId}`)
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
                    logEndScreenAction('Save button still disabled')
                    throw new Error(`Failed to create a layout suitable for video ${targetVideoId}`)
                }


                logEndScreenAction('Re-clicking save')

                await page.click(BTN_SAVE_SELECTOR)



                //throw new Error(`Status error from YT: '${annotationStatusError}'`)
            }


            try {

                const assignedEndCardHistory = {
                    targetYouTubeVideoId: targetVideoId,
                    playlistCardYouTubePlaylistId: _topsifyAssignedPlaylistId,
                    videoCardYouTubeVideoId: _dynamicYouTubeVideoId,
                    endCardLayoutApplied: _endCardLayoutApplied || "",
                    assignedAt: new Date().toISOString(),
                    endscreenCampaignIdReference: endScreenCampaignId
                }

                console.debug('assignedEndCardHistory', assignedEndCardHistory)

                if (
                    (
                        assignedEndCardHistory.playlistCardYouTubePlaylistId && assignedEndCardHistory.playlistCardYouTubePlaylistId.length
                    )
                    ||
                    (assignedEndCardHistory.videoCardYouTubeVideoId && assignedEndCardHistory.videoCardYouTubeVideoId.length)
                ) {
                    await recordAssignedEndCardHistory(assignedEndCardHistory)
                } else {
                    console.warn("assignedEndCardHistory: No cards specified, therefore skipping")
                }


            } catch (err) {
                //fatal error, but shouldnt record as error as end card may have been successfully updated.
                console.error("Failed to record assigned end card history:")
                console.error(err)
            }







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
import puppeteer from 'puppeteer'
import { EndScreenItem } from '../../types'
import { createEndScreenArchiveIfNotExists } from '../api'
import { EDITABLE_ELEMENT_SELECTOR, BTN_SAVE_SELECTOR } from '../../config';
import { logEndScreenAction } from '../logs'
import { checkIsSaveButtonDisabled } from '../endscreen';

const _interceptEndCardSave = async (page: puppeteer.Page, endScreenCampaignItem: EndScreenItem) => {


    let _finished


    await new Promise((resolve, reject) => {


        const _resolve = (e?: any) => {
            _finished = true
            resolve(e)
        }
        const _reject = (e?: any) => {
            _finished = true
            reject(e)
        }

        setTimeout(_reject, 30 * 1000)


        page.on('request', async interceptedRequest => {

            //todo: find a way of improving this e.g. by using page.off('request')
            if (_finished) {
                return
            }

            try {


                const post = interceptedRequest.postData() as any

                if (interceptedRequest.url().toLowerCase().indexOf('youtube.com/endscreen_ajax') > -1

                    // && post && post.indexOf('endscreen=') > -1
                ) {



                    if (!post) {
                        return
                    }

                    try {

                        let endScreenData = JSON.parse(post)

                        if (endScreenData.elements && endScreenData.elements.length) {

                            await createEndScreenArchiveIfNotExists(endScreenCampaignItem, endScreenData).catch((err) => {
                                _reject(err)
                            })

                            _resolve()
                        }

                    } catch (err) {
                        //if failed to pass, treat as an endscreen_ajax update that is not relevant.
                        console.error('Failed to parse end screen post data. Ignoring')

                    }



                }
            } catch (err) {
                console.error('Failed to save end screen post data')
                _reject(err)
            }
        })


    })

}

const _triggerEnableEndCardSaving = async (page: puppeteer.Page) => {

    console.debug('deleteEndCardElements(): Started')

    const afterNetworkIdleInnerText = await page.evaluate((el) => {
        return el.innerText
    }, await page.$('body'))

    //todo: make more verbose
    const TEXT_SNIPPET_IDENTIFY_ENDSCREEN_PAGE = `Preview`

    if (afterNetworkIdleInnerText.indexOf(TEXT_SNIPPET_IDENTIFY_ENDSCREEN_PAGE) <= -1) {
        throw new Error('Current page does not seem to be expected Endscreen page')
    }


    let editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)

    logEndScreenAction(`_triggerEnableEndCardSaving(): Found ${editableElements.length} end card elements`)

    if (editableElements.length) {

        editableElements[0].click()

        await page.waitFor(2 * 1000)

        const isSaveBtnDisabled = await checkIsSaveButtonDisabled(page)

        if (isSaveBtnDisabled) {
            throw new Error('_triggerEnableEndCardSaving(): Failed to trigger enable saving. Save button still disabled')
        }



    } else {
        throw new Error('Failed to find any editable elements')
    }


}


export const createEndScreenArchive = async (page: puppeteer.Page, endScreenCampaignItem: EndScreenItem) => {



    await _triggerEnableEndCardSaving(page)

    logEndScreenAction('Clicking save for archiving')
    await page.click(BTN_SAVE_SELECTOR)


    await _interceptEndCardSave(page, endScreenCampaignItem)

    await page.waitFor(2 * 1000)

}
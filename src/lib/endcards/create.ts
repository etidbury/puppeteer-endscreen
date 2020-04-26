import puppeteer, { Page, ElementHandle } from 'puppeteer'
import { logEndScreenAction } from "../logs";
import { INPUT_VIDEO_URL_SELECTOR, ENDSCREEN_EDITOR_ADD_ELEMENT_SELECTOR, BTN_OPTION_CREATE_ENDCARD_VIDEO_CV_SELECTOR, BTN_OPTION_CREATE_ENDCARD_VIDEO_SELECTOR, BTN_OPTION_CREATE_ENDCARD_PLAYLIST_SELECTOR, BTN_OPTION_CREATE_ENDCARD_VIDEO_BFV_SELECTOR, BTN_OPTION_CREATE_ENDCARD_SUBSCRIBE_SELECTOR, EDITABLE_ELEMENT_SELECTOR } from "../../config";
import { moveEditableElementToPosition, EndCardPosition } from './layout';
import logger from '../dataDogLogHelper'


const CREATE_BTNS_SELECTOR = '.annotator-create-button'

export interface CreateCardOptions {
    primaryCardURL: string,
    primaryCard: boolean,
    bestForViewerCard: boolean,
    subscribeCard: boolean,
    secondaryCard: boolean,
    secondaryCardURL?: string
}

const _initCreateAddElement = async (page: Page) => {
    //logEndScreenAction('Create/Add End card element: Processing...')
    await logger.debug(`_initCreateAddElement(): Create/Add End card element: Processing...`, __filename)

    await page.waitForSelector(ENDSCREEN_EDITOR_ADD_ELEMENT_SELECTOR)
    await page.click(ENDSCREEN_EDITOR_ADD_ELEMENT_SELECTOR)
    await page.waitFor(2 * 1000)
}

const _createVideoOrPlaylistEndCardType = async (page: Page, idOrURL: string) => {

    if (idOrURL.indexOf("/watch?") > -1) {

        await page.click(BTN_OPTION_CREATE_ENDCARD_VIDEO_SELECTOR)
        await page.waitFor(2 * 1000)
        await page.click(BTN_OPTION_CREATE_ENDCARD_VIDEO_CV_SELECTOR)
        await page.waitFor(2 * 1000)
    } else if (idOrURL.indexOf("/playlist") > -1) {

        await page.click(BTN_OPTION_CREATE_ENDCARD_PLAYLIST_SELECTOR)
        await page.waitFor(2 * 1000)

    } else {
        throw new Error("_createVideoOrPlaylistEndCardType(): Could not identify end card type")
    }


    const targetInput = await page.$('#search-any')


    if (targetInput) {
        await targetInput.click()
        await targetInput.type(`${idOrURL}`)
        await targetInput.type(String.fromCharCode(13))
    } else {
        throw new Error("_createVideoOrPlaylistEndCardType(): Failed to find search any input")
    }

    await page.waitFor(3 * 1000)

    //first option from search results
    await page.click('.ytcp-entity-card')
}


export const _getLastCreatedEndCardElement = async (page: Page): Promise<ElementHandle> => {
    const endCardElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)
    return endCardElements[endCardElements.length - 1]
}

export const createCards = async (page: puppeteer.Page, { primaryCardURL, primaryCard = false,
    bestForViewerCard = false, subscribeCard = false,
    secondaryCard = false, secondaryCardURL
}: CreateCardOptions): Promise<{
    createdSecondaryCard: boolean
}> => {

    let inputs
    let createBtns

    let _createdSecondaryCard = false

    //todo: testing,remove after use
    secondaryCard = false


    if (primaryCard) {

        //logEndScreenAction('Create primary card element: primaryCardURL - Processing...')
        await logger.debug(`createCards(): Create primary card element: primaryCardURL - Processing...`, __filename)

        await _initCreateAddElement(page)

        await _createVideoOrPlaylistEndCardType(page, primaryCardURL)

        // await page.waitForSelector(CREATE_BTNS_SELECTOR)
        // await page.click(CREATE_BTNS_SELECTOR)
        // await page.waitForSelector('#annotator-video-type-fixed')
        // await page.click('#annotator-video-type-fixed')
        // await page.waitForSelector('#annotator-video-type-fixed')
        // await page.click('#annotator-video-type-fixed')
        // await page.waitFor(2 * 1000)
        // inputs = await page.$$(INPUT_VIDEO_URL_SELECTOR)


        // await page.$eval(INPUT_VIDEO_URL_SELECTOR, (el, value) => {
        //     //@ts-ignore
        //     el.value = value
        // }, `${primaryCardURL}${String.fromCharCode(13)}`);



        // const targetinput = await page.evaluate(
        //     (targetInput) => {
        //         return targetInput
        //     }
        //     , targetInput)

        // console.log('trareti', targetInput)





        await page.waitFor(2 * 1000)



        await moveEditableElementToPosition(
            page,
            await _getLastCreatedEndCardElement(page),
            secondaryCard ? EndCardPosition.TOP_RIGHT : EndCardPosition.MIDDLE_RIGHT
        )

        await logger.debug(`createCards(): Create Primary End Card element: Complete`, __filename)

        await page.waitFor(5 * 1000)
    }

    if (bestForViewerCard) {

        // create auto suggested video card (best for viewer)
        await logger.debug(`createCards(): Create Best for Viewer End Card element: Processing...`, __filename)

        await _initCreateAddElement(page)

        await page.click(BTN_OPTION_CREATE_ENDCARD_VIDEO_SELECTOR)
        await page.waitFor(2 * 1000)
        await page.click(BTN_OPTION_CREATE_ENDCARD_VIDEO_BFV_SELECTOR)
        await page.waitFor(2 * 1000)

        await moveEditableElementToPosition(
            page,
            await _getLastCreatedEndCardElement(page),
            EndCardPosition.BOTTOM_LEFT
        )
        await logger.debug(`createCards(): Create Best for Viewer End Card element: Complete`, __filename)

    }

    // create a subscription card
    if (subscribeCard) {

        await logger.debug(`createCards(): Create Subscribe End Card element: Processing...`, __filename)


        await _initCreateAddElement(page)

        await page.click(BTN_OPTION_CREATE_ENDCARD_SUBSCRIBE_SELECTOR)


        await moveEditableElementToPosition(
            page,
            await _getLastCreatedEndCardElement(page),
            EndCardPosition.TOP_LEFT
        )

        await logger.debug(`createCards(): Create Subscribe End Card element: Complete`, __filename)
    }




    try {


        if (secondaryCard && secondaryCardURL) {

            // create specific video url end screen screen
            await logger.debug(`createCards(): Create secondary card element: secondaryCardURL - Processing...`, __filename)

            await _initCreateAddElement(page)


            await _createVideoOrPlaylistEndCardType(page, secondaryCardURL)


            await page.waitFor(5 * 1000)
            _createdSecondaryCard = true

            await moveEditableElementToPosition(
                page,
                await _getLastCreatedEndCardElement(page),
                EndCardPosition.BOTTOM_RIGHT
            )

            await logger.debug(`createCards(): Create secondary card element: secondaryCardURL - Complete`, __filename)

        }
    } catch (err) {
        await logger.warn(`createCards(): Failed to create secondary card: ${err.message} Skipping...`, __filename)
    }

    return {
        createdSecondaryCard: _createdSecondaryCard
    }



}
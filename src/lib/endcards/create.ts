import puppeteer from 'puppeteer'
import { logEndScreenAction } from "../logs";
import { INPUT_VIDEO_URL_SELECTOR } from "../../config";


const CREATE_BTNS_SELECTOR = '.annotator-create-button'

export interface CreateCardOptions {
    primaryCardURL: string,
    primaryCard: boolean,
    bestForViewerCard: boolean,
    subscribeCard: boolean,
    secondaryCard: boolean,
    secondaryCardURL?: string
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

    if (primaryCard) {

        // create specific video url end screen screen
        logEndScreenAction('Create Primary End Card element: Processing...')
        await page.waitForSelector('#endscreen-editor-add-element')
        await page.click('#endscreen-editor-add-element')
        await page.waitFor(2 * 1000)
        await page.waitForSelector(CREATE_BTNS_SELECTOR)
        await page.click(CREATE_BTNS_SELECTOR)
        await page.waitForSelector('#annotator-video-type-fixed')
        await page.click('#annotator-video-type-fixed')
        await page.waitForSelector('#annotator-video-type-fixed')
        await page.click('#annotator-video-type-fixed')
        await page.waitFor(2 * 1000)
        inputs = await page.$$(INPUT_VIDEO_URL_SELECTOR)


        // await page.$eval(INPUT_VIDEO_URL_SELECTOR, (el, value) => {
        //     //@ts-ignore
        //     el.value = value
        // }, `${primaryCardURL}${String.fromCharCode(13)}`);


        const targetInput = inputs[1]


        // const targetinput = await page.evaluate(
        //     (targetInput) => {
        //         return targetInput
        //     }
        //     , targetInput)

        // console.log('trareti', targetInput)



        await targetInput.type(`${primaryCardURL}`)
        await targetInput.type(String.fromCharCode(13))

        await page.waitFor(2 * 1000)




        logEndScreenAction('Create Primary End Card element: Complete')


        await page.waitFor(5 * 1000)
    }

    if (bestForViewerCard) {

        // create auto suggested video card (best for viewer)
        logEndScreenAction('Create Auto Suggested Video End Card element: Processing...')
        await page.waitForSelector('#endscreen-editor-add-element')
        await page.click('#endscreen-editor-add-element')
        await page.waitFor(5 * 1000)
        //endscreen-editor-add-element
        createBtns = await page.$$(CREATE_BTNS_SELECTOR)
        //createBtns = await page.$$('#endscreen-editor-add-element')
        await createBtns[0].click()// select video button
        await page.waitForSelector('#annotator-video-type-best-for-viewer')
        await page.click('#annotator-video-type-best-for-viewer')
        await page.waitFor(2 * 1000)
        //  inputs = await page.$$( INPUT_VIDEO_URL_SELECTOR)
        //  await inputs[1].type('https://www.youtube.com/watch?v=Fd-Skvr9xRE')
        await inputs[1].type(String.fromCharCode(13))
        logEndScreenAction('Create Auto Suggested Video End Card element: Complete')

        await page.waitFor(5 * 1000)
    }

    // create a subscription card
    if (subscribeCard) {

        logEndScreenAction('Create Subscribe End Card element: Processing...')
        await page.waitForSelector('#endscreen-editor-add-element')
        await page.click('#endscreen-editor-add-element')
        await page.waitFor(5 * 1000)
        createBtns = await page.$$(CREATE_BTNS_SELECTOR)

        await createBtns[1].click()// select subscribe button
        // await page.waitForSelector('#annotator-video-type-best-for-viewer')
        // await page.click('#annotator-video-type-best-for-viewer')
        await page.waitFor(2 * 1000)
        //  inputs = await page.$$( INPUT_VIDEO_URL_SELECTOR)
        //  await inputs[1].type('https://www.youtube.com/watch?v=Fd-Skvr9xRE')
        await inputs[1].type(String.fromCharCode(13))
        logEndScreenAction('Create Subscribe End Card element: Complete')
    }




    try {


        if (secondaryCard) {

            // create specific video url end screen screen
            logEndScreenAction('Create secondary card element: secondaryCardURL - Processing...')
            await page.waitForSelector('#endscreen-editor-add-element', { timeout: 5 * 1000 })
            await page.click('#endscreen-editor-add-element')
            await page.waitFor(2 * 1000)
            await page.waitForSelector(CREATE_BTNS_SELECTOR)
            await page.click(CREATE_BTNS_SELECTOR)
            await page.waitForSelector('#annotator-video-type-fixed')
            await page.click('#annotator-video-type-fixed')
            await page.waitForSelector('#annotator-video-type-fixed')
            await page.click('#annotator-video-type-fixed')
            await page.waitFor(2 * 1000)
            inputs = await page.$$(INPUT_VIDEO_URL_SELECTOR)
            await inputs[1].type(`${secondaryCardURL}`)
            await inputs[1].type(String.fromCharCode(13))
            logEndScreenAction('Create secondary card element: Complete')

            await page.waitFor(5 * 1000)
            _createdSecondaryCard = true
        }
    } catch (err) {
        console.error("Failed to create secondary card. Skipping...")
    }

    return {
        createdSecondaryCard: _createdSecondaryCard
    }



}
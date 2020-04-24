import { CreateCardOptions } from "./create";
import { EDITABLE_ELEMENT_SELECTOR, TEXT_SNIPPET_IDENTIFY_ENDSCREEN_PAGE } from "../../config";
import { logEndScreenAction } from "../logs";
import puppeteer from 'puppeteer'
import logger from '../dataDogLogHelper'

export const deleteEndCardElements = async (page: puppeteer.Page) => {

    await logger.debug(`deleteEndCardElements(): Started`)

    const afterNetworkIdleInnerText = await page.evaluate((el) => {
        return el.innerText
    }, await page.$('body'))


    if (afterNetworkIdleInnerText.indexOf(TEXT_SNIPPET_IDENTIFY_ENDSCREEN_PAGE) <= -1) {
        throw new Error('deleteEndCardElements(): Current page does not seem to be expected Endscreen page')
    }


    let editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)


    await logger.debug(`deleteEndCardElements() Delete Existing End Card elements: Found ${editableElements.length} end card elements`, __filename)
    //logEndScreenAction(`Delete Existing End Card elements: Found ${editableElements.length} end card elements`)
    // await page.keyboard.down('Shift')

    for (let i = 0; i < editableElements.length; i++) {
        await logger.debug(`deleteEndCardElements() Delete Existing End Card elements: Deleting ${i + 1}/${editableElements.length} element`, __filename)
        const editableElement = await page.$(EDITABLE_ELEMENT_SELECTOR)

        if (!editableElement) {
            console.warn('Failed to find end card element to delete. Skipping to next')
            continue
        }

        await editableElement.click()
        await page.keyboard.press('Backspace')
        await page.waitFor(2 * 1000)
        await logger.debug(`deleteEndCardElements() Delete Existing End Card elements: Deleted ${i + 1}/${editableElements.length} element`, __filename)
    }

    console.debug('deleteEndCardElements(): Finished')
}
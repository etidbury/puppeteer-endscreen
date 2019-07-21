import { CreateCardOptions } from "./create";
import { EDITABLE_ELEMENT_SELECTOR } from "../../config";
import { logEndScreenAction } from "../logs";
import puppeteer from 'puppeteer'

export const deleteEndCardElements = async (page: puppeteer.Page) => {

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

    logEndScreenAction(`Delete Existing End Card elements: Found ${editableElements.length} end card elements`)
    // await page.keyboard.down('Shift')

    for (let i = 0; i < editableElements.length; i++) {
        logEndScreenAction(`Delete Existing End Card elements: Deleting ${i + 1}/${editableElements.length} element`)
        const editableElement = await page.$(EDITABLE_ELEMENT_SELECTOR)

        if (!editableElement) {
            console.warn('Failed to find end card element to delete. Skipping to next')
            continue
        }

        await editableElement.click()
        await page.keyboard.press('Backspace')
        await page.waitFor(2 * 1000)
        logEndScreenAction(`Delete Existing End Card elements: Deleted ${i + 1}/${editableElements.length} element`)
    }

    console.debug('deleteEndCardElements(): Finished')
}
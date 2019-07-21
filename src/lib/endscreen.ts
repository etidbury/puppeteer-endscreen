import { logEndScreenAction } from './logs'
import {
    EDITABLE_ELEMENT_SELECTOR, LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD, INPUT_VIDEO_URL_SELECTOR, BTN_SAVE_SELECTOR
} from '../config'
import puppeteer from 'puppeteer'

export const moveEditableElement = async (page, editableElement, moveToX, moveToY) => {

    const { x, y, width, height } = await editableElement.boundingBox()

    const selX = x + width / 2
    const selY = y + height / 2

    const selEndX = moveToX + width / 2
    const selEndY = moveToY + height / 2

    await page.mouse.move(selX, selY, { steps: 10 })

    await page.mouse.down()

    // const moveToX = boundingBox.x+boundingBox.width
    await page.mouse.move(selEndX, selEndY, { steps: 50 })
    await page.mouse.up()

    await page.waitFor(1 * 1000)
}

export const generateEndScreenEditorURL = (youtubeVideoId) => {
    return `https://www.youtube.com/endscreen?v=${youtubeVideoId}&ar=2&nv=1`
}

export const checkIsSaveButtonDisabled = async (page: puppeteer.Page) => {
    const saveBtnElement = await page.$(BTN_SAVE_SELECTOR)

    const isSaveBtnDisabled = await page.evaluate(
        (saveBtnElement) => {
            return saveBtnElement.hasAttribute('disabled')
        }
        , saveBtnElement)
    return isSaveBtnDisabled
}


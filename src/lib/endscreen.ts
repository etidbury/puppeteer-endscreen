import { logEndScreenAction } from './logs'
import {
    EDITABLE_ELEMENT_SELECTOR, LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD, INPUT_VIDEO_URL_SELECTOR, BTN_SAVE_SELECTOR
} from '../config'
import puppeteer from 'puppeteer'



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


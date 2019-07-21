import { logEndScreenAction } from './logs'
import {
    EDITABLE_ELEMENT_SELECTOR, LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME, LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD
} from '../config'
import puppeteer from 'puppeteer'

const deleteEndCardElements = async (page) => {
    let editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)

    logEndScreenAction(`Delete Existing End Card elements: Found ${editableElements.length} end card elements`)
    // await page.keyboard.down('Shift')

    for (let i = 0; i < editableElements.length; i++) {
        logEndScreenAction(`Delete Existing End Card elements: Deleting ${i + 1}/${editableElements.length} element`)
        const editableElement = await page.$(EDITABLE_ELEMENT_SELECTOR)

        await editableElement.click()
        await page.keyboard.press('Backspace')
        await page.waitFor(2 * 1000)
        logEndScreenAction(`Delete Existing End Card elements: Deleted ${i + 1}/${editableElements.length} element`)
    }

    // await page.keyboard.up('Shift')
    // await page.keyboard.press('Backspace')
}

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

// todo: rename if redirect being removed
export const loginViaGoogleAndRedirect = async (page: puppeteer.Page, redirectTo) => {

    // await takeScreenshotAndUploadToS3(page,'before-login')

    // await expect(page).toMatch('Login')

    // await page.click('.btn-login')

    // await page.waitFor(3*1000)

    // await page.waitFor(3*1000)
    // await page.waitForSelector(LOGIN_WITH_GOOGLE_BTN_SELECTOR)

    logEndScreenAction('Login: Waiting for email input')
    await page.waitForSelector(LOGIN_EMAIL_SELECTOR)

    await page.waitFor(1 * 1000)
    // await takeScreenshotAndUploadToS3(page,'auth0-login')

    await page.click(LOGIN_EMAIL_SELECTOR)
    // await page.waitFor(3*1000)
    await page.type(LOGIN_EMAIL_SELECTOR, GOOGLE_USERNAME)
    await page.waitFor(1 * 1000)
    await page.type(LOGIN_EMAIL_SELECTOR, String.fromCharCode(13))

    // let element = await page.$("body");
    // let text = await page.evaluate(el => el.textContent, element);
    logEndScreenAction('Login: Waiting for password input')
    await page.waitFor(10 * 1000)

    await page.waitForSelector(LOGIN_PASSWORD_SELECTOR)

    await page.click(LOGIN_PASSWORD_SELECTOR)

    await page.type(LOGIN_PASSWORD_SELECTOR, GOOGLE_PASSWORD)
    await page.waitFor(1 * 1000)

    await page.type(LOGIN_PASSWORD_SELECTOR, String.fromCharCode(13))
    logEndScreenAction('Login: Submitted login credentials')

    await page.waitFor(10 * 1000)

    // element = await page.$("body");
    // text = await page.evaluate(el => el.textContent, element);
    // console.log('inputpassword',text)
    // await page.waitFor(3*1000)

    //    logEndScreenAction('Login: Redirect to target URL')

    //     //todo: consider removing for faster processing
    //     //ensure page redirects to location
    //     await page.goto( redirectTo )

    // await takeScreenshotAndUploadToS3(page,'after-type-creds')
}

export const generateEndScreenEditorURL = (youtubeVideoId) => {
    return `https://www.youtube.com/endscreen?v=${youtubeVideoId}&ar=2&nv=1`
}

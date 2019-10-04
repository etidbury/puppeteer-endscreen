import { EDITABLE_ELEMENT_SELECTOR, ENDCARD_SAFE_AREA_SELECTOR } from "../../config";
import { logEndScreenAction } from "../logs";

import puppeteer from 'puppeteer'

const PADDING = 3

const _moveEditableElement = async (page, editableElement, moveToX, moveToY) => {

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

export const createLayout1 = async (page: puppeteer.Page) => {


    const editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)
    const playerGridSafeArea = await page.$(ENDCARD_SAFE_AREA_SELECTOR)

    const subscribeBtnBoundingBox = await editableElements[0].boundingBox()
    //@ts-ignore
    const { x: subscribeBtnBoundingBoxX, y: subscribeBtnBoundingBoxY, width: subscribeBtnBoundingBoxWidth, height: subscribeBtnBoundingBoxHeight } = subscribeBtnBoundingBox


    if (!playerGridSafeArea) {
        throw new Error('Failed to find playerGridSafeArea')
    }

    const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    if (!endScreenSafeArea) {
        throw new Error('Failed to find endScreenSafeArea')
    }

    logEndScreenAction('Move End Card elements: Processing layout 1...')

    for (let i = 0; i < editableElements.length; i++) {



        const boundingBox = await editableElements[i].boundingBox()

        if (!boundingBox) {
            throw new Error(`Failed to find bounding box for element ${i}`)
        }

        const { x, y, width, height } = boundingBox


        // const moveToX = endScreenSafeArea.x+endScreenSafeArea.width

        let moveToX = 0
        let moveToY = 0

        // switch (i) {
        //     case 0: // sub button
        //         moveToX = endScreenSafeArea.x + PADDING
        //         moveToY = endScreenSafeArea.y + PADDING
        //         break
        //     case 1: // best for viewer
        //         moveToX = endScreenSafeArea.x + PADDING
        //         moveToY = endScreenSafeArea.y + subscribeBtnBoundingBoxHeight + 50 + PADDING
        //         break
        //     case 2: // primary card
        //         moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - PADDING
        //         moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2) - PADDING
        //         break
        //     default:
        //         throw new Error(`Move coordinates not set for editable element ${i}`)

        // }

        switch (i) {
            case 0: // sub button
                moveToX = endScreenSafeArea.x
                moveToY = endScreenSafeArea.y + 10
                break
            case 1: // best for viewer
                moveToX = endScreenSafeArea.x
                moveToY = endScreenSafeArea.y + endScreenSafeArea.height - height - 10
                break
            case 2: // custom link
                moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - 10
                moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2)
                break
            default:
                throw new Error(`Move coordinates not set for editable element ${i}`)
                break
        }

        // console.log('move element',i,{moveToX,moveToY})

        logEndScreenAction(`Move End Card elements: Moving ${i + 1}/${editableElements.length} element to 
        x:${moveToX}, y:${moveToY} - end screen safe area: x:${endScreenSafeArea.x} y:${endScreenSafeArea.y} 
        w:${endScreenSafeArea.width} h:${endScreenSafeArea.height}`)

        await _moveEditableElement(page, editableElements[0], moveToX, moveToY)

        logEndScreenAction(`Move End Card elements: Move ${i + 1}/${editableElements.length} element complete`)

    }

    // }//end if false //todo: remove if

    // const playerGridSafeArea = await page.$('.playergrid-safe-area')
    // const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    /* ------scale best for viewer card-------*/
    const elementTopRightDraggers = await page.$$('.editable-element-dragger.top-right')

    const bestForViewerCardTopRightDragger = elementTopRightDraggers[1]

    // editable-element-dragger top-right
    logEndScreenAction('Resizing Best For Viewer End Card')

    // const editableElements = await page.$$( EDITABLE_ELEMENT_SELECTOR)
    const firstEditableElementBoundingBox = await editableElements[0].boundingBox()

    if (!firstEditableElementBoundingBox) {
        throw new Error('Failed to find firstEditableElementBoundingBox')
    }
    const { height: subscribeEndCardHeight, width: subscribeEndCardWidth } = firstEditableElementBoundingBox

    const scaleToX = endScreenSafeArea.x + 5
    const scaleToY = endScreenSafeArea.y + endScreenSafeArea.height //smallest size
    // document.querySelectorAll('.editable-element-dragger.top-right')
    await _moveEditableElement(page, bestForViewerCardTopRightDragger, scaleToX, scaleToY)

    await page.waitFor(2000)

    await editableElements[1].click()

    logEndScreenAction('Completed resize Best For Viewer End Card')
}

export const createLayout3 = async (page: puppeteer.Page) => {


    const editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)
    const playerGridSafeArea = await page.$(ENDCARD_SAFE_AREA_SELECTOR)

    if (!playerGridSafeArea) {
        throw new Error('Failed to find playerGridSafeArea')
    }

    const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    if (!endScreenSafeArea) {
        throw new Error('Failed to find endScreenSafeArea')
    }

    logEndScreenAction('Move End Card elements: Processing layout 3...')

    for (let i = 0; i < editableElements.length; i++) {


        const boundingBox = await editableElements[i].boundingBox()

        if (!boundingBox) {
            throw new Error(`Failed to find bounding box for element ${i}`)
        }

        const { x, y, width, height } = boundingBox

        // const moveToX = endScreenSafeArea.x+endScreenSafeArea.width

        let moveToX = 0
        let moveToY = 0

        switch (i) {
            case 0: // sub button
                moveToX = endScreenSafeArea.x + PADDING
                moveToY = endScreenSafeArea.y + PADDING
                break
            case 2: // best for viewer
                moveToX = endScreenSafeArea.x + PADDING
                moveToY = endScreenSafeArea.y + endScreenSafeArea.height - height - PADDING
                break
            case 3: // primary

                /*------middle-right------*/
                // moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - 10
                // moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2)
                /*------/middle-right------*/

                /*----top right----*/
                moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - PADDING
                moveToY = endScreenSafeArea.y - PADDING
                /*-----------------*/

                break

            case 1: // secondary

                /*------middle-right------*/
                // moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - 10
                // moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2)
                /*------/middle-right------*/

                /*----bottom right----*/
                moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - PADDING
                moveToY = endScreenSafeArea.y + endScreenSafeArea.height - height - PADDING
                /*-----------------*/

                break
            default:
                throw new Error(`Move coordinates not set for editable element ${i}`)
                break
        }

        // console.log('move element',i,{moveToX,moveToY})

        logEndScreenAction(`Move End Card elements: Moving ${i + 1}/${editableElements.length} element to 
        x:${moveToX}, y:${moveToY} - end screen safe area: x:${endScreenSafeArea.x} y:${endScreenSafeArea.y} 
        w:${endScreenSafeArea.width} h:${endScreenSafeArea.height}`)

        await _moveEditableElement(page, editableElements[0], moveToX, moveToY)

        logEndScreenAction(`Move End Card elements: Move ${i + 1}/${editableElements.length} element complete`)

    }

    // }//end if false //todo: remove if

    // const playerGridSafeArea = await page.$('.playergrid-safe-area')
    // const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    /* ------scale best for viewer card-------*/
    const elementTopRightDraggers = await page.$$('.editable-element-dragger.top-right')

    const bestForViewerCardTopRightDragger = elementTopRightDraggers[1]

    // editable-element-dragger top-right
    logEndScreenAction('Resizing Best For Viewer End Card')

    // const editableElements = await page.$$( EDITABLE_ELEMENT_SELECTOR)
    const firstEditableElementBoundingBox = await editableElements[0].boundingBox()

    if (!firstEditableElementBoundingBox) {
        throw new Error('Failed to find firstEditableElementBoundingBox')
    }
    const { height: subscribeEndCardHeight, width: subscribeEndCardWidth } = firstEditableElementBoundingBox

    const scaleToX = endScreenSafeArea.x + PADDING
    const scaleToY = endScreenSafeArea.y + subscribeEndCardHeight + PADDING
    // document.querySelectorAll('.editable-element-dragger.top-right')
    await _moveEditableElement(page, bestForViewerCardTopRightDragger, scaleToX, scaleToY)

    await page.waitFor(2000)

    await editableElements[1].click()

    logEndScreenAction('Completed resize Best For Viewer End Card')
}


export const createLayout2 = async (page: puppeteer.Page) => {


    const editableElements = await page.$$(EDITABLE_ELEMENT_SELECTOR)
    const playerGridSafeArea = await page.$(ENDCARD_SAFE_AREA_SELECTOR)

    if (!playerGridSafeArea) {
        throw new Error('Failed to find playerGridSafeArea')
    }

    const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    if (!endScreenSafeArea) {
        throw new Error('Failed to find endScreenSafeArea')
    }


    logEndScreenAction('Move End Card elements: Processing layout 2...')

    for (let i = 0; i < editableElements.length; i++) {

        const boundingBox = await editableElements[i].boundingBox()

        if (!boundingBox) {
            throw new Error(`Failed to find bounding box for element ${i}`)
        }

        const { x, y, width, height } = boundingBox
        // const moveToX = endScreenSafeArea.x+endScreenSafeArea.width

        let moveToX = 0
        let moveToY = 0

        switch (i) {
            // case 0: //sub button
            //     moveToX = endScreenSafeArea.x + 1
            //     //moveToY=endScreenSafeArea.y+10
            //     moveToY = endScreenSafeArea.y + (endScreenSafeArea.height/2 - height/2)
            // break;
            case 1: // custom video url

                moveToX = endScreenSafeArea.x + endScreenSafeArea.width - width - PADDING // 544-245-10
                moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2)

                break
            case 0: // best for viewer
                moveToX = endScreenSafeArea.x + PADDING
                moveToY = endScreenSafeArea.y + (endScreenSafeArea.height / 2 - height / 2)
                // await addPageMarker(page,moveToX,moveToY,'red')
                break
            default:
                throw new Error(`Move coordinates not set for editable element ${i}`)
                break
        }

        // console.log('move element',i,{moveToX,moveToY})

        logEndScreenAction(`Move End Card elements: Moving ${i + 1}/${editableElements.length} element to 
    x:${moveToX}, y:${moveToY} - end screen safe area: x:${endScreenSafeArea.x} y:${endScreenSafeArea.y} 
    w:${endScreenSafeArea.width} h:${endScreenSafeArea.height}`)

        logEndScreenAction(`Card details: w:${width} h:${height}`)

        // set to 0 because index changes when selecting editable elements
        await _moveEditableElement(page, editableElements[0], moveToX, moveToY)

        logEndScreenAction(`Move End Card elements: Move ${i + 1}/${editableElements.length} element complete`)

    }

    // }//end if false //todo: remove if

    // const playerGridSafeArea = await page.$('.playergrid-safe-area')
    // const endScreenSafeArea = await playerGridSafeArea.boundingBox()

    /* ------scale best for viewer card-------*/
    // const elementTopRightDraggers = await page.$$('.editable-element-dragger.top-right')

    // const bestForViewerCardTopRightDragger = elementTopRightDraggers[1]

    // // editable-element-dragger top-right
    // logEndScreenAction(`Resizing Best For Viewer End Card`)

    // //const editableElements = await page.$$( EDITABLE_ELEMENT_SELECTOR)
    // const { height: subscribeEndCardHeight,width:subscribeEndCardWidth } = await editableElements[0].boundingBox()
    // const scaleToX = endScreenSafeArea.x+5
    // const scaleToY = endScreenSafeArea.y+subscribeEndCardHeight+5
    // //document.querySelectorAll('.editable-element-dragger.top-right')
    // await _moveEditableElement(page,bestForViewerCardTopRightDragger,scaleToX,scaleToY)

    // await page.waitFor(2000)

    // await editableElements[1].click()

    // logEndScreenAction(`Completed resize Best For Viewer End Card`)
}
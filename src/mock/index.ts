const path = require('path')
require('dotenv-safe').config({ path: path.join(process.cwd(), process.env.ENV_FILE || '.env'), debug: process.env.DEBUG })
const fse = require('fs-extra')

const fetch = require('isomorphic-fetch');

const { Action, updateActionStatus, updateAction, createAction } = require('@etidbury/lib-bot')
//const { Action, updateActionStatus, updateAction, createAction } = require('/Users/edwardtidbury/Documents/lib-bot/dist')
import { fetchGQLQueryEndScreen } from '../lib/api'
import { gql } from 'apollo-boost'

const testVideoIdListTxt = fse.readFileSync(__dirname + '/test-video-list.txt', 'utf-8')

export const createTestEndScreenCampaignAndAction = async () => {

    let queuedEndScreenCampaign

    try {

        const testVideoIdList = testVideoIdListTxt.split('\n').map((r) => r.trim()).filter((r) => r.length)

        //console.debug('testVideoIdList.length', testVideoIdList.length)

        const { createEndScreenCampaign } = await fetchGQLQueryEndScreen(gql`
            mutation createEndScreenCampaign($data:EndScreenCampaignCreateInput!) {
                createEndScreenCampaign(data:$data) {
                    id
                    primaryCardURL
                    secondaryCardURL
                    items {
                        id
                        youtubeVideoId
                    }
                }
            }
        `, {
            data: {
                primaryCardURL: "auto-tp",
                secondaryCardURL: "auto-dap",

                notes: "testcampaign from puppeteer-endscreen test",
                uploadedCSVFileReference: "not_a_file.csv",
                items:
                {
                    create: testVideoIdList.map((testVideoId) => {
                        return {
                            youtubeVideoId: testVideoId
                        }
                    })
                }

                //lastImportClaimDate:new Date().toISOString()
            }
        })

        console.log(createEndScreenCampaign.id)

        queuedEndScreenCampaign = createEndScreenCampaign

    } catch (err) {
        console.error(err)
        throw Error('Failed to create test end screen campaign')
    }

    const action = {
        gitRepositoryURL: "https://github.com/etidbury/puppeteer-endscreen",
        gitBranch: "edd2",
        actionProps: {
            endScreenCampaignId: queuedEndScreenCampaign.id,
            endScreenCampaignPrimaryCardURL: queuedEndScreenCampaign.primaryCardURL,
            endScreenCampaignSecondaryCardURL: queuedEndScreenCampaign.secondaryCardURL,
            endScreenCampaignItems: queuedEndScreenCampaign.items
        },
        tags: `endscreen,endScreenCampaignId:${queuedEndScreenCampaign.id}`,
        webHooks: {},
        envVars: {
            //todo: IMPORTANT: remove and add in env vars. Also reset
            GOOGLE_USERNAME: 'edd.testbury@gmail.com',
            GOOGLE_PASSWORD: 'Testpassword1'
        }
    }

    const createdAction = await createAction(action)

    const TMP_DIR = path.join(process.cwd(), './.tmp/')

    fse.mkdirp(TMP_DIR)

    fse.writeFileSync(path.join(TMP_DIR, 'action.json'), JSON.stringify(createdAction, null, 2))


    return createdAction


}



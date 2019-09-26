import { ASTNode, print } from "graphql"
import Axios from "axios"
const urljoin = require('url-join')

import { ENDSCREEN_BOT_GQL_URL } from '../config'
import { gql } from "apollo-boost";
import { EndScreenItem } from "../types";

export const fetchGQLQueryEndScreen = async (query: ASTNode, variables = {}): Promise<any> => {
    try {

        const { data: { data } } = await Axios.post(
            urljoin(ENDSCREEN_BOT_GQL_URL)
            , {
                query: print(query),
                variables
            }
        ).then((r) => {

            if (r.data.errors) {
                console.error(r.data.errors)
                throw new Error(`Graphql returned errors`)
            }

            if (r.status < 300 && r.status >= 200) {
                return r
            } else {
                throw new Error(`Request error status code: ${r.status}`)
            }
        })


        return data


    } catch (err) {
        console.error('err', err && err.response && err.response.data || err && err.response || err)
        console.info('GQLQuery:', print(query))
        console.info('Variables:', variables)

        throw new Error(`fetchGQLQueryEndScreen(): Error thrown trying to run Graphql query`)
    }

}


export interface EndScreenItemUpdateProps {
    isQueued?: boolean
    hasExecuted?: boolean,
    hasFailed?: boolean,
    isCancelled?: boolean,
    endCardLayoutApplied?: string
    lastStatusUpdate?: Date
    failedAttempts?: number
    isProcessing?: boolean
}


export const checkIsEndScreenItemMarkedAsCancelled = async (endScreenCampaignItem: EndScreenItem) => {

    const result = await fetchGQLQueryEndScreen(gql`
       query checkEndScreenCampaignItemCancelled($endScreenCampaignItemId:ID!) {
            endScreenCampaignItem(where:{
                id:$endScreenCampaignItemId
            }) {
                id
                isCancelled
                }
        }
        `, {
        endScreenCampaignItemId: endScreenCampaignItem.id
    })

    console.debug('checkIsEndScreenItemMarkedAsCancelled()', result, result.endScreenCampaignItem.isCancelled)

    return result.endScreenCampaignItem.isCancelled

}

export const checkIsEndScreenCampaignMarkedAsCancelled = async (endScreenCampaignId: string) => {

    if (!endScreenCampaignId || !endScreenCampaignId.length) {
        throw new TypeError('You need to specify an end screen campaign ID')
    }
    const result = await fetchGQLQueryEndScreen(gql`
       query checkEndScreenCampaignCancelled($endScreenCampaignId:ID!) {
            endScreenCampaign(where:{
                id:$endScreenCampaignId
            }) {
                id
                isCancelled
                }
        }
        `, {
        endScreenCampaignId: endScreenCampaignId
    })

    console.debug('checkIsEndScreenCampaignMarkedAsCancelled()', result, result.endScreenCampaign.isCancelled)

    return result.endScreenCampaign.isCancelled

}


export const updateEndScreenItem = async (endScreenCampaignItem: EndScreenItem, updateProps: EndScreenItemUpdateProps) => {

    updateProps.lastStatusUpdate = updateProps.lastStatusUpdate ? new Date(updateProps.lastStatusUpdate) : new Date()

    return fetchGQLQueryEndScreen(gql`
        mutation updateEndScreenCampaignItem($data:EndScreenCampaignItemUpdateInput! $endScreenCampaignItemId:ID!) {
                updateEndScreenCampaignItem(data:$data,where:{
                    id:$endScreenCampaignItemId
                }) {
                        id
                        youtubeVideoId
                        isQueued,
                        hasExecuted,
                        hasFailed,
                        isCancelled,
                        lastStatusUpdate
                        failedAttempts
                    }
                }
        `, {
        endScreenCampaignItemId: endScreenCampaignItem.id,
        data: Object.assign(updateProps, { lastStatusUpdate: updateProps.lastStatusUpdate.toISOString() })
    })

}


export const createEndScreenArchiveIfNotExists = async (endScreenCampaignItem: EndScreenItem, archiveProps: Object) => {

    return fetchGQLQueryEndScreen(gql`
        mutation createEndScreenArchiveIfNotExists($create:EndScreenArchiveCreateInput! $update:EndScreenArchiveUpdateInput! $where:EndScreenArchiveWhereUniqueInput!){
        upsertEndScreenArchive(create:$create, where:$where
            update:$update
        ) {
            id
            previousEndScreenProps
            youtubeVideoId
            }
        }
        `, {
        "create": {
            "youtubeVideoId": endScreenCampaignItem.youtubeVideoId,
            "previousEndScreenProps": archiveProps
        },
        "update": {
            "youtubeVideoId": endScreenCampaignItem.youtubeVideoId
        }
        ,
        "where": {
            "youtubeVideoId": endScreenCampaignItem.youtubeVideoId
        }
    })

}

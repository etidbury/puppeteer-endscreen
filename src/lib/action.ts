
import { ASTNode, print } from "graphql"
import { gql } from 'apollo-boost'
import Axios from "axios"
import { EndScreenItem } from "../types";
const urljoin = require('url-join')
const fs = require('fs')
//todo: specify via env var from ../config
const BOT_MANAGER_GQL_URL = 'https://bot-manager-api.now.sh/graphql'

const _fetchGQLQueryBotManager = async (query: ASTNode, variables = {}): Promise<any> => {
    try {

        const { data: { data } } = await Axios.post(
            urljoin(BOT_MANAGER_GQL_URL)
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

        throw new Error(`_fetchGQLQueryBotManager(): Error thrown trying to run Graphql query`)
    }

}

export interface Action {
    id: string
    actionProps: {
        endScreenCampaignPrimaryCardURL: string
        endScreenCampaignId: string
        endScreenCampaignItems: [EndScreenItem]
    }
}
const ACTION_FILE_PATH = './.tmp/action.json'

export const saveTestAction = async (actionId?: string) => {

    if (!actionId || !actionId.length) {
        throw new TypeError('Invalid actionId specified')
    }

    console.debug('Saving test action with ID:', actionId)
    const response = await _fetchGQLQueryBotManager(gql`
        query testAction($id:ID!) {
            action(where:{
                id:$id
            }){
                id
                isQueued
                hasExecuted
                hasFailed
                isCancelled
                gitRepositoryURL
                executedExitCode
                envVars
                actionProps
            }
        }
    `, { id: actionId })

    const { action } = response as any

    if (!action || !action.actionProps) {
        throw new TypeError('Invalid action loaded from server')
    }

    fs.writeFileSync(ACTION_FILE_PATH, JSON.stringify({ action }, null, 2))
}

export const loadAction = async (): Promise<Action> => {


    const rawAction = fs.readFileSync(ACTION_FILE_PATH, 'utf-8')

    const { action } = JSON.parse(rawAction)

    return action
}


// const init = async () => {


// }
// init()



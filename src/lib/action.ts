
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

        throw new Error(`fetchGQLQueryEndScreen(): Error thrown trying to run Graphql query`)
    }

}

export interface Action {
    id: string
    actionProps: {
        endScreenCampaignId: string
        endScreenCampaignItems: [EndScreenItem]
    }
}
export const loadTestAction = async (): Promise<Action> => {
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
`, { id: "cjyd1amnm0geq0a59bpixvd2x" })

    const { action } = response as any

    if (!action || !action.actionProps) {
        throw new TypeError('Invalid action loaded from server')
    }

    fs.writeFileSync('./action.json', JSON.stringify({ action }, null, 2))

    return action
}


// const init = async () => {


// }
// init()



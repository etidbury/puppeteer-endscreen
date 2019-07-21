import { ASTNode, print } from "graphql"
import Axios from "axios"
const urljoin = require('url-join')

import { ENDSCREEN_BOT_GQL_URL } from '../config'

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

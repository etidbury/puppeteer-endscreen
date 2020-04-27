
import Axios from 'axios'
import * as urljoin from 'url-join'

//const BASE_API_URL = 'http://localhost:3000/'
const BASE_API_URL = 'https://production.wmg-youtube-playlist-api.firepitapi.com'

export const getDAVByVideoId = async (targetYouTubeVideoId: string) => {

    return Axios.get(
        urljoin(BASE_API_URL, `/dav/recommended?id=${encodeURIComponent(targetYouTubeVideoId)}`)
    ).then((r) => {

        if (r.status < 300 && r.status >= 200) {
            return r
        } else {
            throw new Error(`getDAVByVideoId(): Request error status code: ${r.status}`)
        }
    }).then(({ data }) => {

        return data.youtubeVideoId

    })

}
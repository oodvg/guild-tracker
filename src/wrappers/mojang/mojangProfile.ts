const api = `https://sessionserver.mojang.com/session/minecraft/profile/`
import { redis } from "../../index";

const cacheLifespan = 72 * 60 * 60;

import fetch from "node-fetch";
import { Wrappers } from "../Wrappers";
export default async function get(query) {
    return new Promise<any>(async res => {
        let url = api + query;
        let isCached = await redis.exists(`cache-mojang:${url}`);
        if (isCached) {
            const cache = JSON.parse((await redis.get(`cache-mojang:${url}`)) || "{}");
            if (cache.name) {
                return res(cache);
            }
        }

        let resp = await fetch(url).catch(e => console.error('Mojang Error: ', e));
        const body = await resp?.json().catch(e => null);
        // body?.error && res(0);
        if (query === '8c988b0f8efd47f0a12f35f4b9fff58b') console.log(`mojang responding...`, body)
        if (!body?.name) {
            console.log(`using ashcon cuz mojang not work`)
            const ashcon = await Wrappers.ashcon.player(query);
            if (!ashcon) console.error(`!!!!!!! Ashcon failed to fetch ${query} !!!!!!`)
            return res({ name: ashcon.username, id: ashcon.uuid })
        }
        if (!isCached && body?.name) redis.setex(`cache-mojang:${url}`, cacheLifespan, JSON.stringify(body));
        res(body);
    })
}

const axios = require("axios");
const db = require("quick.db");
const _ = require("lodash");

//key: instagramProfileId
const stalks = {
    "mansurbaskan": 2316687378
}

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const checkFollow = async ({ id, username, followingUsers }) => {
    let dbFollowings = db.get("followings."+username);
    const currentFollowingUsersArray = followingUsers;
    let currentFollowingUsers = [];
    currentFollowingUsersArray.map((d) => {
        currentFollowingUsers.push(d.username)
    })
    await sleep(3000);
    const checkDbFollowings = _.difference(dbFollowings, currentFollowingUsers);
    if(checkDbFollowings.length >= 1) {
        console.log("[INF][checkFollow]["+username+"] Checking followings from database")
        checkDbFollowings.map((d) => {
            db.push("deletedFollowings."+username, d)
            console.log("[SUC][checkFollow]["+username+"] Deleting "+d+" from followings")
        })
    } else {
        console.log("[INF][checkFollow]["+username+"] No diff found from Database")
    }
    await sleep(3000);
    const checkCurrentFollowings = _.difference(currentFollowingUsers, dbFollowings);
    if(checkCurrentFollowings.length >= 1) {
        console.log("[INF][checkFollow]["+username+"] Checking followings from Instagram")
        checkCurrentFollowings.map((d) => {
            db.push("followings."+username, d)
            console.log("[SUC][checkFollow]["+username+"] Pushing "+d+" to followings")
        })
    } else {
        console.log("[INF][checkFollow]["+username+"] No diff found from Instagram")
    }
    await sleep(3000);
    db.delete("followings."+username);
    console.log("[INF][checkFollow]["+username+"] Updating data")
    await sleep(3000);
    currentFollowingUsers.map((d) => {
        db.push("followings."+username, d)
    })
    console.log("[INF][checkFollow]["+username+"] Profile successfully updated")
}

const stalkProfile = async ({ id, username }) => {
    console.log("[SUC][stalkProfile]["+username+"] Fetching followings..")
    const request = await axios.get("https://i.instagram.com/api/v1/friendships/"+id+"/following/?count=5000&max_id=QVFDRGYtclR4c3pfclhRa21GSXJYb3lzZUlMZERiZWZfMkEwQ2FVQUlCSXhsY1BmTUtxRVZ1ZTJoV2l2TDVaSXFYLTB6NUl3N0JGa3J4U3hSZExXWWhiQg%3D%3D&search_surface=following_list_page", {
        headers : {
            "accept": "*/*",
            "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Opera GX\";v=\"79\", \"Chromium\";v=\"93\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-asbd-id": "198387",
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": "hmac.AR03Lg5fcsYehcqyD2NhYsYzcMmWDHvmKq3xY56BQmZkTCs7",
            "cookie": "mid=YIJqQAALAAEFTVaylCpBuR-F4shu; ig_did=C35333D2-49F9-47CE-98BF-FC08F951A36A; ig_nrcb=1; fbm_124024574287414=base_domain=.instagram.com; ds_user_id="+id+"; datr=MfSPYDoT5BbPSqqfElt7Xw9H; csrftoken=n5CYQnwMHz9f1YHzqWMrVPVkMDvgzj4i; sessionid=2973474595%3ASEipu3JrFVGTJ4%3A10; shbid=\"10450\\0542973474595\\0541667689852:01f74c944a0c92fd2aac93859b281c27c92238b88dada2e8dcfe09bdb934d41122bde8f7\"; shbts=\"1636153852\\0542973474595\\0541667689852:01f7eedc0b58af2cd10f45c958f9671af737f89b47aeff5cccfe841e712ef486f748f23f\"; fbsr_124024574287414=r3eOlVZ35XOPKSDRJL5YXVmm93iA7ZGCWS2cGAN4ylY.eyJ1c2VyX2lkIjoiMTAwMDAwMzg3NDAzMzE5IiwiY29kZSI6IkFRRHJCcVhBcmZWdVMxa3BxaWxHdXN4UUh2bUxYWExycmVzc0RJdnF4S0oyUHBBeUxuUWxOcDN1aW16VEdmdkR5UDJrSjMzX2tMSDdsZWRlZU9CWnY3TEJfY2VLcjQtdUZiOXNMTjR1TWhMZ19vUHJETzlGVmVaVXZJcU91aW11aG9DQmV2cmxnZ1UxVTNQLW5QTWsyaXdFemxzbE91VDJKdDVfLXR0c2ZfOTIxbHdFSlBtY0ZTTUJ6STNBQ1hOdjhwOGFNRTA3b0tiSmJuU0RIQmZCY0t4YWhueWJ1QTRiSUVzUmpvS1RNdWM4c3dKQmFKSXZPNDlWQ3pOQmhQWFpNcFRKWFA3NzFCRmNPY3Z3Yzk3c3htUVBSd2I5dmJFcENoV1ppa0d0YVplZHlHUmczSmQ2dzFmZHdhS2RYNC1xekZwUFloMXU1SUNOUDlWazExT0ZGUndaIiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCQU1DcDlZemdLQXVxcEdVUHhKNUQ5THZJd0h3Q0gwSW5sRFNQS0NHYTJqWkNSWkNFZ2ZYNlNyOTB2RUtxdHBqcmdXeGQ5MnJNQWE2TjVUMllUQ0F6cG1nWkFwRlJhb0RoVE5naUpFNlE4N00xTDRrU2FvblJpNmZneWluMlpDbFBnUUpCclR4MmN5QVNHSm1xbE9nYmRGdVpCZ0xDYWVHMmdCNUlVeGlUNyIsImFsZ29yaXRobSI6IkhNQUMtU0hBMjU2IiwiaXNzdWVkX2F0IjoxNjM2Mzc3NTY2fQ; rur=\"FRC\\0542973474595\\0541667914192:01f7378a64df9529990dbe8abc440aa08e785f737ce2f8a0f7892729c5f4e2b1996aa267\"",
            "referrer": "https://www.instagram.com/",
            "referrerPolicy": "strict-origin-when-cross-origin"
        }
    })

    if(request) {
        if(Object.keys(request.data.users).length >= 1) {
            await checkFollow({
                id: id,
                username: username,
                followingUsers: request.data.users
            })
        } else {
            console.log("[ERR][stalkProfile]["+username+"] No following found.")
        }
    } else {
        console.log("[ERR][stalkProfile]["+username+"] Request failed.")
    }
}

(async () => {
    Object.keys(stalks).forEach(async (k, v) => {
        await stalkProfile({
            id: stalks[k],
            username: k
        })
        await sleep(30000);
        setInterval(async () => {
            await stalkProfile({
                id: stalks[k],
                username: k
            })
        }, 3 * 60 * 60 * 1000)
    })
})();
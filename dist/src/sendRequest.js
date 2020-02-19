"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const https = __importStar(require("https"));
/**
 * JSON形式のテキストをパースする。空文字だったらnullを返す
 * @param str
 * @param typeGuardFunction Type Guard関数。これが与えられてかつ検査に失敗した場合は例外がスローされる
 */
function parseJson(str, typeGuardFunction) {
    if (str === "") {
        return null;
    }
    const data = JSON.parse(str);
    if (typeGuardFunction) {
        if (typeGuardFunction(data)) {
            return data;
        }
        else {
            console.error(str);
            throw new Error(`${typeGuardFunction}: 期待していない形の結果`);
        }
    }
    // tslint:disable-next-line: prefer-type-cast
    return data;
}
/**
 * www.googleapis.comに対してリクエストを送る
 * @param path
 * @param bodyIfPost
 */
function sendRequest(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const method = params.bodyIfPost ? "POST" : params.method || "GET";
        const options = {
            hostname: "www.googleapis.com",
            port: 443,
            path: params.path,
            method: method,
            headers: { Authorization: `Bearer ${params.accessToken}` }
        };
        if (method == "POST") {
            options.headers["Content-Type"] = "application/json";
        }
        if (process.env.DEBUG) {
            console.log(`request sending to ${params.path}`);
        }
        return new Promise((resolve, reject) => {
            let req = https.request(options, (res) => {
                res.setEncoding("utf8");
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });
                res.on("end", () => {
                    if (200 <= res.statusCode && res.statusCode < 300) {
                        // ここに来たらOK
                        try {
                            const result = parseJson(body, params.typeGuardFunction);
                            resolve(result === null ? undefined : result);
                        }
                        catch (e) {
                            console.error(body);
                            console.error(e);
                            reject(new Error("failed to parse response as JSON"));
                        }
                    }
                    else {
                        console.error(body);
                        reject(new Error(`Status code is not 20x (but ${res.statusCode})`));
                    }
                });
            });
            req.on("error", (err) => reject(err));
            if (params.bodyIfPost) {
                if (typeof params.bodyIfPost === "object") {
                    req.write(JSON.stringify(params.bodyIfPost));
                }
                else {
                    req.write(params.bodyIfPost);
                }
            }
            req.end();
        });
    });
}
exports.default = sendRequest;
const isRefreshResult = (arg) => {
    if (typeof arg !== "object") {
        return false;
    }
    if (typeof arg.access_token !== "string") {
        return false;
    }
    if (typeof arg.scope !== "string") {
        return false;
    }
    if (typeof arg.token_type !== "string") {
        return false;
    }
    return true;
};
/**
 * リフレッシュトークンを使ってアクセストークンを更新するため accounts.google.com にリクエストを送る。
 * @param option
 */
exports.sendRequest2 = (option) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "accounts.google.com",
            port: 443,
            path: "/o/oauth2/token",
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" }
        };
        const req = https.request(options, res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                if (res.statusCode === 200) {
                    //console.log(body);
                    const result = JSON.parse(body);
                    if (isRefreshResult(result)) {
                        resolve(result);
                    }
                    else {
                        reject(result);
                    }
                }
                else {
                    reject(body);
                }
            });
        });
        req.on("error", err => {
            reject(err);
        });
        req.write(`client_id=${option.clientId}`);
        req.write("&");
        req.write(`client_secret=${option.clientSecret}`);
        req.write("&");
        req.write(`refresh_token=${option.refreshToken}`);
        req.write("&");
        req.write("grant_type=refresh_token");
        req.end();
    });
});

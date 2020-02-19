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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const Types = __importStar(require("./types"));
const querystring = require("querystring");
const GmailMessage_1 = __importDefault(require("./GmailMessage"));
const sendRequest_1 = __importStar(require("./sendRequest"));
/*
 * いくつかのメソッドを持ち、内部にGoogle APIトークンを保持しているオブジェクト。
 * Gmail APIを呼び出すにはこのインスタンスを通せばよい
 */
// tslint:disable-next-line: export-name
class GmailClient {
    constructor(accessToken) {
        this.accessToken = null;
        this.accessToken = accessToken;
    }
    refreshAccessToken(option) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield sendRequest_1.sendRequest2(option);
            this.accessToken = result.access_token;
            return result.access_token;
        });
    }
    /**
     * Gmail APIを呼び出すために www.googleapis.com にリクエストを送る。
     * 結果（JSON形式のテキストまたは空文字のはず）をパースし、Type Guard関数（指定された場合）に通して
     * 指定された型として返す
     */
    sendRequest(path, typeGuardFunction, method = "GET", bodyIfPost) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield sendRequest_1.default({
                accessToken: this.accessToken || "",
                path: path,
                method: method,
                bodyIfPost: bodyIfPost,
                typeGuardFunction: typeGuardFunction
            });
        });
    }
    /**
     * メールを1通ずつ削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されたらエラーとなる。
     * @param mailId メールのID（GmailのメッセージID）またはその配列
     */
    deleteMails(mailIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof mailIds === "string") {
                mailIds = [mailIds];
            }
            for (const mailId of mailIds) {
                if (process.env.DEBUG) {
                    console.log(`id=${mailId} を削除します...`);
                }
                yield this.sendRequest(`/gmail/v1/users/me/messages/${mailId}`, undefined, "DELETE");
            }
            return true;
        });
    }
    /**
     * メールをまとめて削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されても気にしない。
     * @param mailId メールのID（GmailのメッセージID）またはその配列
     */
    deleteMailsBatch(mailIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof mailIds === "string") {
                mailIds = [mailIds];
            }
            if (process.env.DEBUG) {
                console.log(`id=${mailIds.join(",")} を削除します...`);
            }
            yield this.sendRequest(`/gmail/v1/users/me/messages/batchDelete`, undefined, "POST", { ids: mailIds });
            return true;
        });
    }
    /**
     * ラベル一覧を配列で取得する
     */
    getLabels() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendRequest("/gmail/v1/users/me/labels", Types.Labels.isResultRoot);
            return result.labels;
        });
    }
    /**
     * 検索条件を指定してメールのIDを検索する
     * @param rawCondition 検索条件。Gmailで検索ボックスに入力するクエリと同じ形式
     */
    searchMailIds(rawCondition) {
        return __awaiter(this, void 0, void 0, function* () {
            // (rawQuery + " " + ).replace(/'/g, "%27").replace(/%20/g, "+"); //.replace(/"/g, "%22");
            rawCondition = rawCondition || "";
            if (process.env.DEBUG) {
                console.log(`メールを '${rawCondition}' で検索します...`);
            }
            const query = querystring.stringify({ q: rawCondition });
            const data = yield this.sendRequest(`/gmail/v1/users/me/messages?${query}`, Types.MessageIdSearch.isResultRoot);
            if (process.env.DEBUG) {
                console.log(`メールが '${(data.messages || []).length}' 件見つかりました`);
            }
            return data.messages || [];
        });
    }
    /**
     * 検索条件を指定してメール（本文）を検索する。30件を超えていたらエラーになる
     * @param {string} rawCondition
     */
    searchMails(rawCondition) {
        return __awaiter(this, void 0, void 0, function* () {
            const mails = yield this.searchMailIds(rawCondition);
            if (mails.length > 30) {
                return Promise.reject(new Error(`メールの件数が多すぎます: ${mails.length}件`));
            }
            const result = [];
            for (let item of mails) {
                result.push(yield this.getMailById(item.id));
            }
            return result;
        });
    }
    addLabels(mailId, labelIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof labelIds === "string") {
                labelIds = [labelIds];
            }
            if (process.env.DEBUG) {
                console.log(`メール '${mailId}' にラベル ${labelIds.join(",")} を付加します...`);
            }
            yield this.sendRequest(`/gmail/v1/users/me/messages/${mailId}/modify`, undefined, "POST", { addLabelIds: labelIds, removeLabelIds: [] });
            return true;
        });
    }
    /**
     * 1件のメッセージを取得する。添付ファイルも含めて全ての情報を返す
     * @param mailId メールのID（GmailのメッセージID）
     * @param shortenBase64ForTest trueの場合、添付ファイルのBase64値を32文字に切り詰める。テスト用
     */
    getMailById(mailId, shortenBase64ForTest = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.sendRequest(`/gmail/v1/users/me/messages/${mailId}`, Types.RawMail.isRawMessage);
            const mail = new GmailMessage_1.default(data);
            const result = yield mail.serialize(this);
            if (!Types.Mail.isMessage(result)) {
                console.error(JSON.stringify(result, null, 2));
                throw new Error("形式が変です");
            }
            if (shortenBase64ForTest) {
                for (let attachment of result.attachments) {
                    if (attachment.base64.length > 30) {
                        attachment.base64 = attachment.base64.substring(0, 32) + "...";
                    }
                }
            }
            return result;
        });
    }
    getRawMailById(mailId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest(`/gmail/v1/users/me/messages/${mailId}`, Types.RawMail.isRawMessage);
        });
    }
    /**
     * 添付ファイルをbase64のテキストデータで取得する（ファイルサイズが大きい場合、 attachmentId だけが渡されて messages API では中身が取得できないことがある）
     * @param {string} mailId
     * @param {string} attachmentId
     */
    getAttachment(mailId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendRequest(`/gmail/v1/users/me/messages/${mailId}/attachments/${attachmentId}`, Types.AttachmentFile.isRoot);
            return result.data;
        });
    }
}
exports.default = GmailClient;

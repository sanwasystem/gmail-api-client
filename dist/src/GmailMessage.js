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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const _ = __importStar(require("lodash"));
const Types = __importStar(require("./types"));
const MailPayload_1 = __importDefault(require("./MailPayload"));
/**
 * 添付ファイル1個を示すクラス。
 * Gmailの添付ファイルは message API でそのまま取得できる場合と、 attachment id だけが降ってくるので
 * 個別にダウンロードしなければならない場合がある。
 * このクラスはその両者をまとめて扱う。
 */
class MailAttachment {
    constructor(filename, mimeType, size, content) {
        this.filename = filename;
        this.mimeType = mimeType;
        this.size = size;
        if (content.base64) {
            this._base64 = content.base64;
            this.attachmentId = null;
        }
        else if (content.attachmentId) {
            this._base64 = null;
            this.attachmentId = content.attachmentId;
        }
        else {
            throw new Error("Base64もattachmentIdももらえませんでした");
        }
    }
    serialize(gmailClient, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            let base64;
            if (this._base64) {
                base64 = this._base64;
            }
            if (this.attachmentId) {
                base64 = yield gmailClient.getAttachment(messageId, this.attachmentId);
            }
            else {
                throw new Error("ここには来ないはず");
            }
            return {
                filename: this.filename,
                mimeType: this.mimeType,
                base64: base64,
                size: this.size
            };
        });
    }
}
/**
 * 1件のGmailのメールを表すクラス
 */
class GmailMessage {
    constructor(raw) {
        this.rawMail = raw;
        this.from = this._extractHeaderValue("From");
        this.to = this._extractHeaderValue("To");
        this.cc = this._extractHeaderValue("Cc");
        this.returnPath = this._extractHeaderValue("Return-Path");
        this.id = raw.id;
        this.threadId = raw.threadId;
        this.unixTime = +raw.internalDate;
        this.unixTimestamp = moment_1.default(+raw.internalDate)
            .utcOffset(9)
            .format("YYYY-MM-DD[T]HH:mm:ss[+0900]");
        this.subject = this._extractHeaderValue("Subject") || "";
        this.contentType = this._extractHeaderValue("Content-Type") || "";
        this.messageId = this._extractHeaderValue("Message-ID") || "";
        this.labelIds = [...raw.labelIds];
        this.snippet = raw.snippet;
        const date = this._extractHeaderValue("Date");
        if (date) {
            this.date = moment_1.default(date)
                .utcOffset(9)
                .format("YYYY-MM-DD[T]HH:mm:ss[+0900]");
        }
        else {
            this.date = this.unixTimestamp;
        }
        [this.body, this.attachments, this.isTextMail] = this._parseRawMail(raw);
        const { isError, partIds } = this._checkPayloadPartId();
    }
    /**
     * 最上位にあるpayloadのheadersから指定した名前のヘッダを探して値を返す。見つからなければnull
     * @param keyName 名前
     */
    _extractHeaderValue(keyName) {
        // tslint:disable-next-line: underscore-consistent-invocation
        const found = _.find(this.rawMail.payload.headers, x => x.name.toLowerCase() === keyName.toLowerCase());
        if (found) {
            return found.value;
        }
        return null;
    }
    _compressText(text) {
        return text
            .replace(/\s+$/gm, "")
            .replace(/[\r\n]+/gm, "\n")
            .replace(/\n$/g, "")
            .replace(/^\n/g, "");
    }
    /**
     * デバッグ用。payloadのpartIdが期待通りになっているかどうか調べる
     */
    _checkPayloadPartId() {
        let isError = false;
        const partIds = [];
        if (this.rawMail.payload.partId !== "") {
            isError = true;
            console.log("partIdエラーC");
        }
        if (!this.rawMail.payload.parts) {
            return { isError, partIds };
        }
        for (let part of this.rawMail.payload.parts) {
            partIds.push(part.partId);
            if (!part.partId.match(/^[0-9]+$/)) {
                isError = true;
                console.log("partIdエラーA");
            }
            if (!part.parts) {
                continue;
            }
            for (let subPart of part.parts) {
                partIds.push(`  ${subPart.partId}`);
                const m = subPart.partId.match(/^([0-9])+\.([0-9])+$/);
                if (!m) {
                    isError = true;
                    console.log("partIdエラーD");
                }
                else if (m[1] !== part.partId) {
                    isError = true;
                    console.log("partIdエラーB");
                }
            }
        }
        return { isError, partIds };
    }
    _parseRawMail(raw) {
        try {
            const payload = MailPayload_1.default.Parse(raw.payload);
            // tslint:disable-next-line: max-line-length
            const attachments = payload.attachments.map(x => new MailAttachment(x.filename, x.mimeType, x.body.size, { base64: x.body.data, attachmentId: x.body.attachmentId }));
            return [payload.body, attachments, payload.isTextMail];
        }
        catch (e) {
            return ["", [], false];
        }
    }
    serialize(gmailClient) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
                id: this.id,
                threadId: this.threadId,
                unixTime: this.unixTime,
                unixTimestamp: this.unixTimestamp,
                subject: this.subject,
                contentType: this.contentType,
                messageId: this.messageId,
                snippet: this.snippet,
                date: this.date,
                labelIds: [...this.labelIds],
                body: this.body,
                body2: this._compressText(this.body),
                attachments: [],
                isTextMail: this.isTextMail
            };
            // attachmentIdしかない添付ファイルは値を取得する
            for (const attatchment of this.attachments) {
                result.attachments.push(yield attatchment.serialize(gmailClient, this.id));
            }
            if (this.from) {
                result.from = this.from;
            }
            if (this.to) {
                result.to = this.to;
            }
            if (this.cc) {
                result.cc = this.cc;
            }
            if (this.returnPath) {
                result.returnPath = this.returnPath;
            }
            if (!Types.Mail.isMessage(result)) {
                console.log(JSON.stringify(result, null, 2));
                throw new Error("結果の形が変です");
            }
            return result;
        });
    }
}
exports.default = GmailMessage;

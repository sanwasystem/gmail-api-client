"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * メールのラベル
 */
var Labels;
(function (Labels) {
    Labels.isResultRoot = (arg) => {
        if (!Array.isArray(arg.labels)) {
            return false;
        }
        for (const label of arg.labels) {
            if (!Labels.isLabel(label)) {
                return false;
            }
        }
        return true;
    };
    Labels.isLabel = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.id !== "string") {
            return false;
        }
        if (typeof arg.name !== "string") {
            return false;
        }
        if (arg.messageListVisibility !== undefined && typeof arg.messageListVisibility !== "string") {
            return false;
        }
        if (arg.labelListVisibility !== undefined && typeof arg.labelListVisibility !== "string") {
            return false;
        }
        if (typeof arg.type !== "string") {
            return false;
        }
        if (arg.color !== undefined && typeof arg.color !== "object") {
            return false;
        }
        const color = arg.color || { textColor: "", backgroundColor: "" };
        if (color.textColor !== undefined && typeof color.textColor !== "string") {
            return false;
        }
        if (color.backgroundColor !== undefined && typeof color.backgroundColor !== "string") {
            return false;
        }
        return true;
    };
})(Labels = exports.Labels || (exports.Labels = {}));
/**
 * searchMailIds() （IDのみのメール検索）の結果の型
 */
var MessageIdSearch;
(function (MessageIdSearch) {
    MessageIdSearch.isMessage = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.id !== "string") {
            return false;
        }
        if (typeof arg.threadId !== "string") {
            return false;
        }
        return true;
    };
    MessageIdSearch.isResultRoot = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.resultSizeEstimate !== "number") {
            return false;
        }
        if (arg.messages !== undefined) {
            if (!Array.isArray(arg.messages)) {
                return false;
            }
            for (const message of arg.messages) {
                if (!MessageIdSearch.isMessage(message)) {
                    return false;
                }
            }
        }
        return true;
    };
})(MessageIdSearch = exports.MessageIdSearch || (exports.MessageIdSearch = {}));
var RawMail;
(function (RawMail) {
    RawMail.isRawMessage = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.id !== "string") {
            return false;
        }
        if (typeof arg.threadId !== "string") {
            return false;
        }
        if (!Array.isArray(arg.labelIds)) {
            return false;
        }
        for (const labelId of arg.labelIds) {
            if (typeof labelId !== "string") {
                return false;
            }
        }
        if (typeof arg.snippet !== "string") {
            return false;
        }
        if (typeof arg.historyId !== "string") {
            return false;
        }
        if (typeof arg.internalDate !== "string") {
            return false;
        }
        if (typeof arg.sizeEstimate !== "number") {
            return false;
        }
        if (!isPayload(arg.payload)) {
            return false;
        }
        if (process.env.DEBUG) {
            console.log("isRawMessage check ok");
        }
        return true;
    };
    const isPayload = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.partId !== "string") {
            return false;
        }
        if (typeof arg.mimeType !== "string") {
            return false;
        }
        if (typeof arg.filename !== "string") {
            return false;
        }
        if (!Array.isArray(arg.headers)) {
            return false;
        } // TODO: 中身のチェック
        if (typeof arg.body !== "object") {
            return false;
        }
        if (typeof arg.body.size !== "number") {
            return false;
        }
        if (arg.body.data !== undefined && typeof arg.body.data !== "string") {
            return false;
        }
        if (arg.parts !== undefined) {
            if (!Array.isArray(arg.parts)) {
                return false;
            }
            if (arg.parts.filter((x) => !isSubPart(x)).length > 0) {
                return false;
            }
        }
        if (process.env.DEBUG) {
            console.log("isPayload() check ok");
        }
        return true;
    };
    const isSubPart = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.partId !== "string") {
            return false;
        }
        if (typeof arg.mimeType !== "string") {
            return false;
        }
        if (typeof arg.filename !== "string") {
            return false;
        }
        if (!Array.isArray(arg.headers)) {
            return false;
        } // TODO: 中身のチェック
        if (typeof arg.body !== "object") {
            return false;
        }
        if (typeof arg.body.size !== "number") {
            return false;
        }
        if (arg.body.attachmentId !== undefined && typeof arg.body.attachmentId !== "string") {
            return false;
        }
        if (arg.body.data !== undefined && typeof arg.body.data !== "string") {
            return false;
        }
        if (arg.body.parts !== undefined) {
            if (!Array.isArray(arg.body.parts)) {
                return false;
            }
            if (arg.body.parts.filter((x) => !isSubsubPart(x)).length > 0) {
                return false;
            }
        }
        if (process.env.DEBUG) {
            console.log("isSubPart() check ok");
        }
        return true;
    };
    const isSubsubPart = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.partId !== "string") {
            return false;
        }
        if (typeof arg.mimeType !== "string") {
            return false;
        }
        if (typeof arg.filename !== "string") {
            return false;
        }
        if (!Array.isArray(arg.headers)) {
            return false;
        } // TODO: 中身のチェック
        if (typeof arg.body !== "object") {
            return false;
        }
        if (typeof arg.body.size !== "number") {
            return false;
        }
        if (arg.body.data !== undefined && typeof arg.body.data !== "string") {
            return false;
        }
        if (arg.body.attachmentId !== undefined && typeof arg.body.attachmentId !== "string") {
            return false;
        }
        return true;
    };
})(RawMail = exports.RawMail || (exports.RawMail = {}));
var Mail;
(function (Mail) {
    Mail.isMessage = (arg) => {
        if (process.env.DEBUG) {
            console.log("isMessage() start");
        }
        if (typeof arg !== "object") {
            return false;
        }
        if (arg.from !== undefined && typeof arg.from !== "string") {
            return false;
        }
        if (arg.to !== undefined && typeof arg.to !== "string") {
            return false;
        }
        if (arg.cc !== undefined && typeof arg.cc !== "string") {
            return false;
        }
        if (typeof arg.id !== "string") {
            return false;
        }
        if (!Array.isArray(arg.labelIds)) {
            return false;
        }
        for (const labelId of arg.labelIds) {
            if (typeof labelId !== "string") {
                return false;
            }
        }
        if (typeof arg.threadId !== "string") {
            return false;
        }
        if (arg.returnPath !== undefined && typeof arg.returnPath !== "string") {
            return false;
        }
        if (typeof arg.unixTime !== "number") {
            return false;
        }
        if (typeof arg.unixTimestamp !== "string") {
            return false;
        }
        if (typeof arg.subject !== "string") {
            return false;
        }
        if (typeof arg.contentType !== "string") {
            return false;
        }
        if (typeof arg.messageId !== "string") {
            return false;
        }
        if (typeof arg.snippet !== "string") {
            return false;
        }
        if (typeof arg.date !== "string") {
            return false;
        }
        if (typeof arg.body !== "string") {
            return false;
        }
        if (typeof arg.body2 !== "string") {
            return false;
        }
        if (!Array.isArray(arg.attachments)) {
            return false;
        }
        for (const attachment of arg.attachments) {
            if (!Mail.isAttachment(attachment)) {
                return false;
            }
        }
        if (typeof arg.isTextMail !== "boolean") {
            return false;
        }
        if (process.env.DEBUG) {
            console.log("isMessage() check ok");
        }
        return true;
    };
    Mail.isAttachment = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.filename !== "string") {
            return false;
        }
        if (typeof arg.mimeType !== "string") {
            return false;
        }
        if (typeof arg.size !== "number") {
            return false;
        }
        if (typeof arg.base64 !== "string") {
            return false;
        }
        return true;
    };
})(Mail = exports.Mail || (exports.Mail = {}));
var AttachmentFile;
(function (AttachmentFile) {
    AttachmentFile.isRoot = (arg) => {
        if (typeof arg !== "object") {
            return false;
        }
        if (typeof arg.size !== "number") {
            return false;
        }
        if (typeof arg.data !== "string") {
            return false;
        }
        return true;
    };
})(AttachmentFile = exports.AttachmentFile || (exports.AttachmentFile = {}));

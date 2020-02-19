import * as Types from "./types";
/**
 * 添付ファイル1個を示すクラス。
 * Gmailの添付ファイルは message API でそのまま取得できる場合と、 attachment id だけが降ってくるので
 * 個別にダウンロードしなければならない場合がある。
 * このクラスはその両者をまとめて扱う。
 */
declare class MailAttachment {
    readonly filename: string;
    readonly mimeType: string;
    readonly size: number;
    private _base64;
    readonly attachmentId: string | null;
    constructor(filename: string, mimeType: string, size: number, content: {
        base64?: string;
        attachmentId?: string;
    });
    serialize(gmailClient: Types.GmailClientType, messageId: string): Promise<Types.Mail.Attachment>;
}
/**
 * 1件のGmailのメールを表すクラス
 */
export default class GmailMessage {
    private rawMail;
    private from;
    private to;
    private cc;
    private returnPath;
    private id;
    private threadId;
    private unixTime;
    private unixTimestamp;
    private subject;
    private contentType;
    private messageId;
    private labelIds;
    private snippet;
    private date;
    private body;
    private attachments;
    private isTextMail;
    constructor(raw: Types.RawMail.RawMessage);
    /**
     * 最上位にあるpayloadのheadersから指定した名前のヘッダを探して値を返す。見つからなければnull
     * @param keyName 名前
     */
    private _extractHeaderValue;
    private _compressText;
    /**
     * デバッグ用。payloadのpartIdが期待通りになっているかどうか調べる
     */
    private _checkPayloadPartId;
    _parseRawMail(raw: Types.RawMail.RawMessage): [string, MailAttachment[], boolean];
    serialize(gmailClient: Types.GmailClientType): Promise<Types.Mail.Message>;
}
export {};

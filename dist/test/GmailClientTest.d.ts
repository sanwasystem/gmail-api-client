import GmailClient from "../src/";
export default class GmailClientTest extends GmailClient {
    /**
     * 添付ファイルをbase64のテキストデータで取得する処理をオーバーライドする。
     * attachmentIdをアスタリスクでかこった文字列をUTF-8でバイトストリームにしてBase64エンコーディングした値を返す
     * @param {string} mailId
     * @param {string} attachmentId
     */
    getAttachment(mailId: string, attachmentId: string): Promise<string>;
}

import * as Types from "./types";
export default class GmailClient implements Types.GmailClientInterface {
    private accessToken;
    constructor(accessToken: string);
    refreshAccessToken(option: {
        refreshToken: string;
        clientId: string;
        clientSecret: string;
    }): Promise<string>;
    /**
     * Gmail APIを呼び出すために www.googleapis.com にリクエストを送る。
     * 結果（JSON形式のテキストまたは空文字のはず）をパースし、Type Guard関数（指定された場合）に通して
     * 指定された型として返す
     */
    protected sendRequest<T extends object>(path: string, typeGuardFunction?: (arg: any) => arg is T, method?: "GET" | "POST" | "DELETE", bodyIfPost?: string | object | undefined): Promise<T>;
    /**
     * メールを1通ずつ削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されたらエラーとなる。
     * @param mailId メールのID（GmailのメッセージID）またはその配列
     */
    deleteMails(mailIds: string | readonly string[]): Promise<boolean>;
    /**
     * メールをまとめて削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されても気にしない。
     * @param mailId メールのID（GmailのメッセージID）またはその配列
     */
    deleteMailsBatch(mailIds: string | readonly string[]): Promise<boolean>;
    /**
     * ラベル一覧を配列で取得する
     */
    getLabels(): Promise<Types.Labels.Label[]>;
    /**
     * 検索条件を指定してメールのIDを検索する
     * @param rawCondition 検索条件。Gmailで検索ボックスに入力するクエリと同じ形式
     */
    searchMailIds(rawCondition: string): Promise<Types.MessageIdSearch.Message[]>;
    /**
     * 検索条件を指定してメール（本文）を検索する。30件を超えていたらエラーになる
     * @param {string} rawCondition
     */
    searchMails(rawCondition: string): Promise<Types.Mail.Message[]>;
    addLabels(mailId: string, labelIds: string | string[]): Promise<boolean>;
    /**
     * 1件のメッセージを取得する。添付ファイルも含めて全ての情報を返す
     * @param mailId メールのID（GmailのメッセージID）
     * @param shortenBase64ForTest trueの場合、添付ファイルのBase64値を32文字に切り詰める。テスト用
     */
    getMailById(mailId: string, shortenBase64ForTest?: boolean): Promise<Types.Mail.Message>;
    getRawMailById(mailId: string): Promise<Types.RawMail.RawMessage>;
    /**
     * 添付ファイルをbase64のテキストデータで取得する（ファイルサイズが大きい場合、 attachmentId だけが渡されて messages API では中身が取得できないことがある）
     * @param {string} mailId
     * @param {string} attachmentId
     */
    getAttachment(mailId: string, attachmentId: string): Promise<string>;
}

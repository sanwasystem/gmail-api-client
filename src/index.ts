require("dotenv").config();
import * as Types from "./types";
const querystring = require("querystring");
import GmailMessage from "./GmailMessage";
import sendRequest, { sendRequest2 } from "./sendRequest";

/*
 * いくつかのメソッドを持ち、内部にGoogle APIトークンを保持しているオブジェクト。
 * Gmail APIを呼び出すにはこのインスタンスを通せばよい
 */
// tslint:disable-next-line: export-name
export default class GmailClient implements Types.GmailClientInterface {
  private accessToken: string | null = null;
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  public async refreshAccessToken(option: { refreshToken: string; clientId: string; clientSecret: string }): Promise<string> {
    const result = await sendRequest2(option);
    this.accessToken = result.access_token;
    return result.access_token;
  }

  /**
   * Gmail APIを呼び出すために www.googleapis.com にリクエストを送る。
   * 結果（JSON形式のテキストまたは空文字のはず）をパースし、Type Guard関数（指定された場合）に通して
   * 指定された型として返す
   */
  protected async sendRequest<T extends object>(
    path: string,
    typeGuardFunction?: (arg: any) => arg is T,
    method: "GET" | "POST" | "DELETE" = "GET",
    bodyIfPost?: string | object | undefined
  ): Promise<T> {
    return await sendRequest({
      accessToken: this.accessToken || "",
      path: path,
      method: method,
      bodyIfPost: bodyIfPost,
      typeGuardFunction: typeGuardFunction
    });
  }

  /**
   * メールを1通ずつ削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されたらエラーとなる。
   * @param mailId メールのID（GmailのメッセージID）またはその配列
   */
  public async deleteMails(mailIds: string | readonly string[]): Promise<boolean> {
    if (typeof mailIds === "string") {
      mailIds = [mailIds];
    }

    for (const mailId of mailIds) {
      if (process.env.DEBUG) {
        console.log(`id=${mailId} を削除します...`);
      }
      await this.sendRequest<any>(`/gmail/v1/users/me/messages/${mailId}`, undefined, "DELETE");
    }

    return true;
  }

  /**
   * メールをまとめて削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されても気にしない。
   * @param mailId メールのID（GmailのメッセージID）またはその配列
   */
  public async deleteMailsBatch(mailIds: string | readonly string[]): Promise<boolean> {
    if (typeof mailIds === "string") {
      mailIds = [mailIds];
    }

    if (process.env.DEBUG) {
      console.log(`id=${mailIds.join(",")} を削除します...`);
    }

    await this.sendRequest<any>(`/gmail/v1/users/me/messages/batchDelete`, undefined, "POST", { ids: mailIds });

    return true;
  }

  /**
   * ラベル一覧を配列で取得する
   */
  public async getLabels() {
    const result = await this.sendRequest<Types.Labels.ResultRoot>("/gmail/v1/users/me/labels", Types.Labels.isResultRoot);
    return result.labels;
  }

  /**
   * 検索条件を指定してメールのIDを検索する
   * @param rawCondition 検索条件。Gmailで検索ボックスに入力するクエリと同じ形式
   */
  public async searchMailIds(rawCondition: string) {
    // (rawQuery + " " + ).replace(/'/g, "%27").replace(/%20/g, "+"); //.replace(/"/g, "%22");
    rawCondition = rawCondition || "";

    if (process.env.DEBUG) {
      console.log(`メールを '${rawCondition}' で検索します...`);
    }

    const query: string = querystring.stringify({ q: rawCondition });
    const data = await this.sendRequest<Types.MessageIdSearch.ResultRoot>(`/gmail/v1/users/me/messages?${query}`, Types.MessageIdSearch.isResultRoot);

    if (process.env.DEBUG) {
      console.log(`メールが '${(data.messages || []).length}' 件見つかりました`);
    }

    return data.messages || [];
  }

  /**
   * 検索条件を指定してメール（本文）を検索する。30件を超えていたらエラーになる
   * @param {string} rawCondition
   */
  public async searchMails(rawCondition: string) {
    const mails = await this.searchMailIds(rawCondition);
    if (mails.length > 30) {
      return Promise.reject(new Error(`メールの件数が多すぎます: ${mails.length}件`));
    }

    const result: Types.Mail.Message[] = [];
    for (let item of mails) {
      result.push(await this.getMailById(item.id));
    }
    return result;
  }

  public async addLabels(mailId: string, labelIds: string | string[]) {
    if (typeof labelIds === "string") {
      labelIds = [labelIds];
    }

    if (process.env.DEBUG) {
      console.log(`メール '${mailId}' にラベル ${labelIds.join(",")} を付加します...`);
    }

    await this.sendRequest<any>(`/gmail/v1/users/me/messages/${mailId}/modify`, undefined, "POST", { addLabelIds: labelIds, removeLabelIds: [] });
    return true;
  }

  /**
   * 1件のメッセージを取得する。添付ファイルも含めて全ての情報を返す
   * @param mailId メールのID（GmailのメッセージID）
   * @param shortenBase64ForTest trueの場合、添付ファイルのBase64値を32文字に切り詰める。テスト用
   */
  public async getMailById(mailId: string, shortenBase64ForTest: boolean = false) {
    const data = await this.sendRequest<Types.RawMail.RawMessage>(`/gmail/v1/users/me/messages/${mailId}`, Types.RawMail.isRawMessage);

    const mail = new GmailMessage(data);
    const result = await mail.serialize(this);
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
  }

  public async getRawMailById(mailId: string) {
    return this.sendRequest<Types.RawMail.RawMessage>(`/gmail/v1/users/me/messages/${mailId}`, Types.RawMail.isRawMessage);
  }

  /**
   * 添付ファイルをbase64のテキストデータで取得する（ファイルサイズが大きい場合、 attachmentId だけが渡されて messages API では中身が取得できないことがある）
   * @param {string} mailId
   * @param {string} attachmentId
   */
  public async getAttachment(mailId: string, attachmentId: string): Promise<string> {
    const result = await this.sendRequest<Types.AttachmentFile.Root>(
      `/gmail/v1/users/me/messages/${mailId}/attachments/${attachmentId}`,
      Types.AttachmentFile.isRoot
    );
    return result.data;
  }
}

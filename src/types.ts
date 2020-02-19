/**
 * GmailClientが公開するメソッド
 */
export declare interface GmailClientInterface {
  /**
   * ラベル一覧を配列で取得する
   */
  getLabels(): Promise<Labels.Label[]>;

  /**
   * 検索条件を指定してメールのIDを検索する
   * @param rawCondition 検索条件。Gmailで検索ボックスに入力するクエリと同じ形式
   */

  searchMailIds(rawCondition: string): Promise<MessageIdSearch.Message[]>;

  /**
   * 検索条件を指定してメール（本文）を検索する。30件を超えていたらエラーになる
   * @param {string} rawCondition
   */
  searchMails(rawCondition: string): Promise<Mail.Message[]>;

  addLabels(mailId: string, labelIds: string | string[]): Promise<boolean>;

  /**
   * 1件のメッセージを取得する。添付ファイルも含めて全ての情報を返す
   * @param mailId メールのID（GmailのメッセージID）
   * @param shortenBase64ForTest trueの場合、添付ファイルのBase64値を32文字に切り詰める。テスト用
   */
  getMailById(mailId: string, shortenBase64ForTest: boolean): Promise<Mail.Message>;

  /**
   * 1件のメッセージを取得する。内部処理用
   * @param mailId
   */
  getRawMailById(mailId: string): Promise<RawMail.RawMessage>;

  /**
   * 添付ファイルをbase64のテキストデータで取得する
   * @param {string} mailId
   * @param {string} attachmentId
   */
  getAttachment(mailId: string, attachmentId: string): Promise<string>;

  /**
   * メールを1通ずつ削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されたらエラーとなる。
   * @param mailId メールのID（GmailのメッセージID）またはその配列
   */
  deleteMails(mailIds: string | string[]): Promise<boolean>;

  /**
   * メールをまとめて削除する（ゴミ箱に移動するのではなく完全に削除する）。存在しないメールIDが指定されても気にしない。
   * @param mailId メールのID（GmailのメッセージID）またはその配列
   */
  deleteMailsBatch(mailIds: string | string[]): Promise<boolean>;
}

/**
 * メールのラベル
 */
export namespace Labels {
  export interface ResultRoot {
    labels: Label[];
  }

  export interface Label {
    id: string;
    name: string;
    messageListVisibility?: string;
    labelListVisibility?: string;
    type: string;
    color?: {
      textColor: string;
      backgroundColor: string;
    };
  }

  export const isResultRoot = (arg: any): arg is ResultRoot => {
    if (!Array.isArray(arg.labels)) {
      return false;
    }
    for (const label of arg.labels) {
      if (!isLabel(label)) {
        return false;
      }
    }
    return true;
  };

  export const isLabel = (arg: any): arg is Label => {
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
}

/**
 * searchMailIds() （IDのみのメール検索）の結果の型
 */
export namespace MessageIdSearch {
  /**
   * メール検索結果
   */
  export interface ResultRoot {
    resultSizeEstimate: number;
    messages?: Message[];
  }

  /**
   * メール検索結果に含まれるメール1件。メッセージIDとスレッドIDしかない
   */
  export interface Message {
    id: string;
    threadId: string;
  }

  export const isMessage = (arg: any): arg is Message => {
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

  export const isResultRoot = (arg: any): arg is ResultRoot => {
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
        if (!isMessage(message)) {
          return false;
        }
      }
    }
    return true;
  };
}

export namespace RawMail {
  /**
   * メッセージ取得APIから返されるメール1件
   */
  export interface RawMessage {
    id: string;
    threadId: string;
    /**
     * ラベルIDの配列。必ずある
     */
    labelIds: string[];
    snippet: string;
    historyId: string;
    internalDate: string;
    sizeEstimate: number;
    payload: Payload;
  }

  export const isRawMessage = (arg: any): arg is RawMessage => {
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

  /**
   * メール1件のIDやラベルIDと同じ階層に必ず含まれるPayload
   */
  export interface Payload {
    /**
     * おそらく空文字固定
     */
    partId: string;
    mimeType: string;
    filename: string;
    headers: KeyValueType[];
    body: {
      size: number;
      data?: string;
    };
    /**
     * 1段階ネストしたパーツ。ないこともある
     */
    parts?: SubPart[];
  }

  const isPayload = (arg: any): arg is Payload => {
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
      if (arg.parts.filter((x: any) => !isSubPart(x)).length > 0) {
        return false;
      }
    }

    if (process.env.DEBUG) {
      console.log("isPayload() check ok");
    }

    return true;
  };

  export interface SubPart {
    /**
     * おそらく整数形式の文字列
     */
    partId: string;
    mimeType: string;
    filename: string;
    headers: KeyValueType[];
    body: {
      size: number;
      attachmentId?: string;
      data?: string;
    };
    parts?: SubsubPart[];
  }

  const isSubPart = (arg: any): arg is SubPart => {
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
      if (arg.body.parts.filter((x: any) => !isSubsubPart(x)).length > 0) {
        return false;
      }
    }

    if (process.env.DEBUG) {
      console.log("isSubPart() check ok");
    }

    return true;
  };

  export interface SubsubPart {
    /**
     * おそらく0.0形式の文字列整数形式の文字列
     */
    partId: string;
    mimeType: string;
    filename: string;
    headers: KeyValueType[];
    body: {
      size: number;
      data?: string;
      /**
       * 存在することはないかもしれない
       */
      attachmentId?: string;
    };
  }

  const isSubsubPart = (arg: any) => {
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

  export interface KeyValueType {
    name: string;
    value: string;
  }
}

export namespace Mail {
  /**
   * 1件のメール。諸々のパースを終えて呼び出し元に返すときの形
   */
  export interface Message {
    from?: string;
    to?: string;
    cc?: string;
    id: string;
    labelIds: string[];
    threadId: string;
    returnPath?: string;
    unixTime: number;
    unixTimestamp: string;
    subject: string;
    contentType: string;
    messageId: string;
    snippet: string;
    date: string;
    body: string;
    body2: string;
    attachments: Attachment[];
    isTextMail: boolean;
  }

  export const isMessage = (arg: any): arg is Message => {
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
      if (!isAttachment(attachment)) {
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

  /**
   * 1件の添付ファイルを示す（内容は既にBase64で取得・格納済み）
   */
  export interface Attachment {
    filename: string;
    mimeType: string;
    size: number;
    base64: string;
  }

  export const isAttachment = (arg: any): arg is Attachment => {
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
}

export declare interface GmailClientType {
  getAttachment: (messageId: string, attachmentId: string) => Promise<string>;
}

export namespace AttachmentFile {
  export type Root = {
    size: number;
    data: string;
  };

  export const isRoot = (arg: any): arg is Root => {
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
}

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
export declare namespace Labels {
    interface ResultRoot {
        labels: Label[];
    }
    interface Label {
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
    const isResultRoot: (arg: any) => arg is ResultRoot;
    const isLabel: (arg: any) => arg is Label;
}
/**
 * searchMailIds() （IDのみのメール検索）の結果の型
 */
export declare namespace MessageIdSearch {
    /**
     * メール検索結果
     */
    interface ResultRoot {
        resultSizeEstimate: number;
        messages?: Message[];
    }
    /**
     * メール検索結果に含まれるメール1件。メッセージIDとスレッドIDしかない
     */
    interface Message {
        id: string;
        threadId: string;
    }
    const isMessage: (arg: any) => arg is Message;
    const isResultRoot: (arg: any) => arg is ResultRoot;
}
export declare namespace RawMail {
    /**
     * メッセージ取得APIから返されるメール1件
     */
    interface RawMessage {
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
    const isRawMessage: (arg: any) => arg is RawMessage;
    /**
     * メール1件のIDやラベルIDと同じ階層に必ず含まれるPayload
     */
    interface Payload {
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
    interface SubPart {
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
    interface SubsubPart {
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
    interface KeyValueType {
        name: string;
        value: string;
    }
}
export declare namespace Mail {
    /**
     * 1件のメール。諸々のパースを終えて呼び出し元に返すときの形
     */
    interface Message {
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
    const isMessage: (arg: any) => arg is Message;
    /**
     * 1件の添付ファイルを示す（内容は既にBase64で取得・格納済み）
     */
    interface Attachment {
        filename: string;
        mimeType: string;
        size: number;
        base64: string;
    }
    const isAttachment: (arg: any) => arg is Attachment;
}
export declare interface GmailClientType {
    getAttachment: (messageId: string, attachmentId: string) => Promise<string>;
}
export declare namespace AttachmentFile {
    type Root = {
        size: number;
        data: string;
    };
    const isRoot: (arg: any) => arg is Root;
}

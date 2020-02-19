import * as Types from "./types";
import * as _ from "lodash";

// tslint:disable: underscore-consistent-invocation

export default class MailPayload {
  public readonly isTextMail: boolean;
  public readonly body: string;
  public readonly attachments: (Types.RawMail.SubPart | Types.RawMail.SubsubPart)[];
  public constructor(body: string, attachments: (Types.RawMail.SubPart | Types.RawMail.SubsubPart)[], isTextMail: boolean) {
    this.body = body;
    this.isTextMail = isTextMail;
    this.attachments = attachments;
  }

  public static Parse(payload: Types.RawMail.Payload) {
    const result = MailPayloadParser.parse(payload);
    if (typeof result === "string") {
      throw new Error(result);
    }
    return result;
  }
}

class MailPayloadParser {
  public static parse(payload: Types.RawMail.Payload): MailPayload | string {
    const parsers = [
      MailPayloadParser.ParseAsSimpleTextMail,
      MailPayloadParser.ParseAsTextMailWithAttachments,
      MailPayloadParser.ParseAsHtmlMail,
      MailPayloadParser.ParseAsHtmlMailWithAttachments
    ];

    const errors: string[] = [];
    for (const parser of parsers) {
      const mail = parser(payload);
      if (typeof mail === "string") {
        errors.push(`${parser}: ${mail}`);
      } else {
        return mail;
      }
    }
    return errors.join("\n");
  }

  public static ParseAsSimpleTextMail(payload: Types.RawMail.Payload): MailPayload | string {
    if (payload.mimeType.indexOf("text/plain") === 0 && !payload.parts && typeof payload.body.data === "string") {
      const body = Buffer.from(<string>payload.body.data, "base64").toString("utf-8");
      return new MailPayload(body, [], true);
    }
    return "this is not text mail";
  }

  public static ParseAsTextMailWithAttachments(payload: Types.RawMail.Payload): MailPayload | string {
    if (payload.mimeType.indexOf("multipart/mixed") !== 0) {
      return "mimetype is not 'multipart/mixed'";
    }
    if (payload.body.size !== 0 || payload.body.data !== undefined) {
      return "this may be text mail";
    }
    if (!Array.isArray(payload.parts)) {
      return "parts is not found or not an array";
    }
    if (payload.parts.filter(x => x.parts).length > 0) {
      return "some part(s) have sub part(s)";
    }

    // 本文
    const text = _.first(payload.parts.filter(x => x.mimeType === "text/plain" && x.filename === "" && x.body && x.body.data !== undefined));
    if (text === undefined) {
      return "text part not found";
    }
    const body = Buffer.from(<string>text.body.data, "base64").toString("utf-8");

    // 添付ファイル
    const attachments = payload.parts.filter(x => x.partId !== text.partId);

    return new MailPayload(body, attachments, true);
  }

  public static ParseAsHtmlMail(payload: Types.RawMail.Payload): MailPayload | string {
    if (payload.mimeType.indexOf("multipart") !== 0) {
      return "mimetype is not 'multipart'";
    }
    if (payload.body.size !== 0 || payload.body.data !== undefined) {
      return "this may be text mail";
    }
    if (!Array.isArray(payload.parts)) {
      return "parts is not found or not an array";
    }
    if (payload.parts.filter(x => x.parts).length > 0) {
      return "some part(s) have sub part(s)";
    }
    if (payload.parts.length !== 2 || payload.parts.filter(x => x.filename !== "").length > 0) {
      return "this mail has something other than text and html";
    }

    // 本文（テキスト）
    const text = _.first(payload.parts.filter(x => x.mimeType === "text/plain" && x.filename === "" && x.body && x.body.data !== undefined));
    if (text === undefined) {
      return "text part not found";
    }
    const body = Buffer.from(<string>text.body.data, "base64").toString("utf-8");

    // 本文（HTML）
    const html = payload.parts.filter(x => x.partId !== text.partId)[0];
    const bodyHtml = Buffer.from(<string>html.body.data, "base64").toString("utf-8");

    return new MailPayload(body, [], false);
  }

  public static ParseAsHtmlMailWithAttachments(payload: Types.RawMail.Payload): MailPayload | string {
    if (payload.mimeType.indexOf("multipart") !== 0) {
      return "mimetype is not 'multipart'";
    }
    if (payload.body.size !== 0 || payload.body.data !== undefined) {
      return "this may be text mail";
    }
    if (!Array.isArray(payload.parts)) {
      return "parts is not found or not an array";
    }

    // これをテキスト+HTMLと添付ファイルとに分類する
    const parts = payload.parts;

    const htmlText = _.first(parts.filter(x => x.parts));
    if (!htmlText || !Array.isArray(htmlText.parts) || htmlText.parts.length !== 2) {
      return "HTML & text part not found";
    }
    const body = _.find(htmlText.parts, x => x.mimeType === "text/plain");
    if (!body || typeof body.body.data !== "string") {
      return "text body not found";
    }

    const attachments = parts.filter(x => x.partId !== htmlText.partId);

    return new MailPayload(Buffer.from(body.body.data, "base64").toString("utf-8"), attachments, false);
  }
}

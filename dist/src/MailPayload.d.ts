import * as Types from "./types";
export default class MailPayload {
    readonly isTextMail: boolean;
    readonly body: string;
    readonly attachments: (Types.RawMail.SubPart | Types.RawMail.SubsubPart)[];
    constructor(body: string, attachments: (Types.RawMail.SubPart | Types.RawMail.SubsubPart)[], isTextMail: boolean);
    static Parse(payload: Types.RawMail.Payload): MailPayload;
}

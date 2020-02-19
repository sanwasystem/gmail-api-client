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
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = __importDefault(require("../src/"));
class GmailClientTest extends src_1.default {
    /**
     * 添付ファイルをbase64のテキストデータで取得する処理をオーバーライドする。
     * attachmentIdをアスタリスクでかこった文字列をUTF-8でバイトストリームにしてBase64エンコーディングした値を返す
     * @param {string} mailId
     * @param {string} attachmentId
     */
    getAttachment(mailId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`添付ファイルを取得したことにします: mailId=${mailId}, attachmentId=${attachmentId}`);
            return Buffer.from(`*${attachmentId}*`, "utf-8").toString("base64");
        });
    }
}
exports.default = GmailClientTest;

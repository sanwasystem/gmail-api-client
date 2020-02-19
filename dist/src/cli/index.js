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
const __1 = __importDefault(require("../"));
require("dotenv").config();
(() => __awaiter(void 0, void 0, void 0, function* () {
    // tslint:disable: prefer-type-cast
    const clientId = process.env["client_id"];
    const clientSecret = process.env["client_secret"];
    const refreshToken = process.env["refresh_token"];
    const client = new __1.default("dummy");
    yield client.refreshAccessToken({ refreshToken, clientId, clientSecret });
    switch (process.argv[2]) {
        case "search": {
            const mailIds = yield client.searchMailIds(process.argv[3]);
            console.log(mailIds.map(x => x.id).join(", "));
            break;
        }
        case "searchEx": {
            const mailIds = yield client.searchMailIds(process.argv[3]);
            for (const mailId of mailIds.slice(0, 3)) {
                const mail = yield client.getMailById(mailId.id);
                console.log(`from: ${mail.from}, to: ${mail.to}, subject: ${mail.subject}`);
            }
            break;
        }
        default: {
            console.log("print all labels");
            console.log(yield client.getLabels());
            break;
        }
    }
}))();

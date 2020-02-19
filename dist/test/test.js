"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const trimText = (str) => {
    return str.replace(/^ +/mg, "").replace(/ +$/mg, "").replace(/[\r\n]+/g, "\n").replace(/\n$/g, "");
};
describe("mail parser", () => {
});

require('dotenv').config();
import * as fs from "fs";
import * as assert from "assert";
import * as Types from "../src/types"
import GmailMessage from "../src/GmailMessage";
import GmailClientTest from "./GmailClientTest";
import * as _ from "lodash";

const trimText = (str: string) => {
  return str.replace(/^ +/mg, "").replace(/ +$/mg, "").replace(/[\r\n]+/g, "\n").replace(/\n$/g, "");
}

describe("mail parser", () => {
});

import * as https from "https";

/**
 * JSON形式のテキストをパースする。空文字だったらnullを返す
 * @param str
 * @param typeGuardFunction Type Guard関数。これが与えられてかつ検査に失敗した場合は例外がスローされる
 */
function parseJson<T>(str: string, typeGuardFunction?: (arg: any) => arg is T): T | null {
  if (str === "") {
    return null;
  }
  const data = JSON.parse(str);
  if (typeGuardFunction) {
    if (typeGuardFunction(data)) {
      return data;
    } else {
      console.error(str);
      throw new Error(`${typeGuardFunction}: 期待していない形の結果`);
    }
  }
  // tslint:disable-next-line: prefer-type-cast
  return data as T;
}

interface RequestOption {
  hostname: string;
  port: number;
  path: string;
  method: string;
  headers: { [name: string]: string };
}

/**
 * www.googleapis.comに対してリクエストを送る
 * @param path
 * @param bodyIfPost
 */
export default async function sendRequest<T>(params: {
  accessToken: string;
  path: string;
  method?: "GET" | "POST" | "DELETE";
  bodyIfPost?: string | object;
  typeGuardFunction?: (arg: any) => arg is T;
}): Promise<T> {
  const method = params.bodyIfPost ? "POST" : params.method || "GET";

  const options: RequestOption = {
    hostname: "www.googleapis.com",
    port: 443,
    path: params.path,
    method: method,
    headers: { Authorization: `Bearer ${params.accessToken}` }
  };

  if (method == "POST") {
    options.headers["Content-Type"] = "application/json";
  }

  if (process.env.DEBUG) {
    console.log(`request sending to ${params.path}`);
  }

  return new Promise<T>((resolve, reject) => {
    let req = https.request(options, (res: any) => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk: any) => {
        body += chunk;
      });
      res.on("end", () => {
        if (200 <= res.statusCode && res.statusCode < 300) {
          // ここに来たらOK
          try {
            const result = parseJson<T>(body, params.typeGuardFunction);
            resolve(result === null ? undefined : result);
          } catch (e) {
            console.error(body);
            console.error(e);
            reject(new Error("failed to parse response as JSON"));
          }
        } else {
          console.error(body);
          reject(new Error(`Status code is not 20x (but ${res.statusCode})`));
        }
      });
    });

    req.on("error", (err: any) => reject(err));
    if (params.bodyIfPost) {
      if (typeof params.bodyIfPost === "object") {
        req.write(JSON.stringify(params.bodyIfPost));
      } else {
        req.write(params.bodyIfPost);
      }
    }
    req.end();
  });
}

/**
 * アクセストークンのリフレッシュが成功した場合に得られるはずの型
 */
type RefreshResult = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

const isRefreshResult = (arg: any): arg is RefreshResult => {
  if (typeof arg !== "object") {
    return false;
  }
  if (typeof arg.access_token !== "string") {
    return false;
  }
  if (typeof arg.scope !== "string") {
    return false;
  }
  if (typeof arg.token_type !== "string") {
    return false;
  }
  return true;
};

/**
 * リフレッシュトークンを使ってアクセストークンを更新するため accounts.google.com にリクエストを送る。
 * @param option
 */
export const sendRequest2 = async (option: { refreshToken: string; clientId: string; clientSecret: string }) => {
  return new Promise<RefreshResult>((resolve, reject) => {
    const options = {
      hostname: "accounts.google.com",
      port: 443,
      path: "/o/oauth2/token",
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" }
    };

    const req = https.request(options, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk: string) => {
        body += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          //console.log(body);
          const result = JSON.parse(body);
          if (isRefreshResult(result)) {
            resolve(result);
          } else {
            reject(result);
          }
        } else {
          reject(body);
        }
      });
    });

    req.on("error", err => {
      reject(err);
    });

    req.write(`client_id=${option.clientId}`);
    req.write("&");
    req.write(`client_secret=${option.clientSecret}`);
    req.write("&");
    req.write(`refresh_token=${option.refreshToken}`);
    req.write("&");
    req.write("grant_type=refresh_token");
    req.end();
  });
};

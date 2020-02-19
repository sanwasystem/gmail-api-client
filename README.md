gmail-api-client
===============

### これは何か
Gmail APIを叩くためのモジュール。
OAuth認証はあらかじめ済ませてあることが前提。

### 使い方
```js
import GmailClient from "gmail-api-client";
const client = new GmailClient("YOUR_ACCESS_TOKEN");

// これでもOK
const client = new GmailClient("dummy");
await client.refreshAccessToken({ refreshToken, clientId, clientSecret });

// あとは普通に呼べばいい
const labels = await client.getLabels();
```


### OAuth認証
```sh
CLIENT_ID=...
CLIENT_SECRET=...
REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
SCOPE=https://mail.google.com/

echo "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=$SCOPE&access_type=offline" 
```

これでURLを組み立て、ブラウザで開いてOAuth認証する。認証が成功すると `AUTHORIZATION_CODE` が取れる。

スコープについては https://developers.google.com/gmail/api/auth/scopes を参照。`https://mail.google.com/` を指定するとなんでもできる。ラベルだけなら `https://www.googleapis.com/auth/gmail.labels` を使うなど。


```sh
AUTHORIZATION_CODE=...
curl \
  --data "code=$AUTHORIZATION_CODE" \
  --data "client_id=$CLIENT_ID" \
  --data "client_secret=$CLIENT_SECRET" \
  --data "redirect_uri=$REDIRECT_URI" \
  --data "grant_type=authorization_code" \
  --data "access_type=offline" \
  https://www.googleapis.com/oauth2/v4/token
```

これで `access_token` と `refresh_token` が取れる。後者があれば前者は何度でも取得できる。

```sh
REFRESH_TOKEN=...
curl \
  --data "refresh_token=$REFRESH_TOKEN" \
  --data "client_id=$CLIENT_ID" \
  --data "client_secret=$CLIENT_SECRET" \
  --data "grant_type=refresh_token" \
  https://www.googleapis.com/oauth2/v4/token
```

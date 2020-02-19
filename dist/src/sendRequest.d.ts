/**
 * www.googleapis.comに対してリクエストを送る
 * @param path
 * @param bodyIfPost
 */
export default function sendRequest<T>(params: {
    accessToken: string;
    path: string;
    method?: "GET" | "POST" | "DELETE";
    bodyIfPost?: string | object;
    typeGuardFunction?: (arg: any) => arg is T;
}): Promise<T>;
/**
 * アクセストークンのリフレッシュが成功した場合に得られるはずの型
 */
declare type RefreshResult = {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
};
/**
 * リフレッシュトークンを使ってアクセストークンを更新するため accounts.google.com にリクエストを送る。
 * @param option
 */
export declare const sendRequest2: (option: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
}) => Promise<RefreshResult>;
export {};

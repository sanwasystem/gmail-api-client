import GmailClient from "../";
require("dotenv").config();

(async () => {
  // tslint:disable: prefer-type-cast
  const clientId = process.env["client_id"] as string;
  const clientSecret = process.env["client_secret"] as string;
  const refreshToken = process.env["refresh_token"] as string;

  const client = new GmailClient("dummy");
  await client.refreshAccessToken({ refreshToken, clientId, clientSecret });

  switch (process.argv[2]) {
    case "search": {
      const mailIds = await client.searchMailIds(process.argv[3]);
      console.log(mailIds.map(x => x.id).join(", "));
      break;
    }

    case "searchEx": {
      const mailIds = await client.searchMailIds(process.argv[3]);
      for (const mailId of mailIds.slice(0, 3)) {
        const mail = await client.getMailById(mailId.id);
        console.log(`from: ${mail.from}, to: ${mail.to}, subject: ${mail.subject}`);
      }
      break;
    }

    default: {
      console.log("print all labels");
      console.log(await client.getLabels());
      break;
    }
  }
})();

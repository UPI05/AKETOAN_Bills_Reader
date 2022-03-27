const { ImapFlow } = require("imapflow");
const fs = require("fs");

const readMailAndUploadFile = async (host, port, auth) => {
  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth,
  });

  const writePdfFromBase64 = (code, path) => {
    fs.writeFile(path, code, { encoding: "base64" }, async (err, data) => {
      if (err) {
        console.log("err", err);
      }
      console.log("success");
    });
  };

  // Wait until client connects and authorizes
  await client.connect();

  // Select and lock a mailbox. Throws if mailbox does not exist
  let lock = await client.getMailboxLock("INBOX");
  try {
    for await (let message of client.fetch({ seen: false }, { source: true })) {
      const str = message.source.toString();
      const pos = str.search("X-Attachment-Id");

      if (pos === -1) continue;

      let cnt = 0;
      for (let i = pos; i < str.length; i++) {
        if (str[i] == "\n") cnt++;
        if (cnt === 2) {
          let s = "";
          for (let j = i; j < str.length; j++) {
            if (str[j] !== " ") s += str[j];
            else break;
          }
          let tail = "";
          if (str.search("Content-Type: application/pdf") !== -1) tail = ".pdf";
          else if (str.search("Content-Type: text/html") !== -1) tail = ".xml";
          else continue;
          writePdfFromBase64(s, `./downloads/${Date.now()}${tail}`);
          break;
        }
      }
    }
  } finally {
    // Make sure lock is released, otherwise next `getMailboxLock()` never returns
    lock.release();
  }

  // log out and close connection
  await client.logout();
};

readMailAndUploadFile("imap.gmail.com", 993, {
  user: "aketoan12345@gmail.com",
  pass: "",
})
  .then((res) => {
    console.log("done");
  })
  .catch((err) => console.error(err));

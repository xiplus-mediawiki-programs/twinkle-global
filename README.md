# TwinkleGlobal

TwinkleGlobal is a JavaScript application that gives Wikipedians a quick way of performing common maintenance tasks, such as nominating pages for deletion and cleaning up vandalism.

See [User:Xiplus/TwinkleGlobal][] on the Meta-Wiki for more information.

[AzaToth][] is the original author and maintainer of the tool, as well as the `morebits.js` library gadget, which forms the basis for many Wikipedia scripts and editing tools in addition to Twinkle.

## Deployment

Files are deployed to subpages of [User:Xiplus/TwinkleGlobal][] on the Meta-Wiki with `scripts/deploy.js`. Create `scripts/credentials.json` with a [bot password](https://meta.wikimedia.org/wiki/Special:BotPasswords):

```json
{
	"username": "",
	"password": ""
}
```

Then run `npm run deploy`. Use `npm run deploy -- --dry` to only show the differences, or pass file paths (e.g. `npm run deploy -- src/morebits.js`) to deploy only those files.

The credentials file may also set `site` and `base` to deploy elsewhere. To use another credentials file, e.g. `scripts/credentials-test.json`, run `npm run deploy -- --credentials scripts/credentials-test.json`. Command line options override the credentials file.

[User:Xiplus/TwinkleGlobal]: https://meta.wikimedia.org/wiki/User:Xiplus/TwinkleGlobal
[AzaToth]: https://en.wikipedia.org/wiki/User:AzaToth

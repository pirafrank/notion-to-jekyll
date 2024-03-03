# Notion-to-Jekyll

Simple node.js script to convert Notion pages to Jekyll posts.

It uses the official [Notion SDK](https://www.npmjs.com/package/@notionhq/client) to fetch data from Notion, the [notion-to-md](https://github.com/souvikinator/notion-to-md) package to convert pages to markdown. Finally, it performs the necessary checks and adds the required front matter to make it a suitable Jekyll post on the blog.

It is designed to be run by a GitHub Actions workflow on a schedule or triggered by a webhook (via the `repository_dispatch` event).

## Usage

```sh
npm run app
```

## Configuration

The script requires the following environments variables to be set:

- `NOTION_TOKEN` is the Notion integration auth web token.
- `NOTION_DATABASE_ID` is the ID of the Notion database to fetch blog posts from.
- `REPO_DIR` is the root repo dir. It is used to determine the location of the `_posts` and `_drafts` dirs.
- `PUBLISH_TO_POSTS` is a boolean to determine where converted pages should be published to. If `true`, to `_posts` directory. To `_drafts` otherwise.

Assets will always be published to the `static/postimages` directory.

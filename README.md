# Notion-to-Jekyll

A tool to manage Jekyll drafts and posts (including assets) from Notion.

## What it does

- Converts Notion pages to Jekyll markdown
- Extract Notion properties and uses them to create post frontmatter (e.g. Jekyll category and tags)
- Download and persist to Jekyll repo Notion block assets (e.g. images, files, PDFs)
- SEO image compatibility (compatibility depends on your Jekyll post template)
- may a couple of other things I am missing rn.

## How

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
- `JEKYLL_ROOT` is the root of the Jekyll directory. It is used to determine the location of the `_posts` and `_drafts` dirs.
- `PUBLISH_TO_POSTS` is a boolean to determine where converted pages should be published to. If `true`, to `_posts` directory. To `_drafts` otherwise.
- `RELATIVE_DATE` is an int as string to determine the date of post to fetch.
  - `0` means the date will be the current date;
  - a negative number means the date will be the current date minus the number of days;
  - a positive number means the date will be the current date plus the number of days.
- `SITE_URL` is the URL of the website, including protocol. It is used to generate the `permalink` front matter;
- `SITE_BASEURL` is the base URL of the website, appended to `SITE_URL` above;

Optional configuration:

- `NOTION_TO_JEKYLL_USER` is the user used to filter out pages published by this app. This to avoid infinite loops. Defaults to `notion-to-jekyll`.
- `NOTION_PAGE_TYPE` is the type of pages to fetch. Defaults to `Blog post`.
- `NOTION_READY_STATUS` is the status used to filter out pages that are ready to be published. Defaults to `Ready`.
- `NOTION_DONE_STATUS` is the status used to filter out pages that are already published. Defaults to `Done`.

Assets will always be published to the `static/postimages` directory.

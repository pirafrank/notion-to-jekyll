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
- `RELATIVE_DATE` is an int as string to determine the date of post to fetch.
  - `0` means the date will be the current date;
  - a negative number means the date will be the current date minus the number of days;
  - a positive number means the date will be the current date plus the number of days.
- `SITE_URL` is the URL of the website, including protocol. It is used to generate the `permalink` front matter.

Required configuration (optional when running in GitHub Action):

- `JEKYLL_ROOT` is the root of the Jekyll directory. It is used to determine the location of `POSTS_DIR` and `DRAFTS_DIR` among the other things. When running in GitHub Action, it defaults to `${{ github.workspace }}`.

Optional configuration, with default values:

- `SITE_BASEURL` is the base URL of the website, appended to `SITE_URL` above.
- `DRAFTS_DIR` is the Jekyll directory where drafts are stored. Defaults to `_drafts`.
- `POSTS_DIR` is the Jekyll directory where posts are stored. Defaults to `_posts`.
- `ASSETS_DIR` is the Jekyll directory where assets are stored. Defaults to `assets`.
- `PUBLISH_TO_POSTS` is a boolean to determine where converted pages should be published to. If `true`, to `POSTS_DIR` directory. To `DRAFTS_DIR` otherwise.
- `NOTION_TO_JEKYLL_USER` is the user used to filter out pages published by this app. This to avoid infinite loops. Defaults to `notion-to-jekyll`. It must exist in Notion.
- `NOTION_PAGE_TYPE` is the type of pages to fetch. Defaults to `Blog post`. It must exist in Notion.
- `NOTION_READY_STATUS` is the status used to filter out pages that are ready to be published. Defaults to `Ready`. It must exist in Notion.
- `NOTION_DONE_STATUS` is the status used to filter out pages that are already published. Defaults to `Done`. It must exist in Notion.

### Branch policy

- `v1`, production version
- `main`, latest **stable**
- `develop`, latest *edge*
- `feature/*`, development of feature x

## GitHub Action

The script can be run as a step in a GitHub Actions workflow. For example:

```yaml
    - name: Notion to Jekyll
      uses: pirafrank/notion-to-jekyll@v1
      id: notion_to_jekyll
      with:
        notion-token: ${{ secrets.NOTION_TOKEN }}
        notion-database-id: ${{ vars.NOTION_TO_JEKYLL_DATABASE_ID }}
        publish-to-posts: ${{ vars.NOTION_TO_JEKYLL_PUBLISH_TO_POSTS }}
        relative-date: ${{ vars.NOTION_TO_JEKYLL_RELATIVE_DATE }}
        site-url: "https://fpira.com"
        assets-dir: "static/postimages"
```

The action outputs the following variables:

```yaml
    - name: Print output variables
      env:
        # string with space-separated list of changed or added files
        CHANGED: ${{ steps.notion_to_jekyll.outputs.changed }}
        # string with space-separated list of deleted files
        DELETED: ${{ steps.notion_to_jekyll.outputs.deleted }}
        # boolean to string, 'true' if the script is running in dry-run mode
        DRY_RUN: ${{ steps.notion_to_jekyll.outputs.dry-run }}
      run: |
        echo "CHANGED=$CHANGED"
        echo "DELETED=$DELETED"
        echo "DRY_RUN=$DRY_RUN"
```

Check the `action.yml` file for more configuration info.

**Tip:** use it in a scheduled workflow, or in one with a `repository_dispatch` event. This allows you to make it run periodically, or to trigger the workflow via a webhook.

```yaml
on:
  repository_dispatch:
    types: notion-to-jekyll
```

## LICENSE

MIT



interface RemoveMarkdownStatic {
    (src: string): string;
}

declare module "remove-markdown" {
    export = removeMarkdown;
}

declare var removeMarkdown: RemoveMarkdownStatic;

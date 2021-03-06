/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const CWD = process.cwd();
const siteConfig = require(`${CWD}/siteConfig.js`);
const {join} = require('path');
const fs = require('fs-extra');
const React = require('react');
const env = require('./env.js');
const readMetadata = require('./readMetadata.js');
const {insertTOC} = require('../core/toc.js');
const {getPath} = require('../core/utils.js');

function getFile(metadata) {
  if (!metadata) {
    return null;
  }
  let file;
  if (env.versioning.enabled && metadata.original_id) {
    if (env.translation.enabled && metadata.language !== 'en') {
      file = join(CWD, 'translated_docs', metadata.language, metadata.source);
    } else {
      file = join(CWD, 'versioned_docs', metadata.source);
    }
  } else if (env.translation.enabled && metadata.language !== 'en') {
    file = join(CWD, 'translated_docs', metadata.language, metadata.source);
  } else {
    file = join(CWD, '..', readMetadata.getDocsPath(), metadata.source);
  }
  if (!fs.existsSync(file)) {
    return null;
  }
  return fs.readFileSync(file, 'utf8');
}

function mdToHtmlify(oldContent, mdToHtml, metadata) {
  let content = oldContent;
  const mdLinks = [];

  // find any links to markdown files
  const regex = /(?:\]\()(?:\.\/)?([^'")\]\s>]+\.md)/g;
  let match = regex.exec(content);
  while (match !== null) {
    mdLinks.push(match[1]);
    match = regex.exec(content);
  }

  // replace to their website html links
  new Set(mdLinks).forEach(mdLink => {
    let htmlLink = mdToHtml[mdLink];
    if (htmlLink) {
      htmlLink = getPath(htmlLink, siteConfig.cleanUrl);
      htmlLink = htmlLink.replace('/en/', `/${metadata.language}/`);
      htmlLink = htmlLink.replace(
        '/VERSION/',
        metadata.version && metadata.version !== env.versioning.defaultVersion
          ? `/${metadata.version}/`
          : '/'
      );
      content = content.replace(
        new RegExp(`\\]\\((\\./)?${mdLink}`, 'g'),
        `](${htmlLink}`
      );
    }
  });
  return content;
}

function getComponent(rawContent, mdToHtml, metadata) {
  // generate table of contents
  let content = insertTOC(rawContent);

  // replace any links to markdown files to their website html links
  content = mdToHtmlify(content, mdToHtml, metadata);

  // replace any relative links to static assets to absolute links
  content = content.replace(
    /\]\(assets\//g,
    `](${siteConfig.baseUrl}docs/assets/`
  );

  const DocsLayout = require('../core/DocsLayout.js');
  return (
    <DocsLayout
      metadata={metadata}
      language={metadata.language}
      config={siteConfig}>
      {content}
    </DocsLayout>
  );
}

module.exports = {
  getComponent,
  getFile,
  mdToHtmlify,
};

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const cssnano = require('cssnano');
const path = require('path');
const escapeStringRegexp = require('escape-string-regexp');

function getSubDir(file, refDir) {
  const subDir = path.dirname(path.relative(refDir, file)).replace('\\', '/');
  return subDir !== '.' && !subDir.includes('..') ? subDir : null;
}

function getLanguage(file, refDir) {
  const regexSubFolder = new RegExp(
    `${escapeStringRegexp(path.basename(refDir))}/(.*?)/.*`
  );
  const match = regexSubFolder.exec(file);

  // Avoid misinterpreting subdirectory as language
  const env = require('./env.js');
  if (match && env.translation.enabled) {
    const enabledLanguages = env.translation
      .enabledLanguages()
      .map(language => language.tag);
    if (enabledLanguages.indexOf(match[1]) !== -1) {
      return match[1];
    }
  }
  return null;
}

function isSeparateCss(file, separateDirs) {
  if (!separateDirs) {
    return false;
  }
  for (let i = 0; i < separateDirs.length; i++) {
    if (file.includes(separateDirs[i])) {
      return true;
    }
  }
  return false;
}

function minifyCss(cssContent) {
  return cssnano
    .process(cssContent, {
      preset: 'default',
      zindex: false,
    })
    .then(result => result.css);
}

module.exports = {
  getSubDir,
  getLanguage,
  isSeparateCss,
  minifyCss,
};

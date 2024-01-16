const fs = require("fs").promises;
const openApiDiff = require("openapi-diff");
const jsonDiff = require('json-diff');
const fetch = require("node-fetch");
const path = require("path");

module.exports = {
  writeJsonFile: async function writeJsonFile(fileName, jsonData) {
    await fs.writeFile(fileName, JSON.stringify(jsonData, null, 4));
    return jsonData;
  },

  createActualSchemaFileFromUrl: async function createActualSchemaFileFromUrl(schemaUrl, dirnameActualFolderPath) {
    const response = await fetch(schemaUrl);
    const json = await response.json();

    const filePath = path.join(dirnameActualFolderPath, 'swagger.json');
    if (await fs.access(filePath).then(() => true).catch(() => false)) {
      await fs.unlink(filePath);
    }

    await fs.writeFile(filePath, JSON.stringify(json, null, 2));
  },

  getOpenApiDiffResult: async function getOpenApiDiffResult(actualOpenAPI, groundTruthOpenAPI) {
    const result = await openApiDiff.diffSpecs({
      sourceSpec: {
        content: JSON.stringify(groundTruthOpenAPI),
        location: "groundTruthOpenAPI",
        format: "swagger2",
      },
      destinationSpec: {
        content: JSON.stringify(actualOpenAPI),
        location: "actualOpenAPI",
        format: "swagger2",
      },
    });
    return result;
  },

  getJsonDifferenceAndSaveResults: async function getJsonDifferenceAndSaveResults(actualOpenAPI, groundTruthOpenAPI, openApiSchemaName) {
    const resultsFullPathName = 'results/';
    const result = jsonDiff.diff(groundTruthOpenAPI, actualOpenAPI);

    if (result !== undefined) {
      await fs.mkdir(resultsFullPathName, { recursive: true });
      await this.writeJsonFile(path.join(resultsFullPathName, `${openApiSchemaName}-Diff.json`), result);
    }

    return result;
  },

  createResultsFolderAndSaveSchemas: async function createResultsFolderAndSaveSchemas(actualOpenAPI, groundTruthOpenAPI, openApiSchemaName) {
    const resultsFullPathName = 'results/';

    await fs.mkdir(resultsFullPathName, { recursive: true });
    await this.writeJsonFile(path.join(resultsFullPathName, `${openApiSchemaName}-ActualOpenAPI.json`), actualOpenAPI);
    await this.writeJsonFile(path.join(resultsFullPathName, `${openApiSchemaName}-GroundTruthOpenAPI.json`), groundTruthOpenAPI);
  }
};

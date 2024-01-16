const jsonAssertion = require("soft-assert");
const util = require("util");
const helper = require("./helper");
const fs = require("fs").promises;

const openApiSchemaName = 'petstore';
const schemaUrl = 'https://petstore.swagger.io/v2/swagger.json';
const dirnameGroundtruthFolderPath = 'schemas/groundtruth/';
const dirnameActualFolderPath = 'schemas/actual/';

describe('Pet Store API OpenAPI difference tests', async function () {
  it('Pet Store Test', async function () {
    const filenames = await fs.readdir(dirnameGroundtruthFolderPath);

    await helper.createActualSchemaFileFromUrl(schemaUrl, dirnameActualFolderPath)

    await Promise.all(filenames.map(async (file) => {
      const actualFilePath = `${dirnameActualFolderPath}${file}`;
      const groundTruthFilePath = `${dirnameGroundtruthFolderPath}${file}`;

      try {
        const [actualOpenAPI, groundTruthOpenAPI] = await Promise.all([
          fs.readFile(actualFilePath, 'utf8').then(JSON.parse),
          fs.readFile(groundTruthFilePath, 'utf8').then(JSON.parse)
        ]);

        await helper.createResultsFolderAndSaveSchemas(actualOpenAPI, groundTruthOpenAPI, openApiSchemaName);

        const openApiDiffResult = await helper.getOpenApiDiffResult(actualOpenAPI, groundTruthOpenAPI);
        const jsonDifferenceResult = await helper.getJsonDifferenceAndSaveResults(actualOpenAPI, groundTruthOpenAPI, openApiSchemaName, file);

        jsonAssertion.softAssert(openApiDiffResult.breakingDifferencesFound, false, `Warning! - There is a breaking change in your code - ${file}: ${util.inspect(openApiDiffResult, { depth: null })}`);
        jsonAssertion.softAssert(jsonDifferenceResult, undefined, `OpenAPI schema has changed. If change does not break the contract please update the following Groundtruth OpenApi Schema: ${file}`);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }));

    jsonAssertion.softAssertAll();
  }).timeout(120000);
});

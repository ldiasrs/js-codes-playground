import {
  readFile,
  printoutput,
  writeFile,
  formatXml,
} from "../common/commons.js";
import dotenv from "dotenv";

function normalizeXml(xml) {
  const l360Regex = /<cud:CUDLConnectMessage>(.*)<\/cud:CUDLConnectMessage>/;
  const loansPq = /CDATA\[(.*)]]>/;
  const regex = xml.includes("CDATA") ? loansPq : l360Regex;
  const found = regex.exec(xml);
  const match = found ? found[1] : xml;
  let formated = match.replaceAll(`\\""`, `"`);
  formated = formated.replaceAll(`\\"`, `"`);
  formated = formated.replaceAll(`\"`, `"`);
  formated = formated.replaceAll(`&gt;`, `>`);
  formated = formated.replaceAll(`&lt;`, `<`);
  formated = formated.replaceAll(`{"requestBody":"`, ``);
  formated = formated.replaceAll(`"}`, ``);
  console.log(formated);
  return formated;
}

function main() {
  dotenv.config();
  const dirBase = process.env.XML_FORMAT_BASE_DIR;
  const sourceFile = `${dirBase}/test.xml`;
  const targetFile = `${dirBase}/test2.xml`;
  const fileString = readFile(sourceFile);
  const xml = normalizeXml(fileString);
  const formatedXml = formatXml(xml);
  printoutput(formatedXml);
  writeFile(targetFile, formatedXml);
}

main();

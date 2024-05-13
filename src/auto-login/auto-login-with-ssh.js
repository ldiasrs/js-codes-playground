import { launch } from "puppeteer";
import { getAutoLoginData } from "./get-auto-loging-config.js";
import { debug } from "../helpers.js";
import { getURL } from "./config.js";

class UIRobot {
  async clickButton(component) {
    if (component.skip) {
      debug(`Skipping ${component.alias}`);
      return;
    }
    debug(`Clicking on ${component.alias}`);
    await this.page.waitForSelector(component.selector);
    await this.page.click(component.selector);
  }

  async type(component) {
    if (component.skip) {
      debug(`Skipping ${component.alias}`);
      return;
    }
    debug(
      `Typing on input: ${component.alias}, value: ${component.value}, selector: ${component.selector}`
    );
    await this.page.waitForSelector(component.selector);
    await this.page.type(component.selector, component.value);
  }

  async gotToPage(url) {
    if (this.page) {
      debug("Returning existing page" + this.page);
      return this.page;
    }
    debug("Creating new page");
    const browser = await launch({
      headless: false,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      defaultViewport: null,
    });
    this.page = await browser.newPage();
    debug("Returning new page" + this.page);
    debug(`Going to ${url}`);
    await this.page.goto(url);
  }
}

class AutoLoging {
  constructor(appContext) {
    this.appContext = appContext;
    this.robot = appContext.robot;
    this.data = appContext.data;
  }

  async flowWithSSN() {
    await this.robot.gotToPage(this.appContext.url);
    await this.robot.clickButton(this.data.buttons.letsGetStated);
    await this.robot.clickButton(this.data.buttons.dismissTestAlert);
    //CELL PHONE
    await this.robot.type(this.data.inputs.cellPhone);
    await this.robot.clickButton(this.data.buttons.nextCellPhone);
    //VERIFY NUMBER
    await this.robot.type(this.data.inputs.verifyNumber);
    await this.robot.clickButton(this.data.buttons.nextVerifyNumber);
    //SSN
    await this.informSSN();
    await this.robot.clickButton(this.data.buttons.confirmPersonalInfo);
    await this.robot.clickButton(this.data.buttons.memberNumberNext);
    await this.robot.clickButton(this.data.buttons.anualIncomeNext);
  }

  async informSSN() {
    await this.robot.type(this.data.inputs.ssn[1]);
    await this.robot.type(this.data.inputs.ssn[2]);
    await this.robot.type(this.data.inputs.ssn[3]);
    await this.robot.type(this.data.inputs.ssn[4]);
  }
}

const getAppContext = () => {
  const env = process.argv[2];
  const partner = process.argv[3];

  const url = getURL(env, partner);
  debug(`Env: ${env}`);
  debug(`Partner: ${partner}`);
  debug(`URL: ${url}`);

  return {
    url,
    env,
    partner,
    data: getAutoLoginData(env, partner),
    robot: new UIRobot(),
  };
};
new AutoLoging(getAppContext()).flowWithSSN();

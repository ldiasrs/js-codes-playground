export const getURL = (env, partner) => {
  return env === "local"
    ? `http://${partner}.local.clutchapi.com:3002/`
    : `https://${partner}.sandbox.clutchapi.dev/`;
};

export const getEnvConfig = () => {
  return {
    local: localData,
    sandbox: sandboxData,
  };
};

const partnersConfig = {
  skipPartnerConfig: {
    memberNumberNext: ["wingsfinancial"],
  },
  inputsValues: {
    chevronfcu: {
      ssn: "1234",
    },
  },
};

const localData = {
  partnersConfig,
  buttons: {
    letsGetStated: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.bjdjhy > div > div > div > div > div > div > div > div:nth-child(2) > div:nth-child(1) > button",
      alias: "Lets Get Started",
      skip: false,
    },
    dismissTestAlert: {
      selector:
        "#__next > div.SandboxBannerstyled__Container-sc-1m8844-0.gPzDyC > div.SandboxBannerstyled__Content-sc-1m8844-1.SandboxBannerstyled__ContentButton-sc-1m8844-2.gJBCMd.jdaLHp > button",
      alias: "Dismiss Test Alert",
      skip: false,
    },
    nextVerifyNumber: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.a-DNte > div > div > div.LayoutAstyled__ContentStyled-sc-1dlr617-1.cqDLrj > div > div.styled__BottomFixed-sc-95702i-0.muWcc > button",
      alias: "Next Verify Number",
      skip: false,
    },
    nextCellPhone: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.a-DNte > div > div > div.LayoutAstyled__ContentStyled-sc-1dlr617-1.cqDLrj > div > div.styled__BottomFixed-sc-95702i-0.PhoneInputLayoutstyled__BottomFixed-sc-1v81xqu-2.muWcc.hLcflz > div > button",
      alias: "Next Cell Phone",
      skip: false,
    },
    confirmPersonalInfo: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.a-DNte > div > div > div.LayoutAstyled__ContentStyled-sc-1dlr617-1.cqDLrj > div > div > button",
      alias: "Confirm Personal Info",
      skip: false,
    },
    memberNumberNext: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.a-DNte > div > div > div.LayoutAstyled__ContentStyled-sc-1dlr617-1.cqDLrj > div > div > form > button",
      alias: "Member Number Next",
      skip: false,
    },
    anualIncomeNext: {
      selector:
        "#__next > div.styles__DesktopBoundary-sc-g4gvh0-0.a-DNte > div > div > div.LayoutAstyled__ContentStyled-sc-1dlr617-1.cqDLrj > div > div > form > button",
      alias: "Anual Income Next",
      skip: false,
    },
  },
  inputs: {
    cellPhone: {
      selector: "#phone-verification",
      alias: "Cell Phone",
      value: "2242222222",
      skip: false,
    },
    verifyNumber: {
      selector: "#phone-otp-input",
      alias: "Verify number",
      value: "1234",
      skip: false,
    },
    ssn: {
      1: {
        selector:
          '[aria-label="Add serial input for ssn confirmation"][data-id="0"]',
        alias: "SSN 1",
        value: "1",
        skip: false,
      },
      2: {
        selector:
          '[aria-label="Add serial input for ssn confirmation"][data-id="1"]',
        alias: "SSN 2",
        value: "1",
        skip: false,
      },
      3: {
        selector:
          '[aria-label="Add serial input for ssn confirmation"][data-id="2"]',
        alias: "SSN 3",
        value: "2",
        skip: false,
      },
      4: {
        selector:
          '[aria-label="Add serial input for ssn confirmation"][data-id="3"]',
        alias: "SSN 4",
        value: "2",
        skip: false,
      },
    },
  },
};

const sandboxData = localData;

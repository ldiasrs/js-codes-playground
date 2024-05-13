export const getURL = (env, partner) => {
  return env === "local"
    ? `http://${partner}.local.api.com:3002/`
    : `https://${partner}.sandbox.api.dev/`;
};

export const getEnvConfig = () => {
  return {
    local: localData,
    sandbox: sandboxData,
  };
};

const partnersConfig = {
  skipPartnerConfig: {
    memberNumberNext: ["mypartner"],
  },
  inputsValues: {
    mypartner: {
      ssn: "1234",
    },
  },
};

const localData = {
  partnersConfig,
  buttons: {
    myButtonName: {
      selector: "<SELECTOR>",
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
  },
};

const sandboxData = localData;

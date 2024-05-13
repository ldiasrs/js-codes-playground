import { getEnvConfig } from "./config.js";

export const getAutoLoginData = (env, partnerId) => {
  const envData = getEnvConfig()[env];
  overrideSkips(partnerId, envData);
  overrideInputValues(partnerId, envData);
  return envData;
};

function overrideSkips(partnerId, data) {
  Object.keys(data.partnersConfig.skipPartnerConfig).forEach((key) => {
    const skip = data.partnersConfig.skipPartnerConfig[key].find(
      (p) => p === partnerId
    );
    if (skip) {
      data.buttons[key].skip = true;
    }
  });
}

function overrideInputValues(partnerId, data) {
  const existValuesForThesePartner = Object.keys(
    data.partnersConfig.inputsValues
  ).find((partnerKey) => partnerKey === partnerId);
  if (existValuesForThesePartner) {
    const partnerInputValues = data.partnersConfig.inputsValues[partnerId];
    Object.keys(partnerInputValues).forEach((key) => {
      data.inputs[key].value = partnerInputValues[key];
    });
  }
}

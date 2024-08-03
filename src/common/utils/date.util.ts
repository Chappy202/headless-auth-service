export const getUtcDate = (): Date => {
  return new Date(new Date().toUTCString());
};

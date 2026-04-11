// Infrastructure configuration

export const config = {
  temporal: {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: 'default',
  },
};

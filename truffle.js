// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: "0.0.0.0",
      port: 9545,
      gas: 4000000,
      network_id: "*"
    },
  }
}

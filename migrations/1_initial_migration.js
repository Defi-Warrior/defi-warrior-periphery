const Migrations = artifacts.require("Migrations");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = function (deployer) {
  // deployer.deploy(Migrations);
  deployer.deploy(UniswapV2Router02, 
                  "0xE24BD7057F9D33865E2E6a8B2ffB886cadd05105", 
                  "0x95bF710aF7311Fa22D7e4BED3cDBa2D1F0e36564", 
                  "0xC84CcED3daB99440c478787D82ccE5e402334b81",
                  {gas: 6000000});
};

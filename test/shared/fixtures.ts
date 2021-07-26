import { Wallet, Contract } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import UniswapV2Factory from '@defi-warrior/core/build/UniswapV2Factory.json'
import IDefiWarriorPair from '@defi-warrior/core/build/IDefiWarriorPair.json'
import PriceFeed from '@defi-warrior/core/build/PriceFeed.json'
import NFTWarriror from '@defi-warrior/core/build/NFTWarrior.json'
import UniswapV2Library from '../../build/UniswapV2Library.json';

import ERC20 from '../../build/ERC20.json'
import WETH9 from '../../build/WETH9.json'
import UniswapV2Router02 from '../../build/UniswapV2Router02.json'

const overrides = {
  gasLimit: 9999999
}

interface V1Fixture {
  token0: Contract
  token1: Contract
  factory: Contract
  router: Contract
  nftFactory: Contract
}

interface V2Fixture {
    token0: Contract
    token1: Contract
    oracle0: Contract
    oracle1: Contract
    WETH: Contract
    WETHPartner: Contract
    factory: Contract
    router: Contract
    pair: Contract
    WETHPair: Contract,
    nftFactory: Contract
}

export async function v1Fixture(provider: Web3Provider, [wallet, other]: Wallet[]): Promise<V1Fixture> {
  let token0 = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  let token1 = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const WETH = await deployContract(wallet, WETH9)
  const nftFactory = await deployContract(wallet, NFTWarriror, ["Defi Warrior", "FIWA"], overrides);

  // deploy factory
  const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address])

  // deploy routers
  const router = await deployContract(wallet, UniswapV2Router02, [factory.address, nftFactory.address, WETH.address], overrides)

  await token0.approve(router.address, expandTo18Decimals(1000))
  await token1.approve(router.address, expandTo18Decimals(1000))
  return {
    token0,
    token1,
    factory,
    router,
    nftFactory
  }
}
export async function v2Fixture(provider: Web3Provider, [wallet, other]: Wallet[]): Promise<V2Fixture> {
  // deploy tokens
  let tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  let tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

  const WETH = await deployContract(wallet, WETH9)
  const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const oracle0 = await deployContract(wallet, PriceFeed, ["FIWA"])
  const oracle1 = await deployContract(wallet, PriceFeed, ["BTC"])

  const nftFactory = await deployContract(wallet, NFTWarriror, ["Defi Warrior", "FIWA"], overrides);

  // deploy factory
  const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address])

  // deploy routers
  const router = await deployContract(wallet, UniswapV2Router02, [factory.address, nftFactory.address, WETH.address], overrides)

  await nftFactory.setRouter(router.address);

  // initialize V2
  await factory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IDefiWarriorPair.abi), provider).connect(wallet)

  await factory.setPriceFeeds(tokenA.address, oracle0.address, tokenB.address, oracle1.address);

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factory.createPair(WETH.address, WETHPartner.address)

  const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IDefiWarriorPair.abi), provider).connect(wallet)

  await token0.transfer(other.address, expandTo18Decimals(100))
  await token1.transfer(other.address, expandTo18Decimals(100))

  await token0.approve(router.address, expandTo18Decimals(1000))
  await token1.approve(router.address, expandTo18Decimals(1000))

  return {
    token0,
    token1,
    oracle0,
    oracle1,
    WETH,
    WETHPartner,
    factory,
    router,
    pair,
    WETHPair,
    nftFactory
  }
}



// interface V2Fixture {
//   token0: Contract
//   token1: Contract
//   WETH: Contract
//   WETHPartner: Contract
//   factoryV1: Contract
//   factoryV2: Contract
//   router01: Contract
//   router02: Contract
//   routerEventEmitter: Contract
//   router: Contract
//   migrator: Contract
//   WETHExchangeV1: Contract
//   pair: Contract
//   WETHPair: Contract
// }

// export async function v2Fixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<V2Fixture> {
//   // deploy tokens
//   const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
//   const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
//   const WETH = await deployContract(wallet, WETH9)
//   const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

//   // deploy V1
//   const factoryV1 = await deployContract(wallet, UniswapV1Factory, [])
//   await factoryV1.initializeFactory((await deployContract(wallet, UniswapV1Exchange, [])).address)

//   // deploy V2
//   const factoryV2 = await deployContract(wallet, UniswapV2Factory, [wallet.address])

//   // deploy routers
//   const router01 = await deployContract(wallet, UniswapV2Router01, [factoryV2.address, WETH.address], overrides)
//   const router02 = await deployContract(wallet, UniswapV2Router02, [factoryV2.address, WETH.address], overrides)

//   // event emitter for testing
//   const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])

//   // deploy migrator
//   const migrator = await deployContract(wallet, UniswapV2Migrator, [factoryV1.address, router01.address], overrides)

//   // initialize V1
//   await factoryV1.createExchange(WETHPartner.address, overrides)
//   const WETHExchangeV1Address = await factoryV1.getExchange(WETHPartner.address)
//   const WETHExchangeV1 = new Contract(WETHExchangeV1Address, JSON.stringify(UniswapV1Exchange.abi), provider).connect(
//     wallet
//   )

//   // initialize V2
//   await factoryV2.createPair(tokenA.address, tokenB.address)
//   const pairAddress = await factoryV2.getPair(tokenA.address, tokenB.address)
//   const pair = new Contract(pairAddress, JSON.stringify(IDefiWarriorPair.abi), provider).connect(wallet)

//   const token0Address = await pair.token0()
//   const token0 = tokenA.address === token0Address ? tokenA : tokenB
//   const token1 = tokenA.address === token0Address ? tokenB : tokenA

//   await factoryV2.createPair(WETH.address, WETHPartner.address)
//   const WETHPairAddress = await factoryV2.getPair(WETH.address, WETHPartner.address)
//   const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IDefiWarriorPair.abi), provider).connect(wallet)

//   return {
//     token0,
//     token1,
//     WETH,
//     WETHPartner,
//     factoryV1,
//     factoryV2,
//     router01,
//     router02,
//     router: router02, // the default router, 01 had a minor bug
//     routerEventEmitter,
//     migrator,
//     WETHExchangeV1,
//     pair,
//     WETHPair
//   }
// }

import { Wallet, Contract } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import DefiWarriorFactory from '@defi-warrior/core/build/DefiWarriorFactory.json'
import IDefiWarriorPair from '@defi-warrior/core/build/IDefiWarriorPair.json'
import NFTWarriror from '@defi-warrior/core/build/DefiWarrior.json'
import GemFactory from '@defi-warrior/farm/build/GemFactory.json'
import MintableBEP20Token from '@defi-warrior/farm/build/MintableBEP20Token.json'

import ERC20 from '../../build/ERC20.json'
import WETH9 from '../../build/WETH9.json'
import DefiWarriorRouter from '../../build/DefiWarriorRouter.json'

const overrides = {
  gasLimit: 9999999
}

interface V2Fixture {
    token0: Contract
    token1: Contract
    WETH: Contract
    WETHPartner: Contract
    factory: Contract
    router: Contract
    pair: Contract
    WETHPair: Contract
}

export async function v2Fixture(provider: Web3Provider, [wallet, other]: Wallet[]): Promise<V2Fixture> {
  // deploy tokens
  let tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  let tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

  const WETH = await deployContract(wallet, WETH9)
  const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

  // deploy factory
  const factory = await deployContract(wallet, DefiWarriorFactory, [wallet.address])

  // deploy routers
  const router = await deployContract(wallet, DefiWarriorRouter, [factory.address, WETH.address], overrides)

  // initialize V2
  await factory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IDefiWarriorPair.abi), provider).connect(wallet)

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
    WETH,
    WETHPartner,
    factory,
    router,
    pair,
    WETHPair
  }
}
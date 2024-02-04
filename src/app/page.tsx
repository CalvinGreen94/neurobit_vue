'use client';
// import * as React from 'react'
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './styles.css';
import { useSpring, useTransform } from 'framer-motion';

import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { query as q, Client } from 'faunadb';
// import { SendTransaction } from './components/send_transaction';
import {
  type BaseError,
  useSendTransaction,
  useWaitForTransactionReceipt
} from 'wagmi'
import { parseEther } from 'viem'
import * as Dialog from '@radix-ui/react-dialog';
import { useTransition, animated, config } from 'react-spring';
const client = new Client({ secret: process.env.NEXT_PUBLIC_FAUNA_SECRET_KEY, domain: 'db.us.fauna.com' });

// Define PredictionData type
interface PredictionData {
  pair: string;
  predicted_price: string;
  buy_price: string;
  sell_price: string;
  context: string;
  resp: string;
  side: string;
  predicted_balance: string;
}

interface PortfolioData {
  // pair: string;
  // predicted_price: string;
  // buy_price: string;
  // sell_price: string;
  // context: string;
  // resp: string;
  // side: string;
  // predicted_balance: string;
  name: string;
  value: string;
}



function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    closeModal();
  };
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);
  const openAboutModal = () => setAboutModalOpen(true);
  const closeAboutModal = () => setAboutModalOpen(false);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from FaunaDB
        const result: any = await client.query(
          q.Map(
            q.Paginate(q.Documents(q.Collection('NeuroBit'))),
            q.Lambda('x', q.Get(q.Var('x')))
          )
        );

        // Process data
        const data = result.data[0]?.data;

        if (data) {
          const pair = data.pair || '';
          const pred = data.predicted_price || '';
          const buy = data.current_buy || '';
          const sell = data.current_sell || '';
          const context = data.context || '';
          const resp = data.response || '';
          const side = data.side || '';
          const predicted_balance = data.predicted_balance || '';

          setPredictionData({
            pair: pair,
            predicted_price: pred,
            buy_price: buy,
            sell_price: sell,
            context: context,
            resp: resp,
            side: side,
            predicted_balance: predicted_balance
          });
        }
      } catch (error) {
        console.error('Error fetching data from FaunaDB:', (error as Error).message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from FaunaDB based on the account address
        const result: any = await client.query(
          q.Get(
            q.Match(q.Index('portfolio_by_address'), account.address)
          )
        );

        // Process data
        const data = result.data;
        const name = data.name || '';
        // Convert null value to '0'
        const value = data.value || 0;

        // Set portfolio data
        setPortfolioData({
          name: name,
          value: value
        });
      } catch (error) {
        console.error('Error fetching data from FaunaDB:', (error as Error).message);
      }
    };

    if (account.address) {
      fetchData();
    }
  }, [account.address]);


  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // Fetch data from FaunaDB
  //       const result: any = await client.query(
  //         q.Map(
  //           q.Paginate(q.Documents(q.Collection('Portfolio'))),
  //           q.Lambda('x', q.Get(q.Var('x')))
  //         )
  //       );

  //       // Process data
  //       const data = result.data[0]?.data;

  //       if (data) {
  //         const name = data.name || '';
  //         const value = data.value || '';


  //         setPortfolioData({
  //           name:name,
  //           value:value
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Error fetching data from FaunaDB:', (error as Error).message);
  //     }
  //   };

  //   fetchData();
  // }, []);





  var createP = client.query(
    q.Create(
      q.Collection('bitvue_addresses'),
      { data: { name: account.addresses } }
    )
  );
  createP.then(function (response) {
    console.log(response);
  });

  const {
    data: hash,
    // error, 
    isPending,
    sendTransaction
  } = useSendTransaction()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const to = '0x34A98960a48082506357EdEb39EebC9cD390d2Ad'
    const value = formData.get('value') as string
    sendTransaction({ to, value: parseEther(value) })
    var createT = client.query(
      q.Create(
        q.Collection('Transfers'),
        { data: { name: account.addresses, hash: hash, value: value, isPending: isPending, isLoading: isConfirming, isSuccess: isConfirmed } }
      )
    );
    createT.then(function (response) {
      console.log(response);
    });

  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,

    })

  // var createP = client.query(
  //   q.Create(
  //     q.Collection('Trades'),
  //     { data: { name: account.addresses, } }
  //   )
  // );
  // createP.then(function (response) {
  //   console.log(response);
  // });

  return (
    <>

      {account.status == 'connected' && (
        <div className='portfolio'>
          <div className='predictionData'>
            <div className="logo-container"></div>

            <button className="register-button4" type="button" onClick={() => disconnect()}><div className='disconnection'>Disconnect Wallet</div> <br />Liqiuidity Address: 0x34A98960a48082506357EdEb39EebC9cD390d2Ad <br />
              {/* {portfolioData && ( // Check if portfolioData exists
                <div>
                  <p>Name: {portfolioData.name}</p>
                  <p>Value: {portfolioData.value}</p>
                </div>
              )} */}

              Bot Liquidity: {predictionData.predicted_balance}
              </button>
            {account.address}

            {/* {portfolioData.value} */}
            {/* <button className="register-button2" type="button">Liqiuidity Address: 0x34A98960a48082506357EdEb39EebC9cD390d2Ad</button> */}

          </div></div>)}

      {account.status !== 'connected' && (
        <div className='portfolio'>
          <div className='predictionData'>

            <button className="register-button4" type="button" onClick={openModal}>Connect Wallet</button>
            {/* <button className="register-button2" type="button">Liqiuidity Address: 0x34A98960a48082506357EdEb39EebC9cD390d2Ad</button> */}

          </div></div>)}


      {/* <br/>
      <br/><br/> */}
      {/* <br/><br/>
      <br/><br/> */}
      {/* <br/><br/>
      <br/><br/> */}

      <div className='portfolio'>
        {/* <h2>Account</h2> */}
        {/* <br /> */}

        <div className='predictionData'>
          {/* About Button */}
          <button className="register-button3" type="button" onClick={openAboutModal}>
            About
          </button>
          {/* About Modal */}
          <Modal
            isOpen={isAboutModalOpen}
            onRequestClose={closeAboutModal}
            contentLabel="About Modal"
            className="register-button2"

          >

            {/* <button className="register-button2" type="button"> */}


            Welcome to the unparalleled realm of NeuroBit – a convergence where the cutting-edge prowess of Deep Learning harmonizes with Crypto Market Excellence.
            <br />
            <br />🚀 **Who We Are: Unleashing Market Mastery**

            Embark on a journey with NeuroBit, where our unyielding mission is to empower crypto enthusiasts, traders, and investors with nothing short of extraordinary market insights. Our arsenal? A seismic deep learning algorithm meticulously crafted on the Keras framework, seamlessly entwined with the Coinbase Advanced Brokerage API for the pinnacle of trading execution. <br /><br />

            <br />🌟 **What Sets Us Apart: The Epitome of Innovation**

            **Cutting-edge Deep Learning Algorithm**

            Behold the beating heart of NeuroBit – a state-of-the-art deep learning algorithm that transcends traditional market analysis. With the omnipotent capabilities of Keras, we delve into the abyss of complex patterns and trends, unveiling precise and accurate forecasts that redefine the game.

            **Trades on Coinbase Advanced Brokerage API**

            NeuroBit isn't just about predictions; it's a force that empowers immediate action. Our API seamlessly fuses with the Coinbase Advanced Brokerage API, granting users the power to execute trades based on our unwavering market forecasts directly within the hallowed grounds of the Coinbase platform.

            **Accurate Market Predictions**

            In the relentless tempo of the crypto cosmos, reliability is our hallmark. NeuroBit amalgamates historical data, market indicators, and real-time information to birth predictions that transcend the ordinary, facilitating informed decision-making in the ever-shifting markets.

            **User-friendly API Integration**

            Simplicity is etched into the DNA of NeuroBit. Crafted for effortless integration into existing applications and platforms, our API is a symphony for developers, traders, and researchers alike – an experience where accessing and implementing our potent forecasting capabilities is as seamless as a breath. <br /><br />

            <br />💡 **Comprehensive Funding Objectives: Nurturing Excellence**

            Why do we crave funding? NeuroBit dances on the stage of continuous improvement and sustained excellence, with funding as its guardian angel.

            - **Research and Development:** A relentless quest for perfection, constantly refining and enhancing our deep learning algorithm.

            - **Market Data and Infrastructure Costs:** Covering the expenses of acquiring and processing real-time market data, and maintaining an infrastructure that stands tall.

            - **Integration and Compatibility:** A vow to ensure seamless compatibility with external platforms and the dynamic interfaces of the market.

            - **Security Measures:** A fortress of security, tirelessly implemented and maintained to safeguard the sanctity of user data.

            - **User Support and Education:** A pledge to offer stellar user support and educational resources, ensuring the effective utilization of our API.

            - **Marketing and Outreach:** A strategic war chest, aimed at increasing awareness and adoption through relentless marketing and outreach endeavors.

            - **Regulatory Compliance:** A commitment to adapt and evolve, navigating the ever-changing regulatory landscapes to ensure compliance.

            - **Continuous Improvement:** An unyielding dedication to progress, with updates and improvements sculpted based on user feedback and the ever-shifting tides of market trends. <br /><br />

            <br />🌐 **Our Vision: Illuminating the Crypto Horizon**

            In the grand tapestry of NeuroBit, we envision a future where individuals and businesses navigate the crypto market with unwavering confidence. Your support, in the form of funding, fuels our commitment to innovation, security, and the empowerment of every user who dares to dream in the realm of crypto.<br /><br />

            <br />🚀 **Get Started with NeuroBit: A Gateway to the Future**

            Are you ready to unravel the mysteries of crypto market forecasting and trading? Seize the moment – sign up for NeuroBit API today and unlock a new dimension of insights and predictions, where the future is not a mystery but a canvas waiting for your bold strokes. The future is NeuroBit.


            {/* </button > */}
            {/* Add About content here */}
          </Modal>
          {/* status: {account.status}
          <br />
          address: {account.addresses}
         </div> */}
          {/* <br /> */}
          {account.status === 'connected' && (
            <button className="register-button2" type="button">
              {/* Disconnect<br /> */}
              {/* {account.addresses} */}
              <br />
              {/* {account.status} */}
              <form onSubmit={submit}>
                <input name="value" placeholder="0.05" required />
                <button
                  className="buttonbuy"
                  disabled={isPending}
                  type="submit"
                >
                  <h3>{isPending ? 'Confirming...' : 'Initiate'} </h3>
                </button>

                {hash && <div>Transaction Hash: {hash}</div>}
                {isConfirming && <div>Waiting for confirmation...</div>}
                {isConfirmed && <div>Transaction confirmed.</div>}

                {error && (
                  <div>Error: {(error as BaseError).shortMessage || error.message}</div>
                )}
              </form>
              <div className='respSection'>
                {/* <p> Response</p> */}

                {predictionData && (
                  <>
                    <p>{predictionData.resp}</p>

                    <br />
                    {/* <div className='balanceBox2'> */}

                    <h3>Predicted Price</h3>


                    <p>{predictionData.predicted_price}</p>
                    {/* <button className="buttonbuy" type="button">
                Initiate Neurobit */}
                    {predictionData && (
                      <>
                        <br />
                        {/* Bot Liquidity: {predictionData.predicted_balance} */}
                        {/* <div className='balanceBox'> */}
                        <h3>Buy Price</h3>
                        <p>{predictionData.buy_price}</p>
                        {/* </div> */}
                        {/* <div className='balanceBox'> */}
                        <h3>Sell Price</h3>
                        <p>{predictionData.sell_price}</p>
                        {/* </div> */}
                        {/* <div className='balanceBox'> */}
                        <h3>Order Side</h3>
                        <p>{predictionData.side}</p>
                        {/* </div> */}
                      </>
                    )}
                    {/* <SendTransaction/> */}
                    {/* </button> */}
                    {/* </div> */}

                    {/* <div className='predictionData'> */}
                    {/* </div> */}

                  </>
                )}
              </div>
            </button>

          )
          }
          <br />
          <br />
          <br />
          <br />
          <br />                <br />
          <br />
          <br />

          {account.status !== 'connected' && (
            <button className="register-button2" type="button">
              {/* Connect<br /> Wallet */}
              <br />

              {/* <div className='respSection'> */}
              {/* <p>{predictionData.resp}</p> */}
              {/* </div> */}
              <div className='respSection'>
                {/* <p> Response</p> */}
                {/* <form onSubmit={submit}>
                  0x34A98960a48082506357EdEb39EebC9cD390d2Ad
                  <input name="value" placeholder="0.05" required />
                  <button
                    className="buttonbuy"
                    disabled={isPending}
                    type="submit"
                  >
                    <h3>{isPending ? 'Confirming...' : 'Initiate'} </h3>
                  </button>
                  {hash && <div>Transaction Hash: {hash}</div>}
                  {isConfirming && <div>Waiting for confirmation...</div>}
                  {isConfirmed && <div>Transaction confirmed.</div>}
                  {error && (
                    <div>Error: {(error as BaseError).shortMessage || error.message}</div>
                  )}
                </form> */}
                {predictionData && (
                  <>
                    {predictionData.resp}

                    <br />
                    {/* <div className='balanceBox2'> */}

                    <h3>Predicted Price</h3>


                    <p>{predictionData.predicted_price}</p>
                    {/* <button className="buttonbuy" type="button">
                Initiate Neurobit */}
                    {predictionData && (
                      <>
                        <br />
                        {/* Bot Liquidity: {predictionData.predicted_balance} */}
                        {/* <div className='balanceBox'> */}
                        <h3>Buy Price</h3>
                        <p>{predictionData.buy_price}</p>
                        {/* </div> */}
                        {/* <div className='balanceBox'> */}
                        <h3>Sell Price</h3>
                        <p>{predictionData.sell_price}</p>
                        {/* </div> */}
                        {/* <div className='balanceBox'> */}
                        <h3>Order Side</h3>
                        <p>{predictionData.side}</p>
                        {/* </div> */}
                      </>
                    )}
                    {/* <SendTransaction/> */}
                    {/* </button> */}
                    {/* </div> */}

                    {/* <div className='predictionData'> */}
                    {/* </div> */}

                  </>
                )}
              </div>
            </button>
          )}

        </div>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Connect Wallet Modal"
          className="register-button2"
        >
          <h2>Connect Wallet</h2>
          {connectors.map((connector) => (
            <button
              className="register-button"
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              type="button"
            >
              {connector.name}
            </button>
          ))}
          <div>{status}</div>
          <div>{error?.message}</div>
        </Modal>
      </div >
      {/* <br /> */}
    </>
  );
}

export default App;
